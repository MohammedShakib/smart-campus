package bd.ac.uiu.smartcampus.service;

import bd.ac.uiu.smartcampus.dto.NotificationDto;
import bd.ac.uiu.smartcampus.model.*;
import bd.ac.uiu.smartcampus.repository.ClassSessionRepository;
import bd.ac.uiu.smartcampus.repository.TeachingScheduleRepository;
import bd.ac.uiu.smartcampus.repository.UserNotificationRepository;
import bd.ac.uiu.smartcampus.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);
    private final UserNotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final TeachingScheduleRepository teachingScheduleRepository;
    private final ClassSessionRepository classSessionRepository;

    public NotificationService(UserNotificationRepository notificationRepository,
                               UserRepository userRepository,
                               TeachingScheduleRepository teachingScheduleRepository,
                               ClassSessionRepository classSessionRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.teachingScheduleRepository = teachingScheduleRepository;
        this.classSessionRepository = classSessionRepository;
    }

    @Transactional
    public UserNotification createNotification(User recipient, NotificationType type, String title, String message, String targetSection, String referenceId, String eventKey) {
        if (eventKey != null && notificationRepository.existsByRecipientAndEventKey(recipient, eventKey)) {
            logger.debug("Notification with eventKey {} already exists for user {}", eventKey, recipient.getEmail());
            return null; // Skip duplicate
        }
        UserNotification notification = new UserNotification(recipient, type, title, message, targetSection, referenceId);
        notification.setEventKey(eventKey);
        try {
            return notificationRepository.save(notification);
        } catch (DataIntegrityViolationException e) {
            logger.warn("Concurrent duplicate notification creation suppressed for eventKey: {}", eventKey);
            return null;
        }
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> getNotifications(User user) {
        return notificationRepository.findByRecipientOrderByCreatedAtDesc(user)
                .stream()
                .map(NotificationDto::new)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(User user) {
        return notificationRepository.countByRecipientAndReadFalse(user);
    }

    @Transactional
    public void markAsRead(Long notificationId, User user) {
        UserNotification notification = notificationRepository.findByIdAndRecipient(notificationId, user)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found or access denied."));
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(User user) {
        notificationRepository.markAllAsReadByRecipient(user);
    }

    @Transactional
    public void fanOutNotificationToRole(Role role, NotificationType type, String title, String message, String targetSection, String referenceId, String eventKeyPrefix) {
        List<User> users = role == null ? userRepository.findAll() : userRepository.findByRole(role);
        for (User user : users) {
            String eventKey = eventKeyPrefix + ":" + user.getId();
            createNotification(user, type, title, message, targetSection, referenceId, eventKey);
        }
    }

    @Transactional
    public void fanOutEmergency(EmergencyAlert alert) {
        String eventKeyPrefix = "EMERGENCY:" + alert.getId() + ":ACTIVE";
        fanOutNotificationToRole(null, NotificationType.EMERGENCY, alert.getAlertTitle(), alert.getAlertMessage(), "emergency", alert.getId().toString(), eventKeyPrefix);
    }

    // 5 minutes scheduler for Class Reminders
    @Scheduled(fixedRate = 300000)
    @Transactional
    public void scheduleClassReminders() {
        logger.info("Running class reminder scheduler...");
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        LocalTime upcomingLimit = now.plusMinutes(35); // Check classes starting in the next 35 minutes
        String currentDayOfWeek = today.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.US).toUpperCase();

        List<TeachingSchedule> schedules = teachingScheduleRepository.findByDayOfWeek(currentDayOfWeek);
        
        for (TeachingSchedule schedule : schedules) {
            LocalTime startTime = schedule.getStartTime();
            if (startTime.isAfter(now) && startTime.isBefore(upcomingLimit)) {
                // Check if a session exists today, if so, ensure it's not COMPLETED
                List<ClassSession> sessions = classSessionRepository.findByTeachingSchedule_TeacherEmailAndSessionDate(schedule.getTeacherEmail(), today);
                boolean isCompleted = sessions.stream()
                        .filter(s -> s.getTeachingSchedule().getId().equals(schedule.getId()))
                        .anyMatch(s -> s.getStatus() == ClassStatus.COMPLETED);

                if (!isCompleted) {
                    userRepository.findByEmail(schedule.getTeacherEmail()).ifPresent(teacher -> {
                        String eventKey = "CLASS_REMINDER:" + schedule.getId() + ":" + today.toString();
                        String message = String.format("%s — Section %s starts at %s in %s.",
                                schedule.getCourseCode(), schedule.getSectionName(),
                                schedule.getStartTime(), schedule.getRoomNumber());
                        createNotification(teacher, NotificationType.CLASS_REMINDER, "Upcoming class", message, "schedule", schedule.getId().toString(), eventKey);
                    });
                }
            }
        }
    }
}
