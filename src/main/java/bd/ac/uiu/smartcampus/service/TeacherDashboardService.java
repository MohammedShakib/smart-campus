package bd.ac.uiu.smartcampus.service;

import bd.ac.uiu.smartcampus.dto.AttendanceRecordRequest;
import bd.ac.uiu.smartcampus.dto.RoomReservationRequest;
import bd.ac.uiu.smartcampus.model.*;
import bd.ac.uiu.smartcampus.repository.*;
import bd.ac.uiu.smartcampus.security.CustomUserDetails;
import bd.ac.uiu.smartcampus.syllabus.collections.ClassroomModel;
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

    public TeacherDashboardService(TeachingScheduleRepository scheduleRepository,
                                   AttendanceSessionRepository sessionRepository,
                                   AttendanceRecordRepository recordRepository,
                                   RoomReservationRepository reservationRepository) {
        this.scheduleRepository = scheduleRepository;
        this.sessionRepository = sessionRepository;
        this.recordRepository = recordRepository;
        this.reservationRepository = reservationRepository;
    }

    public List<TeachingSchedule> getSchedule(String teacherEmail) {
        return scheduleRepository.findByTeacherEmailOrderByDayOfWeekAscStartTimeAsc(teacherEmail);
    }

    public Optional<TeachingSchedule> getNextClass(String teacherEmail) {
        return getSchedule(teacherEmail).stream()
                .filter(schedule -> schedule.getStatus() != ClassStatus.COMPLETED)
                .findFirst();
    }

    public List<Map<String, Object>> getTeacherClasses(String teacherEmail, List<ClassroomModel> classrooms) {
        Map<String, ClassroomModel> roomMap = new LinkedHashMap<>();
        for (ClassroomModel room : classrooms) {
            roomMap.put(normalizeRoom(room.getRoomNumber()), room);
        }

        List<Map<String, Object>> classes = new ArrayList<>();
        for (TeachingSchedule schedule : getSchedule(teacherEmail)) {
            ClassroomModel room = roomMap.getOrDefault(normalizeRoom(schedule.getRoomNumber()), null);
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("schedule", schedule);
            if (room != null) {
                item.put("room", room);
            }
            classes.add(item);
        }
        return classes;
    }

    @Transactional
    public TeachingSchedule startClass(Long scheduleId, String teacherEmail) {
        TeachingSchedule schedule = ownedSchedule(scheduleId, teacherEmail);
        schedule.setStatus(ClassStatus.ACTIVE);
        schedule.setStartedAt(LocalDateTime.now());
        schedule.setEndedAt(null);
        return scheduleRepository.save(schedule);
    }

    @Transactional
    public TeachingSchedule endClass(Long scheduleId, String teacherEmail) {
        TeachingSchedule schedule = ownedSchedule(scheduleId, teacherEmail);
        schedule.setStatus(ClassStatus.COMPLETED);
        schedule.setEndedAt(LocalDateTime.now());
        sessionRepository.findByTeachingScheduleAndTeacherEmailAndActiveTrue(schedule, teacherEmail)
                .ifPresent(session -> {
                    session.setActive(false);
                    session.setEndedAt(LocalDateTime.now());
                    sessionRepository.save(session);
                });
        return scheduleRepository.save(schedule);
    }

    @Transactional
    public AttendanceSession startAttendance(Long scheduleId, String teacherEmail) {
        TeachingSchedule schedule = ownedSchedule(scheduleId, teacherEmail);
        Optional<AttendanceSession> existing = sessionRepository.findByTeachingScheduleAndTeacherEmailAndActiveTrue(schedule, teacherEmail);
        if (existing.isPresent()) {
            return existing.get();
        }
        AttendanceSession session = new AttendanceSession(schedule, teacherEmail, UUID.randomUUID().toString().replace("-", ""));
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
        AttendanceSession session = sessionRepository.findByTokenAndActiveTrue(required(token, "Attendance token is required."))
                .orElseThrow(() -> new IllegalArgumentException("Attendance session is not active."));
        String studentId = required(studentDetails.getStudentOrEmpId(), "Student ID is required.");
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

    public List<ClassroomModel> availableRooms(List<ClassroomModel> classrooms, LocalDate date, LocalTime start, LocalTime end) {
        List<ClassroomModel> available = new ArrayList<>();
        for (ClassroomModel room : classrooms) {
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
