package bd.ac.uiu.smartcampus.service;

import bd.ac.uiu.smartcampus.dto.AdminStudentDetailDto;
import bd.ac.uiu.smartcampus.dto.AdminStudentDto;
import bd.ac.uiu.smartcampus.dto.AdminStudentUpdateRequest;
import bd.ac.uiu.smartcampus.model.*;
import bd.ac.uiu.smartcampus.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminStudentService {

    private final UserRepository userRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final ClassEnrollmentRepository enrollmentRepository;
    private final AttendanceSessionRepository sessionRepository;
    private final AttendanceRecordRepository recordRepository;
    private final AdminUserService adminUserService;
    private final AdminActionLogRepository actionLogRepository;

    public AdminStudentService(UserRepository userRepository,
                               StudentProfileRepository studentProfileRepository,
                               ClassEnrollmentRepository enrollmentRepository,
                               AttendanceSessionRepository sessionRepository,
                               AttendanceRecordRepository recordRepository,
                               AdminUserService adminUserService,
                               AdminActionLogRepository actionLogRepository) {
        this.userRepository = userRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.sessionRepository = sessionRepository;
        this.recordRepository = recordRepository;
        this.adminUserService = adminUserService;
        this.actionLogRepository = actionLogRepository;
    }

    public List<AdminStudentDto> searchStudents(String search, Boolean active, String department) {
        search = trimToNull(search);
        department = trimToNull(department);
        
        List<User> students = userRepository.searchUsers(search, Role.ROLE_STUDENT, active);
        
        if (department != null) {
            String finalDepartment = department;
            students = students.stream()
                    .filter(s -> finalDepartment.equalsIgnoreCase(s.getDepartment()))
                    .collect(Collectors.toList());
        }

        if (students.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> studentIds = students.stream().map(User::getId).collect(Collectors.toList());
        Map<Long, Integer> semesterByStudentId = studentProfileRepository.findByUserIdIn(studentIds).stream()
                .collect(Collectors.toMap(profile -> profile.getUser().getId(), StudentProfile::getSemester));
        Map<Long, Long> enrollmentCountByStudentId = enrollmentRepository.countActiveEnrollmentsByStudentIds(studentIds).stream()
                .collect(Collectors.toMap(row -> (Long) row[0], row -> (Long) row[1]));
        Map<Long, List<ClassEnrollment>> enrollmentsByStudentId = enrollmentRepository.findByStudentInAndActiveTrue(students).stream()
                .collect(Collectors.groupingBy(enrollment -> enrollment.getStudent().getId()));
        Map<Long, Double> attendanceByStudentId = calculateAttendancePercentages(students, enrollmentsByStudentId);

        return students.stream().map(student -> {
            Integer semester = semesterByStudentId.get(student.getId());
            long courseCount = enrollmentCountByStudentId.getOrDefault(student.getId(), 0L);
            Double attendancePercentage = attendanceByStudentId.get(student.getId());
            return new AdminStudentDto(student, semester, courseCount, attendancePercentage);
        }).collect(Collectors.toList());
    }

    public List<String> getStudentDepartments() {
        return userRepository.findDistinctDepartmentsByRole(Role.ROLE_STUDENT).stream()
                .map(this::trimToNull)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
    }
    
    public Map<String, Object> getStudentSummary() {
        long total = userRepository.countByRole(Role.ROLE_STUDENT);
        long activeCount = userRepository.countByRoleAndActiveTrue(Role.ROLE_STUDENT);
        long disabled = total - activeCount;
        long enrolledCount = enrollmentRepository.countDistinctActiveStudentsByRole(Role.ROLE_STUDENT);

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalStudents", total);
        summary.put("activeStudents", activeCount);
        summary.put("disabledStudents", disabled);
        summary.put("enrolledStudents", enrolledCount);
        return summary;
    }

    public AdminStudentDetailDto getStudentDetail(Long id) {
        User student = requireStudent(id);

        Integer semester = studentProfileRepository.findByUserId(student.getId())
                .map(StudentProfile::getSemester).orElse(null);

        List<ClassEnrollment> enrollments = enrollmentRepository.findByStudentAndActiveTrue(student);
        
        List<AdminStudentDetailDto.EnrollmentInfo> enrollmentInfos = enrollments.stream()
                .map(e -> new AdminStudentDetailDto.EnrollmentInfo(
                        e.getCourseCode(), e.getSectionName(), e.getTeacher().getFullName()))
                .collect(Collectors.toList());

        AdminStudentDetailDto.AttendanceSummary attendanceSummary = calculateGlobalAttendanceSummary(student.getStudentOrEmpId(), enrollments);

        return new AdminStudentDetailDto(student, semester, enrollmentInfos, attendanceSummary);
    }

    @Transactional
    public AdminStudentDetailDto updateStudentProfile(Long id, AdminStudentUpdateRequest request, String adminEmail) {
        User student = requireStudent(id);
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Student profile request is required");
        }

        // Update User safe fields
        if (request.getFullName() != null) {
            String fullName = trimToNull(request.getFullName());
            if (fullName == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Full name cannot be blank");
            }
            student.setFullName(fullName);
        }
        if (request.getDepartment() != null) {
            student.setDepartment(trimToNull(request.getDepartment()));
        }
        if (request.getSemester() != null && (request.getSemester() < 1 || request.getSemester() > 20)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Semester must be between 1 and 20");
        }
        userRepository.save(student);

        // Update StudentProfile
        StudentProfile profile = studentProfileRepository.findByUserId(student.getId())
                .orElse(new StudentProfile(student, null));
        profile.setSemester(request.getSemester());
        studentProfileRepository.save(profile);

        AdminActionLog log = new AdminActionLog(adminEmail, "STUDENT_PROFILE_UPDATED", 
                "Updated profile for student: " + student.getEmail());
        actionLogRepository.save(log);

        return getStudentDetail(id);
    }

    @Transactional
    public void toggleStudentStatus(Long id, boolean active, String currentAdminEmail) {
        requireStudent(id);
        adminUserService.toggleUserStatus(id, active, currentAdminEmail);
    }

    private AdminStudentDetailDto.AttendanceSummary calculateGlobalAttendanceSummary(String studentId, List<ClassEnrollment> enrollments) {
        long presentCount = 0;
        long lateCount = 0;
        long absentCount = 0;
        long totalCompletedSessions = 0;

        for (ClassEnrollment enrollment : enrollments) {
            List<AttendanceSession> completedSessions = sessionRepository.findCompletedSessionsByTeacherAndCourse(
                    enrollment.getTeacher().getEmail(), enrollment.getCourseCode(), enrollment.getSectionName());
            
            totalCompletedSessions += completedSessions.size();
            
            if (!completedSessions.isEmpty()) {
                List<Object[]> stats = recordRepository.countGroupedByStudentAndStatus(completedSessions);
                for (Object[] row : stats) {
                    String sId = (String) row[0];
                    if (Objects.equals(studentId, sId)) {
                        AttendanceStatus stat = (AttendanceStatus) row[1];
                        Long count = (Long) row[2];
                        if (stat == AttendanceStatus.PRESENT) presentCount += count;
                        else if (stat == AttendanceStatus.LATE) lateCount += count;
                        else if (stat == AttendanceStatus.ABSENT) absentCount += count;
                    }
                }
            }
        }

        Double percentage = null;
        if (totalCompletedSessions > 0) {
            percentage = Math.round(((presentCount + lateCount) * 10000.0 / totalCompletedSessions)) / 100.0;
        }

        return new AdminStudentDetailDto.AttendanceSummary(presentCount, lateCount, absentCount, percentage);
    }

    private Double calculateGlobalAttendancePercentage(String studentId, List<ClassEnrollment> enrollments) {
        return calculateGlobalAttendanceSummary(studentId, enrollments).getAttendancePercentage();
    }

    private Map<Long, Double> calculateAttendancePercentages(List<User> students,
                                                             Map<Long, List<ClassEnrollment>> enrollmentsByStudentId) {
        Map<Long, AttendanceTotals> totalsByStudentId = new HashMap<>();
        Map<String, List<AttendanceSession>> sessionsByClass = new HashMap<>();
        Map<String, Map<String, Map<AttendanceStatus, Long>>> statsByClass = new HashMap<>();

        for (User student : students) {
            AttendanceTotals totals = new AttendanceTotals();
            for (ClassEnrollment enrollment : enrollmentsByStudentId.getOrDefault(student.getId(), Collections.emptyList())) {
                String key = classKey(enrollment);
                List<AttendanceSession> sessions = sessionsByClass.computeIfAbsent(key, ignored ->
                        sessionRepository.findCompletedSessionsByTeacherAndCourse(
                                enrollment.getTeacher().getEmail(),
                                enrollment.getCourseCode(),
                                enrollment.getSectionName()));
                totals.totalCompletedSessions += sessions.size();

                if (!sessions.isEmpty()) {
                    Map<String, Map<AttendanceStatus, Long>> stats = statsByClass.computeIfAbsent(key, ignored ->
                            recordRepository.countGroupedByStudentAndStatus(sessions).stream()
                                    .collect(Collectors.groupingBy(
                                            row -> (String) row[0],
                                            Collectors.toMap(row -> (AttendanceStatus) row[1], row -> (Long) row[2]))));
                    Map<AttendanceStatus, Long> studentStats = stats.getOrDefault(student.getStudentOrEmpId(), Collections.emptyMap());
                    totals.presentCount += studentStats.getOrDefault(AttendanceStatus.PRESENT, 0L);
                    totals.lateCount += studentStats.getOrDefault(AttendanceStatus.LATE, 0L);
                }
            }
            totalsByStudentId.put(student.getId(), totals);
        }

        Map<Long, Double> result = new HashMap<>();
        totalsByStudentId.forEach((studentId, totals) -> {
            if (totals.totalCompletedSessions > 0) {
                result.put(studentId, Math.round(((totals.presentCount + totals.lateCount) * 10000.0
                        / totals.totalCompletedSessions)) / 100.0);
            }
        });
        return result;
    }

    private String classKey(ClassEnrollment enrollment) {
        return enrollment.getTeacher().getEmail() + "|" + enrollment.getCourseCode() + "|" + enrollment.getSectionName();
    }

    private User requireStudent(Long id) {
        return userRepository.findById(id)
                .filter(user -> user.getRole() == Role.ROLE_STUDENT)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));
    }

    private String trimToNull(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }

    private static class AttendanceTotals {
        private long presentCount;
        private long lateCount;
        private long totalCompletedSessions;
    }
}
