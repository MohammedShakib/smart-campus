package bd.ac.uiu.smartcampus.service;

import bd.ac.uiu.smartcampus.dto.AttendanceHistoryDto;
import bd.ac.uiu.smartcampus.model.*;
import bd.ac.uiu.smartcampus.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminAcademicOperationsService {

    private final ClassSessionRepository classSessionRepository;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final RoomReservationRepository roomReservationRepository;
    private final AdminActionLogRepository auditLogRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public AdminAcademicOperationsService(ClassSessionRepository classSessionRepository,
                                          AttendanceSessionRepository attendanceSessionRepository,
                                          AttendanceRecordRepository attendanceRecordRepository,
                                          RoomReservationRepository roomReservationRepository,
                                          AdminActionLogRepository auditLogRepository,
                                          NotificationService notificationService,
                                          UserRepository userRepository) {
        this.classSessionRepository = classSessionRepository;
        this.attendanceSessionRepository = attendanceSessionRepository;
        this.attendanceRecordRepository = attendanceRecordRepository;
        this.roomReservationRepository = roomReservationRepository;
        this.auditLogRepository = auditLogRepository;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    public List<Map<String, Object>> getActiveClasses() {
        return classSessionRepository.findByStatus(ClassStatus.ACTIVE).stream().map(session -> {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("id", session.getId());
            payload.put("courseCode", session.getTeachingSchedule().getCourseCode());
            payload.put("courseTitle", session.getTeachingSchedule().getCourseTitle());
            payload.put("sectionName", session.getTeachingSchedule().getSectionName());
            payload.put("teacherEmail", session.getTeachingSchedule().getTeacherEmail());
            payload.put("roomNumber", session.getTeachingSchedule().getRoomNumber());
            payload.put("startedAt", session.getStartedAt());
            payload.put("scheduledStartTime", session.getTeachingSchedule().getStartTime());
            payload.put("scheduledEndTime", session.getTeachingSchedule().getEndTime());
            payload.put("status", session.getStatus());
            return payload;
        }).collect(Collectors.toList());
    }

    public List<AttendanceHistoryDto> getAllAttendanceSessions() {
        List<AttendanceSession> sessions = attendanceSessionRepository.findAll().stream()
                .filter(s -> !s.isActive() && s.getEndedAt() != null)
                .collect(Collectors.toList());

        Map<Long, Map<AttendanceStatus, Long>> sessionStats = new HashMap<>();
        if (!sessions.isEmpty()) {
            List<Object[]> stats = attendanceRecordRepository.countGroupedBySessionAndStatus(sessions);
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
        
        result.sort((a, b) -> b.getStartedAt().compareTo(a.getStartedAt()));
        return result;
    }

    public List<Map<String, Object>> getAllReservations() {
        return roomReservationRepository.findAll().stream()
                .sorted(Comparator.comparing(RoomReservation::getReservationDate).reversed()
                        .thenComparing(RoomReservation::getStartTime).reversed())
                .map(this::reservationPayload)
                .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> updateReservationStatus(Long id, String status, String adminEmail) {
        RoomReservation reservation = roomReservationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reservation not found"));

        if ("APPROVED".equalsIgnoreCase(status) || "REJECTED".equalsIgnoreCase(status) || "CANCELLED".equalsIgnoreCase(status)) {
            reservation.setStatus(status.toUpperCase());
            roomReservationRepository.save(reservation);

            auditLogRepository.save(new AdminActionLog(adminEmail, "RESERVATION_" + status.toUpperCase(), "Reservation ID " + id + " updated to " + status));

            if ("APPROVED".equalsIgnoreCase(status) || "REJECTED".equalsIgnoreCase(status)) {
                userRepository.findByEmail(reservation.getTeacherEmail()).ifPresent(teacher -> {
                    String message = String.format("Your room reservation for %s on %s was %s.",
                            reservation.getRoomNumber(), reservation.getReservationDate(), status.toLowerCase());
                    notificationService.createNotification(
                            teacher,
                            NotificationType.RESERVATION,
                            "Reservation " + status,
                            message,
                            "reservations",
                            reservation.getId().toString(),
                            "RESERVATION_" + status.toUpperCase() + ":" + reservation.getId()
                    );
                });
            }
        } else {
            throw new IllegalArgumentException("Invalid status update");
        }

        return reservationPayload(reservation);
    }

    private Map<String, Object> reservationPayload(RoomReservation reservation) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("id", reservation.getId());
        payload.put("teacherEmail", reservation.getTeacherEmail());
        payload.put("roomNumber", reservation.getRoomNumber());
        payload.put("reservationDate", reservation.getReservationDate());
        payload.put("startTime", reservation.getStartTime());
        payload.put("endTime", reservation.getEndTime());
        payload.put("purpose", reservation.getPurpose());
        payload.put("status", reservation.getStatus());
        payload.put("createdAt", reservation.getCreatedAt());
        return payload;
    }
}
