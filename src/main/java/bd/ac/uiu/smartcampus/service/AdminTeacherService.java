package bd.ac.uiu.smartcampus.service;

import bd.ac.uiu.smartcampus.dto.AdminTeacherDetailDto;
import bd.ac.uiu.smartcampus.dto.AdminTeacherDto;
import bd.ac.uiu.smartcampus.dto.AdminTeacherUpdateRequest;
import bd.ac.uiu.smartcampus.model.*;
import bd.ac.uiu.smartcampus.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminTeacherService {

    private final UserRepository userRepository;
    private final TeacherProfileRepository teacherProfileRepository;
    private final TeachingScheduleRepository scheduleRepository;
    private final ClassEnrollmentRepository enrollmentRepository;
    private final AttendanceSessionRepository sessionRepository;
    private final FacultyOfficeHourSlotRepository officeHourSlotRepository;
    private final AdminUserService adminUserService;
    private final AdminActionLogRepository actionLogRepository;

    public AdminTeacherService(UserRepository userRepository,
                               TeacherProfileRepository teacherProfileRepository,
                               TeachingScheduleRepository scheduleRepository,
                               ClassEnrollmentRepository enrollmentRepository,
                               AttendanceSessionRepository sessionRepository,
                               FacultyOfficeHourSlotRepository officeHourSlotRepository,
                               AdminUserService adminUserService,
                               AdminActionLogRepository actionLogRepository) {
        this.userRepository = userRepository;
        this.teacherProfileRepository = teacherProfileRepository;
        this.scheduleRepository = scheduleRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.sessionRepository = sessionRepository;
        this.officeHourSlotRepository = officeHourSlotRepository;
        this.adminUserService = adminUserService;
        this.actionLogRepository = actionLogRepository;
    }

    public List<AdminTeacherDto> searchTeachers(String search, Boolean active, String department) {
        search = trimToNull(search);
        department = trimToNull(department);

        List<User> teachers = userRepository.searchUsers(search, Role.ROLE_TEACHER, active);

        if (department != null) {
            String finalDepartment = department;
            teachers = teachers.stream()
                    .filter(t -> finalDepartment.equalsIgnoreCase(t.getDepartment()))
                    .collect(Collectors.toList());
        }

        if (teachers.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> teacherIds = teachers.stream().map(User::getId).collect(Collectors.toList());
        List<String> teacherEmails = teachers.stream().map(User::getEmail).collect(Collectors.toList());

        Map<Long, TeacherProfile> profilesByUserId = teacherProfileRepository.findByUserIdIn(teacherIds).stream()
                .collect(Collectors.toMap(TeacherProfile::getUserId, p -> p));

        Map<String, Long> classCountByEmail = scheduleRepository.countDistinctClassesByTeacherEmails(teacherEmails).stream()
                .collect(Collectors.toMap(row -> (String) row[0], row -> (Long) row[1]));

        Map<String, Long> studentCountByEmail = enrollmentRepository.countDistinctActiveStudentsByTeacherEmails(teacherEmails).stream()
                .collect(Collectors.toMap(row -> (String) row[0], row -> (Long) row[1]));

        return teachers.stream().map(teacher -> {
            TeacherProfile profile = profilesByUserId.get(teacher.getId());
            String designation = profile != null ? profile.getDesignation() : null;
            String officeRoom = profile != null ? profile.getOfficeRoom() : null;
            long classCount = classCountByEmail.getOrDefault(teacher.getEmail(), 0L);
            long studentCount = studentCountByEmail.getOrDefault(teacher.getEmail(), 0L);

            return new AdminTeacherDto(teacher, designation, officeRoom, classCount, studentCount);
        }).collect(Collectors.toList());
    }

    public List<String> getTeacherDepartments() {
        return userRepository.findDistinctDepartmentsByRole(Role.ROLE_TEACHER).stream()
                .map(this::trimToNull)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
    }

    public Map<String, Object> getTeacherSummary() {
        long total = userRepository.countByRole(Role.ROLE_TEACHER);
        long activeCount = userRepository.countByRoleAndActiveTrue(Role.ROLE_TEACHER);
        long disabled = total - activeCount;

        long teachersWithClasses = 0;
        List<User> activeTeachers = userRepository.findByRoleAndActiveTrue(Role.ROLE_TEACHER);
        if (!activeTeachers.isEmpty()) {
            List<String> emails = activeTeachers.stream().map(User::getEmail).collect(Collectors.toList());
            teachersWithClasses = scheduleRepository.countTeachersWithClassesByTeacherEmails(emails);
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalTeachers", total);
        summary.put("activeTeachers", activeCount);
        summary.put("disabledTeachers", disabled);
        summary.put("teachersWithClasses", teachersWithClasses);
        return summary;
    }

    public AdminTeacherDetailDto getTeacherDetail(Long id) {
        User teacher = requireTeacher(id);
        String email = teacher.getEmail();

        TeacherProfile profile = teacherProfileRepository.findByUserId(id).orElse(null);
        String designation = profile != null ? profile.getDesignation() : null;
        String officeRoom = profile != null ? profile.getOfficeRoom() : null;

        List<TeachingSchedule> fullSchedules = scheduleRepository.findByTeacherEmailOrderByDayOfWeekAscStartTimeAsc(email);
        List<AdminTeacherDetailDto.ScheduleInfo> schedules = fullSchedules.stream()
                .map(s -> new AdminTeacherDetailDto.ScheduleInfo(
                        s.getDayOfWeek(), s.getStartTime(), s.getEndTime(), s.getRoomNumber(), s.getCourseCode()
                )).collect(Collectors.toList());

        Map<String, AdminTeacherDetailDto.TeachingAssignmentInfo> assignmentMap = new LinkedHashMap<>();
        for (TeachingSchedule s : fullSchedules) {
            String key = s.getCourseCode() + "|" + s.getSectionName();
            assignmentMap.putIfAbsent(key, new AdminTeacherDetailDto.TeachingAssignmentInfo(
                    s.getCourseCode(), s.getCourseTitle(), s.getSectionName()
            ));
        }
        List<AdminTeacherDetailDto.TeachingAssignmentInfo> teachingAssignments = new ArrayList<>(assignmentMap.values());

        long uniqueStudentCount = enrollmentRepository.countDistinctActiveStudentsByTeacherEmail(email);

        List<AttendanceSession> allSessions = sessionRepository.findByTeacherEmailOrderByStartedAtDesc(email);
        long completedSessions = allSessions.stream().filter(s -> !s.isActive()).count();
        AdminTeacherDetailDto.AttendanceSummary attendanceSummary = new AdminTeacherDetailDto.AttendanceSummary(
                allSessions.size(), completedSessions
        );

        List<FacultyOfficeHourSlot> upcomingSlots = officeHourSlotRepository
                .findByTeacherEmailAndSlotDateGreaterThanEqualOrderBySlotDateAscStartTimeAsc(email, LocalDate.now());
        
        List<AdminTeacherDetailDto.OfficeHourSlotInfo> nextSlots = upcomingSlots.stream()
                .limit(5)
                .map(s -> new AdminTeacherDetailDto.OfficeHourSlotInfo(
                        s.getSlotDate(), s.getStartTime(), s.getEndTime(), s.getRoomNumber(), s.getStatus().name()
                )).collect(Collectors.toList());

        AdminTeacherDetailDto.OfficeHourSummary officeHourSummary = new AdminTeacherDetailDto.OfficeHourSummary(
                upcomingSlots.size(), nextSlots
        );

        return new AdminTeacherDetailDto(teacher, designation, officeRoom,
                teachingAssignments, schedules, attendanceSummary, officeHourSummary, uniqueStudentCount);
    }

    @Transactional
    public AdminTeacherDetailDto updateTeacherProfile(Long id, AdminTeacherUpdateRequest request, String adminEmail) {
        User teacher = requireTeacher(id);
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Teacher profile request is required");
        }

        if (request.getFullName() != null) {
            String fullName = trimToNull(request.getFullName());
            if (fullName == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Full name cannot be blank");
            }
            teacher.setFullName(fullName);
        }
        if (request.getDepartment() != null) {
            teacher.setDepartment(trimToNull(request.getDepartment()));
        }
        userRepository.save(teacher);

        TeacherProfile profile = teacherProfileRepository.findByUserId(id)
                .orElse(new TeacherProfile(teacher, null, null));
        
        if (request.getDesignation() != null) {
            profile.setDesignation(trimToNull(request.getDesignation()));
        }
        if (request.getOfficeRoom() != null) {
            profile.setOfficeRoom(trimToNull(request.getOfficeRoom()));
        }
        teacherProfileRepository.save(profile);

        AdminActionLog log = new AdminActionLog(adminEmail, "TEACHER_PROFILE_UPDATED",
                "Updated profile for teacher: " + teacher.getEmail());
        actionLogRepository.save(log);

        return getTeacherDetail(id);
    }

    @Transactional
    public void toggleTeacherStatus(Long id, boolean active, String currentAdminEmail) {
        requireTeacher(id);
        adminUserService.toggleUserStatus(id, active, currentAdminEmail);
    }

    private User requireTeacher(Long id) {
        return userRepository.findById(id)
                .filter(user -> user.getRole() == Role.ROLE_TEACHER)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Teacher not found"));
    }

    private String trimToNull(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }
}
