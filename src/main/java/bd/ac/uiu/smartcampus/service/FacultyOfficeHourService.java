package bd.ac.uiu.smartcampus.service;

import bd.ac.uiu.smartcampus.dto.OfficeHourBookingRequest;
import bd.ac.uiu.smartcampus.dto.OfficeHourSlotCreateRequest;
import bd.ac.uiu.smartcampus.model.FacultyOfficeHourSlot;
import bd.ac.uiu.smartcampus.model.NotificationType;
import bd.ac.uiu.smartcampus.model.User;
import bd.ac.uiu.smartcampus.repository.FacultyOfficeHourSlotRepository;
import bd.ac.uiu.smartcampus.repository.UserRepository;
import bd.ac.uiu.smartcampus.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;

@Service
public class FacultyOfficeHourService {

    private static final Logger logger = LoggerFactory.getLogger(FacultyOfficeHourService.class);

    private final FacultyOfficeHourSlotRepository slotRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    /**
     * In-memory JVM lock registry per slotId.
     * Provides thread-safe concurrency control ensuring that concurrent booking threads
     * entering the JVM queue up cleanly before database row serialization.
     */
    private final ConcurrentHashMap<Long, ReentrantLock> slotLockRegistry = new ConcurrentHashMap<>();

    public FacultyOfficeHourService(FacultyOfficeHourSlotRepository slotRepository,
                                    UserRepository userRepository,
                                    NotificationService notificationService) {
        this.slotRepository = slotRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    /**
     * Concurrency-Safe Consultation Slot Booking.
     * Combines JVM ReentrantLock + Spring @Transactional with SERIALIZABLE isolation and DB pessimistic write locks
     * to guarantee that simultaneous booking attempts never result in double bookings.
     */
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public FacultyOfficeHourSlot bookAppointment(Long slotId, String studentId, String studentName,
                                                 String studentEmail, OfficeHourBookingRequest request) {
        if (slotId == null) {
            throw new IllegalArgumentException("Slot ID is required.");
        }

        // Mandatory Query Pre-Submission validation
        if (request.getQueryTopic() == null || request.getQueryTopic().trim().isBlank()) {
            throw new IllegalArgumentException("Query topic is mandatory for booking faculty consultation.");
        }
        if (request.getQueryDetails() == null || request.getQueryDetails().trim().isBlank()) {
            throw new IllegalArgumentException("Detailed explanation of your query or question is required so faculty can prepare in advance.");
        }

        ReentrantLock lock = slotLockRegistry.computeIfAbsent(slotId, k -> new ReentrantLock(true));
        lock.lock();
        try {
            logger.info("Thread [{}] acquired booking lock for slot ID {}", Thread.currentThread().getName(), slotId);
            FacultyOfficeHourSlot slot = slotRepository.findSlotWithLockById(slotId)
                    .orElseThrow(() -> new IllegalArgumentException("Office hour slot #" + slotId + " not found."));

            if (slot.getStatus() != FacultyOfficeHourSlot.SlotStatus.AVAILABLE) {
                throw new IllegalStateException("Slot was already booked by another student. Please choose an alternate slot.");
            }

            // Assign student booking and mandatory pre-submitted query info
            slot.setStatus(FacultyOfficeHourSlot.SlotStatus.BOOKED);
            slot.setBookedStudentId(studentId);
            slot.setBookedStudentName(studentName);
            slot.setBookedStudentEmail(studentEmail);
            slot.setQueryCategory(request.getQueryCategory() != null ? request.getQueryCategory() : "General Advising");
            slot.setQueryTopic(request.getQueryTopic().trim());
            slot.setQueryDetails(request.getQueryDetails().trim());
            slot.setBookedAt(LocalDateTime.now());

            FacultyOfficeHourSlot saved = slotRepository.save(slot);
            logger.info("Successfully booked office hour slot #{} for student {}", slotId, studentId);
            
            userRepository.findByEmail(saved.getTeacherEmail()).ifPresent(teacher -> {
                String message = String.format("%s booked an office hour for %s on %s at %s.",
                        studentName, request.getQueryTopic(), saved.getSlotDate(), saved.getStartTime());
                notificationService.createNotification(
                        teacher,
                        NotificationType.OFFICE_HOURS,
                        "New office hour booking",
                        message,
                        "officehours",
                        saved.getId().toString(),
                        "OFFICE_QUERY:" + saved.getId() + ":" + teacher.getId()
                );
            });
            
            return saved;
        } finally {
            lock.unlock();
            logger.info("Thread [{}] released booking lock for slot ID {}", Thread.currentThread().getName(), slotId);
        }
    }

    @Transactional(readOnly = true)
    public List<FacultyOfficeHourSlot> getAvailableSlots() {
        return slotRepository.findByStatusOrderBySlotDateAscStartTimeAsc(FacultyOfficeHourSlot.SlotStatus.AVAILABLE);
    }

    @Transactional(readOnly = true)
    public List<FacultyOfficeHourSlot> getTeacherSlots(String teacherEmail) {
        return slotRepository.findByTeacherEmailOrderBySlotDateAscStartTimeAsc(teacherEmail);
    }

    @Transactional(readOnly = true)
    public List<FacultyOfficeHourSlot> getStudentAppointments(String studentId) {
        return slotRepository.findByBookedStudentIdOrderBySlotDateDescStartTimeDesc(studentId);
    }

    @Transactional
    public FacultyOfficeHourSlot cancelAppointment(Long slotId, String studentId) {
        FacultyOfficeHourSlot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new IllegalArgumentException("Slot not found."));

        if (!studentId.equals(slot.getBookedStudentId())) {
            throw new IllegalArgumentException("You can only cancel your own appointments.");
        }

        slot.setStatus(FacultyOfficeHourSlot.SlotStatus.AVAILABLE);
        slot.setBookedStudentId(null);
        slot.setBookedStudentName(null);
        slot.setBookedStudentEmail(null);
        slot.setQueryCategory(null);
        slot.setQueryTopic(null);
        slot.setQueryDetails(null);
        slot.setBookedAt(null);

        return slotRepository.save(slot);
    }

