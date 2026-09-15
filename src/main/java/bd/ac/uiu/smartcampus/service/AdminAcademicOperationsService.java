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
    private final TeachingScheduleRepository teachingScheduleRepository;
    private final ClassroomRepository classroomRepository;
    private final AdminActionLogRepository auditLogRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public AdminAcademicOperationsService(ClassSessionRepository classSessionRepository,
                                          AttendanceSessionRepository attendanceSessionRepository,
                                          AttendanceRecordRepository attendanceRecordRepository,
                                          RoomReservationRepository roomReservationRepository,
                                          TeachingScheduleRepository teachingScheduleRepository,
                                          ClassroomRepository classroomRepository,
                                          AdminActionLogRepository auditLogRepository,
                                          NotificationService notificationService,
                                          UserRepository userRepository) {
        this.classSessionRepository = classSessionRepository;
        this.attendanceSessionRepository = attendanceSessionRepository;
        this.attendanceRecordRepository = attendanceRecordRepository;
        this.roomReservationRepository = roomReservationRepository;
        this.teachingScheduleRepository = teachingScheduleRepository;
        this.classroomRepository = classroomRepository;
        this.auditLogRepository = auditLogRepository;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    public List<Map<String, Object>> getActiveClasses() {
        return classSessionRepository.findByStatus(ClassStatus.ACTIVE).stream().map(session -> {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("id", session.getId());
            payload.put("teachingScheduleId", session.getTeachingSchedule().getId());
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

        String nextStatus = status == null ? "" : status.trim().toUpperCase(Locale.ROOT);
        if (!Set.of("APPROVED", "REJECTED", "CANCELLED").contains(nextStatus)) {
            throw new IllegalArgumentException("Invalid status update");
        }
        validateReservationTransition(reservation.getStatus(), nextStatus);
        if ("APPROVED".equals(nextStatus)) {
            validateReservationApproval(reservation);
        }

        reservation.setStatus(nextStatus);
        roomReservationRepository.save(reservation);

        auditLogRepository.save(new AdminActionLog(adminEmail, "RESERVATION_" + nextStatus, "Reservation ID " + id + " updated to " + nextStatus));

        if ("APPROVED".equals(nextStatus) || "REJECTED".equals(nextStatus)) {
            userRepository.findByEmail(reservation.getTeacherEmail()).ifPresent(teacher -> {
                String message = String.format("Your room reservation for %s on %s was %s.",
                        reservation.getRoomNumber(), reservation.getReservationDate(), nextStatus.toLowerCase(Locale.ROOT));
                notificationService.createNotification(
                        teacher,
                        NotificationType.RESERVATION,
                        "Reservation " + nextStatus,
                        message,
                        "reservations",
                        reservation.getId().toString(),
                        "RESERVATION_" + nextStatus + ":" + reservation.getId()
                );
            });
        }

        return reservationPayload(reservation);
    }

    private void validateReservationTransition(String currentStatus, String nextStatus) {
        String current = currentStatus == null ? "RESERVED" : currentStatus.toUpperCase(Locale.ROOT);
        if (current.equals(nextStatus)) {
            return;
        }
        if (Set.of("REJECTED", "CANCELLED", "CHECKED_OUT").contains(current)) {
            throw new IllegalArgumentException("Reservation is already closed.");
        }
        if ("APPROVED".equals(current) && !"CANCELLED".equals(nextStatus)) {
            throw new IllegalArgumentException("Approved reservations can only be cancelled.");
        }
        if (!Set.of("RESERVED", "PENDING", "APPROVED").contains(current)) {
            throw new IllegalArgumentException("Invalid reservation state transition.");
        }
    }

    private void validateReservationApproval(RoomReservation reservation) {
        boolean hasReservationConflict = roomReservationRepository.findConflicts(
                        reservation.getRoomNumber(),
                        reservation.getReservationDate(),
                        reservation.getStartTime(),
                        reservation.getEndTime()
                )
                .stream()
                .anyMatch(existing -> !existing.getId().equals(reservation.getId()));
        if (hasReservationConflict) {
            throw new IllegalArgumentException("Room is already reserved for an overlapping time.");
        }

        classroomRepository.findByRoomNumber(reservation.getRoomNumber()).ifPresent(room -> {
            if (teachingScheduleRepository.hasRoomConflict(
                    room.getId(),
                    dayName(reservation.getReservationDate()),
                    reservation.getStartTime(),
                    reservation.getEndTime(),
                    null)) {
                throw new IllegalArgumentException("Room has a scheduled class during this time.");
            }
        });
    }

    private String dayName(java.time.LocalDate date) {
        String value = date.getDayOfWeek().name().toLowerCase(Locale.ROOT);
        return value.substring(0, 1).toUpperCase(Locale.ROOT) + value.substring(1);
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
