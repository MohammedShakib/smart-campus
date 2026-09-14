package bd.ac.uiu.smartcampus.service;

import bd.ac.uiu.smartcampus.dto.*;
import bd.ac.uiu.smartcampus.model.*;
import bd.ac.uiu.smartcampus.repository.*;
import bd.ac.uiu.smartcampus.security.CustomUserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TeacherDashboardService {

    private final TeachingScheduleRepository scheduleRepository;
    private final AttendanceSessionRepository sessionRepository;
    private final AttendanceRecordRepository recordRepository;
    private final RoomReservationRepository reservationRepository;
    private final ClassSessionRepository classSessionRepository;
    private final ClassroomRepository classroomRepository;
    private final ClassEnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final MaintenanceComplaintRepository complaintRepository;
    private final NotificationService notificationService;

    public TeacherDashboardService(TeachingScheduleRepository scheduleRepository,
                                   AttendanceSessionRepository sessionRepository,
                                   AttendanceRecordRepository recordRepository,
                                   RoomReservationRepository reservationRepository,
                                   ClassSessionRepository classSessionRepository,
                                   ClassroomRepository classroomRepository,
                                   ClassEnrollmentRepository enrollmentRepository,
                                   UserRepository userRepository,
                                   MaintenanceComplaintRepository complaintRepository,
                                   NotificationService notificationService) {
        this.scheduleRepository = scheduleRepository;
        this.sessionRepository = sessionRepository;
        this.recordRepository = recordRepository;
        this.reservationRepository = reservationRepository;
        this.classSessionRepository = classSessionRepository;
        this.classroomRepository = classroomRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.userRepository = userRepository;
        this.complaintRepository = complaintRepository;
        this.notificationService = notificationService;
    }

    // ─────────────────────────────────────────────────────────
    // SCHEDULE & CLASSES
    // ─────────────────────────────────────────────────────────

    public List<TeachingSchedule> getSchedule(String teacherEmail) {
        return scheduleRepository.findByTeacherEmailOrderByDayOfWeekAscStartTimeAsc(teacherEmail);
    }

    public Optional<TeachingSchedule> getNextClass(String teacherEmail) {
        return getSchedule(teacherEmail).stream().findFirst();
    }

    public List<Map<String, Object>> getTeacherClasses(String teacherEmail) {
        Map<String, Classroom> roomMap = new LinkedHashMap<>();
        for (Classroom room : getClassrooms()) {
            roomMap.put(normalizeRoom(room.getRoomNumber()), room);
        }

        List<Map<String, Object>> classes = new ArrayList<>();
        LocalDate today = LocalDate.now();
        for (TeachingSchedule schedule : getSchedule(teacherEmail)) {
            Classroom room = roomMap.getOrDefault(normalizeRoom(schedule.getRoomNumber()), null);
            Optional<ClassSession> session = classSessionRepository.findByTeachingScheduleAndSessionDate(schedule, today);
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("schedule", schedule);
            item.put("status", session.map(ClassSession::getStatus).orElse(ClassStatus.SCHEDULED));
            session.ifPresent(value -> item.put("session", value));
            if (room != null) {
                item.put("room", room);
            }
            classes.add(item);
        }
        return classes;
    }

    @Transactional
    public ClassSession startClass(Long scheduleId, String teacherEmail) {
        TeachingSchedule schedule = ownedSchedule(scheduleId, teacherEmail);
        ClassSession session = todayClassSession(schedule);
        if (session.getStatus() == ClassStatus.COMPLETED) {
            throw new IllegalArgumentException("Completed class sessions cannot be restarted.");
        }
        session.setStatus(ClassStatus.ACTIVE);
        session.setStartedAt(LocalDateTime.now());
        session.setEndedAt(null);
        session.setStartedByTeacherId(teacherEmail);
        return classSessionRepository.save(session);
    }

    @Transactional
    public ClassSession endClass(Long scheduleId, String teacherEmail) {
        TeachingSchedule schedule = ownedSchedule(scheduleId, teacherEmail);
        ClassSession classSession = classSessionRepository.findByTeachingScheduleAndSessionDate(schedule, LocalDate.now())
                .orElseThrow(() -> new IllegalArgumentException("Today's class session has not been started."));
        if (classSession.getStatus() != ClassStatus.ACTIVE) {
            throw new IllegalArgumentException("Only an active class session can be ended.");
        }
        LocalDateTime endedAt = LocalDateTime.now();
        classSession.setStatus(ClassStatus.COMPLETED);
        classSession.setEndedAt(endedAt);
        sessionRepository.findByTeachingScheduleAndTeacherEmailAndActiveTrue(schedule, teacherEmail)
                .ifPresent(session -> {
                    endAttendance(session.getId(), teacherEmail);
                });
        return classSessionRepository.save(classSession);
    }

    // ─────────────────────────────────────────────────────────
    // ROSTER — Class list & enrolled students
    // ─────────────────────────────────────────────────────────

    /**
     * Returns distinct course/section pairs for the teacher's roster.
     * Uses TeachingSchedule for courseTitle since that's where it's stored.
     */
    public List<TeacherClassSummaryDto> getRosterClasses(String teacherEmail) {
        List<Object[]> raw = enrollmentRepository.findDistinctCoursesByTeacherEmail(teacherEmail);
        List<TeacherClassSummaryDto> result = new ArrayList<>();
        for (Object[] row : raw) {
            String courseCode = (String) row[0];
            String sectionName = (String) row[1];
            // Resolve courseTitle from schedule
            String courseTitle = scheduleRepository
                    .findByTeacherEmailOrderByDayOfWeekAscStartTimeAsc(teacherEmail)
                    .stream()
                    .filter(s -> s.getCourseCode().equals(courseCode) && s.getSectionName().equals(sectionName))
                    .map(TeachingSchedule::getCourseTitle)
                    .findFirst()
                    .orElse(courseCode);
            result.add(new TeacherClassSummaryDto(courseCode, courseTitle, sectionName));
        }
        return result;
    }

    /**
     * Returns enrolled students with per-student attendance stats.
     * Attendance % = (PRESENT + LATE) / completed sessions * 100.
     * Returns null for percentage if no completed sessions exist.
     */
    public List<RosterStudentDto> getRosterStudents(String teacherEmail, String courseCode, String sectionName) {
        // Verify the teacher owns this course/section via their schedule
        boolean ownsClass = scheduleRepository
                .findByTeacherEmailOrderByDayOfWeekAscStartTimeAsc(teacherEmail)
                .stream()
                .anyMatch(s -> s.getCourseCode().equals(courseCode) && s.getSectionName().equals(sectionName));
        if (!ownsClass) {
            throw new IllegalArgumentException("You do not have a class matching that course and section.");
        }

        List<ClassEnrollment> enrollments = enrollmentRepository
                .findByTeacherEmailAndCourseCodeAndSectionNameAndActiveTrue(teacherEmail, courseCode, sectionName);

        // Get completed sessions for this class — denominator for percentage
        List<AttendanceSession> completedSessions = sessionRepository
                .findCompletedSessionsByTeacherAndCourse(teacherEmail, courseCode, sectionName);
        long totalCompletedSessions = completedSessions.size();

        Map<String, Map<AttendanceStatus, Long>> studentStats = new HashMap<>();
        if (!completedSessions.isEmpty()) {
            List<Object[]> stats = recordRepository.countGroupedByStudentAndStatus(completedSessions);
            for (Object[] row : stats) {
                String sId = (String) row[0];
                AttendanceStatus stat = (AttendanceStatus) row[1];
                Long count = (Long) row[2];
                studentStats.computeIfAbsent(sId, k -> new EnumMap<>(AttendanceStatus.class)).put(stat, count);
            }
        }

        List<RosterStudentDto> result = new ArrayList<>();
        for (ClassEnrollment enrollment : enrollments) {
            User student = enrollment.getStudent();
            String studentId = student.getStudentOrEmpId();

            long presentCount = 0;
            long lateCount = 0;
            long absentCount = 0;

            if (studentStats.containsKey(studentId)) {
                Map<AttendanceStatus, Long> counts = studentStats.get(studentId);
                presentCount = counts.getOrDefault(AttendanceStatus.PRESENT, 0L);
                lateCount = counts.getOrDefault(AttendanceStatus.LATE, 0L);
                absentCount = counts.getOrDefault(AttendanceStatus.ABSENT, 0L);
            }

            Double percentage = null;
            if (totalCompletedSessions > 0) {
                percentage = Math.round(((presentCount + lateCount) * 10000.0 / totalCompletedSessions)) / 100.0;
            }

            result.add(new RosterStudentDto(
                    studentId,
                    student.getFullName(),
                    student.getEmail(),
                    presentCount,
                    lateCount,
                    absentCount,
                    totalCompletedSessions,
                    percentage
            ));
        }

        // Sort by studentId ascending
        result.sort(Comparator.comparing(RosterStudentDto::getStudentId));
        return result;
    }

    /**
     * Returns enrolled students (minimal info) for a specific session's course/section.
     * Used to populate the manual attendance dropdown.
     */
    public List<Map<String, String>> getEnrolledStudentsForSession(Long sessionId, String teacherEmail) {
        AttendanceSession session = ownedSession(sessionId, teacherEmail);
        TeachingSchedule schedule = session.getTeachingSchedule();
        List<ClassEnrollment> enrollments = enrollmentRepository
                .findByTeacherEmailAndCourseCodeAndSectionNameAndActiveTrue(
                        teacherEmail, schedule.getCourseCode(), schedule.getSectionName());
        List<Map<String, String>> result = new ArrayList<>();
        for (ClassEnrollment e : enrollments) {
            Map<String, String> item = new LinkedHashMap<>();
            item.put("studentId", e.getStudent().getStudentOrEmpId());
            item.put("name", e.getStudent().getFullName());
            result.add(item);
        }
        result.sort(Comparator.comparing(m -> m.get("studentId")));
        return result;
    }

    // ─────────────────────────────────────────────────────────
    // ATTENDANCE — session management
    // ─────────────────────────────────────────────────────────

    @Transactional
    public AttendanceSession startAttendance(Long scheduleId, String teacherEmail) {
        TeachingSchedule schedule = ownedSchedule(scheduleId, teacherEmail);
        Optional<AttendanceSession> existing = sessionRepository
                .findByTeachingScheduleAndTeacherEmailAndActiveTrue(schedule, teacherEmail);
        if (existing.isPresent()) {
            return existing.get();
        }
        ClassSession classSession = todayClassSession(schedule);
        AttendanceSession session = new AttendanceSession(
                schedule, teacherEmail, UUID.randomUUID().toString().replace("-", ""));
        session.setClassSession(classSession);
        return sessionRepository.save(session);
    }

    /**
     * End the attendance session and auto-generate ABSENT records for
     * enrolled students who have not checked in.
     */
    @Transactional
    public AttendanceSession endAttendance(Long sessionId, String teacherEmail) {
        AttendanceSession session = ownedSession(sessionId, teacherEmail);
        session.setActive(false);
        session.setEndedAt(LocalDateTime.now());
        sessionRepository.save(session);

        // Auto-generate ABSENT for enrolled students without a record
        TeachingSchedule schedule = session.getTeachingSchedule();
        List<ClassEnrollment> enrollments = enrollmentRepository
                .findByTeacherEmailAndCourseCodeAndSectionNameAndActiveTrue(
                        teacherEmail, schedule.getCourseCode(), schedule.getSectionName());

        for (ClassEnrollment enrollment : enrollments) {
            String studentId = enrollment.getStudent().getStudentOrEmpId();
            boolean hasRecord = recordRepository
                    .findByAttendanceSessionAndStudentId(session, studentId).isPresent();
            if (!hasRecord) {
                AttendanceRecord absentRecord = new AttendanceRecord(
                        session,
                        studentId,
                        enrollment.getStudent().getFullName(),
                        AttendanceStatus.ABSENT,
                        null  // null checkedInAt for auto-absent
                );
                recordRepository.save(absentRecord);
            }
        }
        
        // Notify Teacher
        userRepository.findByEmail(teacherEmail).ifPresent(teacher -> {
            long presentCount = recordRepository.countByAttendanceSessionAndStatus(session, AttendanceStatus.PRESENT);
            long lateCount = recordRepository.countByAttendanceSessionAndStatus(session, AttendanceStatus.LATE);
            long absentCount = recordRepository.countByAttendanceSessionAndStatus(session, AttendanceStatus.ABSENT);
            String message = String.format("%s Section %s — %d Present, %d Late, %d Absent.",
                    schedule.getCourseCode(), schedule.getSectionName(), presentCount, lateCount, absentCount);
            notificationService.createNotification(
                    teacher,
                    NotificationType.ATTENDANCE,
                    "Attendance completed",
                    message,
                    "attendance",
                    session.getId().toString(),
                    "ATTENDANCE_COMPLETED:" + session.getId()
            );
        });

        return session;
    }

    /**
     * Teacher manually marks a student — validates enrollment.
     */
    @Transactional
    public AttendanceRecord markAttendance(Long sessionId, String teacherEmail, AttendanceRecordRequest request) {
        AttendanceSession session = ownedSession(sessionId, teacherEmail);
        if (!session.isActive()) {
            throw new IllegalArgumentException("Attendance session is already closed.");
        }
        String studentId = required(request.getStudentId(), "Student ID is required.");
        AttendanceStatus status = parseAttendanceStatus(request.getStatus());

        // Validate enrollment
        TeachingSchedule schedule = session.getTeachingSchedule();
        if (!enrollmentRepository.existsByTeacherEmailAndStudentIdAndCourseCodeAndSectionName(
                teacherEmail, studentId, schedule.getCourseCode(), schedule.getSectionName())) {
            throw new IllegalArgumentException("Student " + studentId + " is not enrolled in this class.");
        }

        // Resolve student name from user if not provided
        String studentName = request.getStudentName();
        if (studentName == null || studentName.isBlank()) {
            studentName = userRepository.findByStudentOrEmpId(studentId)
                    .map(User::getFullName)
                    .orElse(studentId);
        }
        final String resolvedName = studentName;

        AttendanceRecord record = recordRepository
                .findByAttendanceSessionAndStudentId(session, studentId)
                .orElseGet(() -> new AttendanceRecord(session, studentId, resolvedName, status));
        record.setStudentName(resolvedName);
        record.setStatus(status);
        if (status != AttendanceStatus.ABSENT) {
            record.setCheckedInAt(LocalDateTime.now());
        }
        return recordRepository.save(record);
    }

    /**
     * Student QR check-in — validates ROLE_STUDENT, enrollment, and no duplicate.
     */
    @Transactional
    public AttendanceRecord checkInWithToken(String token, CustomUserDetails studentDetails) {
        String cleanToken = required(token, "Invalid token.");
        if (studentDetails == null || studentDetails.getAuthorities().stream()
                .noneMatch(a -> "ROLE_STUDENT".equals(a.getAuthority()))) {
            throw new IllegalArgumentException("Student login required.");
        }
        AttendanceSession session = sessionRepository.findByToken(cleanToken)
                .orElseThrow(() -> new IllegalArgumentException("Invalid token."));
        if (!session.isActive()) {
            throw new IllegalArgumentException("Session closed.");
        }
        if (session.getTeachingSchedule() == null) {
            throw new IllegalArgumentException("Invalid token.");
        }

        String studentId = required(studentDetails.getStudentOrEmpId(), "Student ID is required.");

        // Validate enrollment
        TeachingSchedule schedule = session.getTeachingSchedule();
        if (!enrollmentRepository.existsByTeacherEmailAndStudentIdAndCourseCodeAndSectionName(
                session.getTeacherEmail(), studentId, schedule.getCourseCode(), schedule.getSectionName())) {
            throw new IllegalArgumentException("You are not enrolled in this class.");
        }

        // Prevent duplicate check-in
        if (recordRepository.findByAttendanceSessionAndStudentId(session, studentId).isPresent()) {
            throw new IllegalArgumentException("Already checked in.");
        }

        AttendanceRecord record = new AttendanceRecord(
                session, studentId, studentDetails.getFullName(), AttendanceStatus.PRESENT);
        record.setCheckedInAt(LocalDateTime.now());
        return recordRepository.save(record);
    }

    public List<Map<String, Object>> getAttendanceSessions(String teacherEmail) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (AttendanceSession session : sessionRepository.findByTeacherEmailOrderByStartedAtDesc(teacherEmail)) {
            result.add(attendancePayload(session));
        }
        return result;
    }

    public Map<String, Object> attendancePayload(AttendanceSession session) {
        Map<String, Object> payload = new LinkedHashMap<>();
        List<AttendanceRecord> records = recordRepository.findByAttendanceSessionOrderByCheckedInAtAsc(session);
        payload.put("session", session);
        payload.put("classSession", session.getClassSession());
        payload.put("schedule", session.getTeachingSchedule());
        payload.put("records", records);
        payload.put("presentCount", recordRepository.countByAttendanceSessionAndStatus(session, AttendanceStatus.PRESENT));
        payload.put("lateCount", recordRepository.countByAttendanceSessionAndStatus(session, AttendanceStatus.LATE));
        payload.put("absentCount", recordRepository.countByAttendanceSessionAndStatus(session, AttendanceStatus.ABSENT));
        return payload;
    }

    // ─────────────────────────────────────────────────────────
    // ATTENDANCE HISTORY
    // ─────────────────────────────────────────────────────────

    public List<AttendanceHistoryDto> getAttendanceHistory(String teacherEmail,
                                                           String courseCode,
                                                           String sectionName) {
        List<AttendanceSession> sessions;
        if (courseCode != null && !courseCode.isBlank() && sectionName != null && !sectionName.isBlank()) {
            sessions = sessionRepository.findCompletedSessionsByTeacherAndCourse(
                    teacherEmail, courseCode, sectionName);
        } else {
            sessions = sessionRepository.findAllCompletedByTeacher(teacherEmail);
        }

        Map<Long, Map<AttendanceStatus, Long>> sessionStats = new HashMap<>();
        if (!sessions.isEmpty()) {
            List<Object[]> stats = recordRepository.countGroupedBySessionAndStatus(sessions);
            for (Object[] row : stats) {
                Long sId = (Long) row[0];
                AttendanceStatus stat = (AttendanceStatus) row[1];
                Long count = (Long) row[2];
                sessionStats.computeIfAbsent(sId, k -> new EnumMap<>(AttendanceStatus.class)).put(stat, count);
            }
        }

        List<AttendanceHistoryDto> result = new ArrayList<>();
        for (AttendanceSession s : sessions) {
            TeachingSchedule schedule = s.getTeachingSchedule();
            Map<AttendanceStatus, Long> counts = sessionStats.getOrDefault(s.getId(), Collections.emptyMap());
            long present = counts.getOrDefault(AttendanceStatus.PRESENT, 0L);
            long late = counts.getOrDefault(AttendanceStatus.LATE, 0L);
            long absent = counts.getOrDefault(AttendanceStatus.ABSENT, 0L);
            long total = present + late + absent;

            Double rate = null;
            if (total > 0) {
                rate = Math.round(((present + late) * 10000.0 / total)) / 100.0;
            }

            result.add(new AttendanceHistoryDto(
                    s.getId(),
                    schedule.getCourseCode(),
                    schedule.getCourseTitle(),
                    schedule.getSectionName(),
                    s.getSessionDate(),
                    s.getStartedAt(),
                    s.getEndedAt(),
                    present,
                    late,
                    absent,
                    total,
                    rate
            ));
        }
        return result;
    }

    public AttendanceSessionDetailDto getAttendanceHistoryDetail(Long sessionId, String teacherEmail) {
        AttendanceSession session = ownedSession(sessionId, teacherEmail);
        TeachingSchedule schedule = session.getTeachingSchedule();

        List<AttendanceRecord> records = recordRepository
                .findByAttendanceSessionOrderByStudentIdAsc(session);

        List<AttendanceSessionDetailDto.RecordEntry> entries = records.stream()
                .map(r -> new AttendanceSessionDetailDto.RecordEntry(
                        r.getStudentId(),
                        r.getStudentName(),
                        r.getStatus().name(),
                        r.getCheckedInAt()
                ))
                .collect(Collectors.toList());

        return new AttendanceSessionDetailDto(
                session.getId(),
                schedule.getCourseCode(),
                schedule.getCourseTitle(),
                schedule.getSectionName(),
                session.getSessionDate(),
                session.getStartedAt(),
                session.getEndedAt(),
                session.isActive(),
                entries
        );
    }

    // ─────────────────────────────────────────────────────────
    // ROOM RESERVATIONS
    // ─────────────────────────────────────────────────────────

    public List<RoomReservation> getReservations(String teacherEmail) {
        return reservationRepository.findByTeacherEmailOrderByReservationDateDescStartTimeDesc(teacherEmail);
    }

    @Transactional
    public RoomReservation reserveRoom(String teacherEmail, RoomReservationRequest request) {
        String roomNumber = required(request.getRoomNumber(), "Room is required.");
        String purpose = required(request.getPurpose(), "Purpose is required.");
        classroomRepository.findByRoomNumber(roomNumber)
                .orElseThrow(() -> new IllegalArgumentException("Classroom not found."));
        LocalDate date = LocalDate.parse(required(request.getReservationDate(), "Date is required."));
        LocalTime start = LocalTime.parse(required(request.getStartTime(), "Start time is required."));
        LocalTime end = LocalTime.parse(required(request.getEndTime(), "End time is required."));
        if (!start.isBefore(end)) {
            throw new IllegalArgumentException("End time must be after start time.");
        }
        if (!reservationRepository.findConflicts(roomNumber, date, start, end).isEmpty()) {
            throw new IllegalArgumentException("Room is already reserved for an overlapping time.");
        }
        RoomReservation saved = reservationRepository.save(new RoomReservation(teacherEmail, roomNumber, date, start, end, purpose));
        
        userRepository.findByEmail(teacherEmail).ifPresent(teacher -> {
            // Sep 16, 2026, 10:30 AM-12:00 PM format simplified
            String message = String.format("%s reserved for %s, %s–%s.",
                    roomNumber, date, start, end);
            notificationService.createNotification(
                    teacher,
                    NotificationType.RESERVATION,
                    "Room reserved",
                    message,
                    "reservations",
                    saved.getId().toString(),
                    "RESERVATION_CREATED:" + saved.getId()
            );
        });
        
        return saved;
    }

    public List<Classroom> getClassrooms() {
        return classroomRepository.findAllByOrderByFloorAscRoomNumberAsc();
    }

    public List<Classroom> availableRooms(LocalDate date, LocalTime start, LocalTime end) {
        List<Classroom> available = new ArrayList<>();
        for (Classroom room : getClassrooms()) {
            if (reservationRepository.findConflicts(room.getRoomNumber(), date, start, end).isEmpty()) {
                available.add(room);
            }
        }
        return available;
    }

    // ─────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────

    public List<TeacherIssueDto> getTeacherIssues(CustomUserDetails userDetails) {
        String reporterId = userDetails != null && userDetails.getStudentOrEmpId() != null && !userDetails.getStudentOrEmpId().isBlank()
                ? userDetails.getStudentOrEmpId()
                : userDetails != null ? userDetails.getUsername() : "unknown";

        List<MaintenanceComplaint> complaints = complaintRepository.findByReporterIdAndReporterRoleOrderByReportedAtDesc(reporterId, "ROLE_TEACHER");
        return complaints.stream().map(c -> new TeacherIssueDto(
                c.getId(),
                c.getIssueTitle(),
                c.getLocation(),
                c.getPriority(),
                c.getStatus(),
                c.getDescription(),
                c.getReportedAt()
        )).collect(Collectors.toList());
    }

    private TeachingSchedule ownedSchedule(Long scheduleId, String teacherEmail) {
        TeachingSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("Class schedule not found."));
        if (!teacherEmail.equalsIgnoreCase(schedule.getTeacherEmail())) {
            throw new IllegalArgumentException("You can only manage your own class.");
        }
        return schedule;
    }

    private AttendanceSession ownedSession(Long sessionId, String teacherEmail) {
        return sessionRepository.findByIdAndTeacherEmail(sessionId, teacherEmail)
                .orElseThrow(() -> new IllegalArgumentException("Attendance session not found."));
    }

    private ClassSession todayClassSession(TeachingSchedule schedule) {
        LocalDate today = LocalDate.now();
        return classSessionRepository.findByTeachingScheduleAndSessionDate(schedule, today)
                .orElseGet(() -> classSessionRepository.save(new ClassSession(schedule, today)));
    }

    private AttendanceStatus parseAttendanceStatus(String value) {
        if (value == null || value.isBlank()) {
            return AttendanceStatus.PRESENT;
        }
        return AttendanceStatus.valueOf(value.trim().toUpperCase(Locale.ROOT));
    }

    private String required(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return value.trim();
    }

    private String normalizeRoom(String roomNumber) {
        if (roomNumber == null) {
            return "";
        }
        String[] pieces = roomNumber.split("\\s+");
        if (pieces.length >= 2 && pieces[0].equalsIgnoreCase("Room")) {
            return pieces[0] + " " + pieces[1];
        }
        return roomNumber.trim();
    }
}