    @Transactional
    public FacultyOfficeHourSlot createSlot(String teacherEmail, OfficeHourSlotCreateRequest request) {
        User teacher = userRepository.findByEmail(teacherEmail)
                .orElseThrow(() -> new IllegalArgumentException("Teacher account not found."));

        LocalDate date = LocalDate.parse(request.getSlotDate());
        LocalTime start = LocalTime.parse(request.getStartTime());
        LocalTime end = LocalTime.parse(request.getEndTime());

        if (end.isBefore(start) || end.equals(start)) {
            throw new IllegalArgumentException("End time must be after start time.");
        }

        FacultyOfficeHourSlot slot = new FacultyOfficeHourSlot(
                teacherEmail,
                teacher.getFullName(),
                teacher.getDepartment(),
                request.getRoomNumber() != null ? request.getRoomNumber() : "Room 524",
                request.getDayOfWeek() != null ? request.getDayOfWeek() : date.getDayOfWeek().name(),
                date,
                start,
                end
        );

        return slotRepository.save(slot);
    }

    @Transactional
    public FacultyOfficeHourSlot updateSlotStatus(Long slotId, String teacherEmail,
                                                  FacultyOfficeHourSlot.SlotStatus newStatus, String feedback) {
        FacultyOfficeHourSlot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new IllegalArgumentException("Slot not found."));

        if (!teacherEmail.equals(slot.getTeacherEmail())) {
            throw new IllegalArgumentException("Unauthorized to modify this consultation slot.");
        }

        slot.setStatus(newStatus);
        if (feedback != null && !feedback.isBlank()) {
            slot.setFacultyFeedback(feedback.trim());
        }

        return slotRepository.save(slot);
    }
}
