package bd.ac.uiu.smartcampus.controller;

import bd.ac.uiu.smartcampus.dto.ApiResponse;
import bd.ac.uiu.smartcampus.dto.NotificationDto;
import bd.ac.uiu.smartcampus.model.User;
import bd.ac.uiu.smartcampus.repository.UserRepository;
import bd.ac.uiu.smartcampus.security.CustomUserDetails;
import bd.ac.uiu.smartcampus.service.NotificationService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/teacher/notifications")
public class TeacherNotificationApiController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public TeacherNotificationApiController(NotificationService notificationService, UserRepository userRepository) {
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedTeacher(CustomUserDetails userDetails) {
        if (userDetails == null) {
            throw new RuntimeException("Unauthorized");
        }
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
    }

    @GetMapping
    public ApiResponse<List<NotificationDto>> getNotifications(@AuthenticationPrincipal CustomUserDetails userDetails) {
        User teacher = getAuthenticatedTeacher(userDetails);
        List<NotificationDto> notifications = notificationService.getNotifications(teacher);
        return ApiResponse.ok("Teacher notifications fetched", notifications);
    }

    @GetMapping("/unread-count")
    public ApiResponse<Map<String, Long>> getUnreadCount(@AuthenticationPrincipal CustomUserDetails userDetails) {
        User teacher = getAuthenticatedTeacher(userDetails);
        long count = notificationService.getUnreadCount(teacher);
        return ApiResponse.ok("Unread count fetched", Map.of("count", count));
    }

    @PostMapping("/{id}/read")
    public ApiResponse<Void> markAsRead(@PathVariable Long id, @AuthenticationPrincipal CustomUserDetails userDetails) {
        User teacher = getAuthenticatedTeacher(userDetails);
        notificationService.markAsRead(id, teacher);
        return ApiResponse.ok("Notification marked as read", null);
    }

    @PostMapping("/read-all")
    public ApiResponse<Void> markAllAsRead(@AuthenticationPrincipal CustomUserDetails userDetails) {
        User teacher = getAuthenticatedTeacher(userDetails);
        notificationService.markAllAsRead(teacher);
        return ApiResponse.ok("All notifications marked as read", null);
    }
}
