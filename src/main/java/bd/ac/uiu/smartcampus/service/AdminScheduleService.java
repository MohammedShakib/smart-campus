package bd.ac.uiu.smartcampus.service;

import bd.ac.uiu.smartcampus.dto.TeachingScheduleRequest;
import bd.ac.uiu.smartcampus.dto.TeachingScheduleResponse;
import bd.ac.uiu.smartcampus.model.*;
import bd.ac.uiu.smartcampus.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
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
        Course course = resolveActiveCourse(request.getCourseId());
        User teacher = resolveActiveTeacher(request.getTeacherId());
        Classroom classroom = resolveActiveClassroom(request.getClassroomId());

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

        Course course = resolveActiveCourse(request.getCourseId());
        User teacher = resolveActiveTeacher(request.getTeacherId());
        Classroom classroom = resolveActiveClassroom(request.getClassroomId());

        validateHistoricalSafety(schedule, request, course, teacher, classroom);

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
        request.setSectionName(required(request.getSectionName(), "Section name is required."));
        request.setDayOfWeek(normalizeDay(request.getDayOfWeek()));

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

    private Course resolveActiveCourse(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));
        if (!course.isActive()) {
            throw new IllegalArgumentException("Cannot schedule an inactive course");
        }
        return course;
    }

    private User resolveActiveTeacher(Long teacherId) {
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new IllegalArgumentException("Teacher not found"));
        if (teacher.getRole() != Role.ROLE_TEACHER) {
            throw new IllegalArgumentException("Assigned user is not a teacher");
        }
        if (!teacher.isActive()) {
            throw new IllegalArgumentException("Cannot assign an inactive teacher");
        }
        return teacher;
    }

    private Classroom resolveActiveClassroom(Long classroomId) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new IllegalArgumentException("Classroom not found"));
        if (!classroom.isActive()) {
            throw new IllegalArgumentException("Cannot schedule in an inactive classroom");
        }
        return classroom;
    }

    private void validateHistoricalSafety(TeachingSchedule schedule, TeachingScheduleRequest request,
                                          Course course, User teacher, Classroom classroom) {
        if (!attendanceSessionRepository.existsByTeachingScheduleId(schedule.getId())) {
            return;
        }
        Long existingCourseId = schedule.getCourseRef() != null ? schedule.getCourseRef().getId() : null;
        Long existingClassroomId = schedule.getClassroomRef() != null ? schedule.getClassroomRef().getId() : null;
        boolean identityChanged = !Objects.equals(existingCourseId, course.getId())
                || !schedule.getTeacherEmail().equalsIgnoreCase(teacher.getEmail())
                || !schedule.getSectionName().equals(required(request.getSectionName(), "Section name is required."))
                || !Objects.equals(existingClassroomId, classroom.getId())
                || !schedule.getDayOfWeek().equals(normalizeDay(request.getDayOfWeek()))
                || !Objects.equals(schedule.getStartTime(), request.getStartTime())
                || !Objects.equals(schedule.getEndTime(), request.getEndTime());
        if (identityChanged) {
            throw new IllegalArgumentException("Cannot change course, teacher, section, room, day, or time for a schedule with historical attendance. Please create a new schedule.");
        }
    }

    private String required(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return value.trim();
    }

    private String normalizeDay(String dayOfWeek) {
        String value = required(dayOfWeek, "Day of week is required.").toLowerCase(Locale.ROOT);
        return switch (value) {
            case "sunday" -> "Sunday";
            case "monday" -> "Monday";
            case "tuesday" -> "Tuesday";
            case "wednesday" -> "Wednesday";
            case "thursday" -> "Thursday";
            case "friday" -> "Friday";
            case "saturday" -> "Saturday";
            default -> throw new IllegalArgumentException("Invalid day of week");
        };
    }
}
