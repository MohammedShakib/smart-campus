package bd.ac.uiu.smartcampus.service;

import bd.ac.uiu.smartcampus.dto.AttendanceRecordRequest;
import bd.ac.uiu.smartcampus.dto.RoomReservationRequest;
import bd.ac.uiu.smartcampus.model.*;
import bd.ac.uiu.smartcampus.repository.*;
import bd.ac.uiu.smartcampus.security.CustomUserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
public class TeacherDashboardService {

    private final TeachingScheduleRepository scheduleRepository;
    private final AttendanceSessionRepository sessionRepository;
    private final AttendanceRecordRepository recordRepository;
    private final RoomReservationRepository reservationRepository;
    private final ClassSessionRepository classSessionRepository;
    private final ClassroomRepository classroomRepository;

    public TeacherDashboardService(TeachingScheduleRepository scheduleRepository,
                                   AttendanceSessionRepository sessionRepository,
                                   AttendanceRecordRepository recordRepository,
                                   RoomReservationRepository reservationRepository,
                                   ClassSessionRepository classSessionRepository,
                                   ClassroomRepository classroomRepository) {
        this.scheduleRepository = scheduleRepository;
        this.sessionRepository = sessionRepository;
        this.recordRepository = recordRepository;
        this.reservationRepository = reservationRepository;
        this.classSessionRepository = classSessionRepository;
        this.classroomRepository = classroomRepository;
    }

    public List<TeachingSchedule> getSchedule(String teacherEmail) {
        return scheduleRepository.findByTeacherEmailOrderByDayOfWeekAscStartTimeAsc(teacherEmail);
    }

    public Optional<TeachingSchedule> getNextClass(String teacherEmail) {
        return getSchedule(teacherEmail).stream()
                .findFirst();
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
                    session.setActive(false);
                    session.setEndedAt(endedAt);
                    sessionRepository.save(session);
                });
        return classSessionRepository.save(classSession);
    }

    @Transactional
    public AttendanceSession startAttendance(Long scheduleId, String teacherEmail) {
        TeachingSchedule schedule = ownedSchedule(scheduleId, teacherEmail);
        Optional<AttendanceSession> existing = sessionRepository.findByTeachingScheduleAndTeacherEmailAndActiveTrue(schedule, teacherEmail);
        if (existing.isPresent()) {
            return existing.get();
        }
        ClassSession classSession = todayClassSession(schedule);
        AttendanceSession session = new AttendanceSession(schedule, teacherEmail, UUID.randomUUID().toString().replace("-", ""));
        session.setClassSession(classSession);
        return sessionRepository.save(session);
    }

    @Transactional
    public AttendanceSession endAttendance(Long sessionId, String teacherEmail) {
        AttendanceSession session = ownedSession(sessionId, teacherEmail);
        session.setActive(false);
        session.setEndedAt(LocalDateTime.now());
        return sessionRepository.save(session);
    }

    @Transactional
    public AttendanceRecord markAttendance(Long sessionId, String teacherEmail, AttendanceRecordRequest request) {
        AttendanceSession session = ownedSession(sessionId, teacherEmail);
        if (!session.isActive()) {
            throw new IllegalArgumentException("Attendance session is already closed.");
        }
        String studentId = required(request.getStudentId(), "Student ID is required.");
        AttendanceStatus status = parseAttendanceStatus(request.getStatus());
        AttendanceRecord record = recordRepository.findByAttendanceSessionAndStudentId(session, studentId)
                .orElseGet(() -> new AttendanceRecord(session, studentId, request.getStudentName(), status));
        record.setStudentName(request.getStudentName());
        record.setStatus(status);
        record.setCheckedInAt(LocalDateTime.now());
        return recordRepository.save(record);
    }

    @Transactional
    public AttendanceRecord checkInWithToken(String token, CustomUserDetails studentDetails) {
        String cleanToken = required(token, "Invalid token.");
        if (studentDetails == null || studentDetails.getAuthorities().stream().noneMatch(authority -> "ROLE_STUDENT".equals(authority.getAuthority()))) {
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
        if (recordRepository.findByAttendanceSessionAndStudentId(session, studentId).isPresent()) {
            throw new IllegalArgumentException("Already checked in.");
        }
        AttendanceRecord record = recordRepository.findByAttendanceSessionAndStudentId(session, studentId)
                .orElseGet(() -> new AttendanceRecord(session, studentId, studentDetails.getFullName(), AttendanceStatus.PRESENT));
        record.setStudentName(studentDetails.getFullName());
        record.setStatus(AttendanceStatus.PRESENT);
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
        return reservationRepository.save(new RoomReservation(teacherEmail, roomNumber, date, start, end, purpose));
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
