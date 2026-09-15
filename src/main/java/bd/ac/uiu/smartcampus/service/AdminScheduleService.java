package bd.ac.uiu.smartcampus.service;

import bd.ac.uiu.smartcampus.dto.TeachingScheduleRequest;
import bd.ac.uiu.smartcampus.dto.TeachingScheduleResponse;
import bd.ac.uiu.smartcampus.model.*;
import bd.ac.uiu.smartcampus.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminScheduleService {

    private final TeachingScheduleRepository scheduleRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final ClassroomRepository classroomRepository;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final AdminActionLogRepository auditLogRepository;

    public AdminScheduleService(TeachingScheduleRepository scheduleRepository,
                                CourseRepository courseRepository,
                                UserRepository userRepository,
                                ClassroomRepository classroomRepository,
                                AttendanceSessionRepository attendanceSessionRepository,
                                AdminActionLogRepository auditLogRepository) {
        this.scheduleRepository = scheduleRepository;
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
        this.classroomRepository = classroomRepository;
        this.attendanceSessionRepository = attendanceSessionRepository;
        this.auditLogRepository = auditLogRepository;
    }

    public List<TeachingScheduleResponse> getAllSchedules() {
        return scheduleRepository.findAll().stream()
                .map(TeachingScheduleResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public TeachingScheduleResponse getScheduleById(Long id) {
        return scheduleRepository.findById(id)
                .map(TeachingScheduleResponse::fromEntity)
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found"));
    }

    @Transactional
    public TeachingScheduleResponse createSchedule(TeachingScheduleRequest request, String adminEmail) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));
        if (!course.isActive()) {
            throw new IllegalArgumentException("Cannot schedule an inactive course");
        }

        User teacher = userRepository.findById(request.getTeacherId())
                .orElseThrow(() -> new IllegalArgumentException("Teacher not found"));
        if (teacher.getRoles().stream().noneMatch(r -> r.getName().equals("ROLE_TEACHER"))) {
            throw new IllegalArgumentException("Assigned user is not a teacher");
        }

        Classroom classroom = classroomRepository.findById(request.getClassroomId())
                .orElseThrow(() -> new IllegalArgumentException("Classroom not found"));
        if (!classroom.isActive()) {
            throw new IllegalArgumentException("Cannot schedule in an inactive classroom");
        }

        validateConflicts(request, null, teacher.getEmail());

        TeachingSchedule schedule = new TeachingSchedule();
        schedule.setCourseRef(course);
        schedule.setClassroomRef(classroom);
        schedule.setTeacherEmail(teacher.getEmail());
        schedule.setCourseCode(course.getCourseCode());
        schedule.setCourseTitle(course.getCourseName());
        schedule.setRoomNumber(classroom.getRoomNumber());
        schedule.setSectionName(request.getSectionName());
        schedule.setDayOfWeek(request.getDayOfWeek());
        schedule.setStartTime(request.getStartTime());
        schedule.setEndTime(request.getEndTime());
        schedule.setStatus(ClassStatus.SCHEDULED);

        schedule = scheduleRepository.save(schedule);
        auditLogRepository.save(new AdminActionLog(adminEmail, "SCHEDULE_CREATED", "Created schedule ID " + schedule.getId()));

        return TeachingScheduleResponse.fromEntity(schedule);
    }

    @Transactional
    public TeachingScheduleResponse updateSchedule(Long id, TeachingScheduleRequest request, String adminEmail) {
        TeachingSchedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found"));

        // Check historical safety
        boolean hasHistory = attendanceSessionRepository.existsByTeachingScheduleId(id);
        if (hasHistory) {
            if (!schedule.getCourseRef().getId().equals(request.getCourseId()) ||
                !schedule.getTeacherEmail().equals(userRepository.findById(request.getTeacherId()).map(User::getEmail).orElse("")) ||
                !schedule.getSectionName().equals(request.getSectionName())) {
                throw new IllegalArgumentException("Cannot change Course, Teacher, or Section for a schedule with historical attendance. Please create a new schedule.");
            }
        }

        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));
        User teacher = userRepository.findById(request.getTeacherId())
                .orElseThrow(() -> new IllegalArgumentException("Teacher not found"));
        Classroom classroom = classroomRepository.findById(request.getClassroomId())
                .orElseThrow(() -> new IllegalArgumentException("Classroom not found"));

        validateConflicts(request, id, teacher.getEmail());

        schedule.setCourseRef(course);
        schedule.setClassroomRef(classroom);
        schedule.setTeacherEmail(teacher.getEmail());
        schedule.setCourseCode(course.getCourseCode());
        schedule.setCourseTitle(course.getCourseName());
        schedule.setRoomNumber(classroom.getRoomNumber());
        schedule.setSectionName(request.getSectionName());
        schedule.setDayOfWeek(request.getDayOfWeek());
        schedule.setStartTime(request.getStartTime());
        schedule.setEndTime(request.getEndTime());

        schedule = scheduleRepository.save(schedule);
        auditLogRepository.save(new AdminActionLog(adminEmail, "SCHEDULE_UPDATED", "Updated schedule ID " + schedule.getId()));

        return TeachingScheduleResponse.fromEntity(schedule);
    }

    private void validateConflicts(TeachingScheduleRequest request, Long excludeId, String teacherEmail) {
        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new IllegalArgumentException("Start time must be before end time");
        }

        if (scheduleRepository.isDuplicateSchedule(request.getCourseId(), request.getSectionName(), request.getDayOfWeek(), request.getStartTime(), request.getEndTime(), excludeId)) {
            throw new IllegalArgumentException("Duplicate schedule slot exists for this course section");
        }

        if (scheduleRepository.hasRoomConflict(request.getClassroomId(), request.getDayOfWeek(), request.getStartTime(), request.getEndTime(), excludeId)) {
            throw new IllegalArgumentException("Room is already booked during this time");
        }

        if (scheduleRepository.hasTeacherConflict(teacherEmail, request.getDayOfWeek(), request.getStartTime(), request.getEndTime(), excludeId)) {
            throw new IllegalArgumentException("Teacher already has a class scheduled during this time");
        }
    }
}
