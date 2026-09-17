package bd.ac.uiu.smartcampus.controller;

import bd.ac.uiu.smartcampus.dto.ApiResponse;
import bd.ac.uiu.smartcampus.model.CampusNotice;
import bd.ac.uiu.smartcampus.model.NoticeAudience;
import bd.ac.uiu.smartcampus.model.NoticeStatus;
import bd.ac.uiu.smartcampus.repository.CampusNoticeRepository;
import bd.ac.uiu.smartcampus.security.CustomUserDetails;
import bd.ac.uiu.smartcampus.service.AdminCommunicationService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/communication")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCommunicationController {

    private final AdminCommunicationService communicationService;
    private final CampusNoticeRepository noticeRepository;

    public AdminCommunicationController(AdminCommunicationService communicationService, CampusNoticeRepository noticeRepository) {
        this.communicationService = communicationService;
        this.noticeRepository = noticeRepository;
    }

    @GetMapping("/notices")
    public ApiResponse<List<CampusNotice>> getNotices() {
        return ApiResponse.ok("Fetched notices", noticeRepository.findTop10ByOrderByPostedAtDesc());
    }

    @PostMapping("/notices")
    public ApiResponse<CampusNotice> createNotice(@RequestBody Map<String, Object> payload,
                                                  @AuthenticationPrincipal CustomUserDetails userDetails) {
        String title = (String) payload.get("title");
        String content = (String) payload.get("content");
        String category = (String) payload.get("category");
        String priority = (String) payload.get("priority");
        NoticeAudience audience = NoticeAudience.valueOf((String) payload.get("audience"));
        NoticeStatus status = NoticeStatus.valueOf((String) payload.getOrDefault("status", "PUBLISHED"));
        String adminName = userDetails != null ? userDetails.getFullName() : "Admin";
        
        return ApiResponse.ok("Created notice", communicationService.createNotice(title, content, category, priority, audience, status, adminName));
    }

    @PatchMapping("/notices/{id}/status")
    public ApiResponse<CampusNotice> updateNoticeStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        NoticeStatus status = NoticeStatus.valueOf(payload.get("status"));
        return ApiResponse.ok("Updated notice status", communicationService.updateNoticeStatus(id, status));
    }

    @DeleteMapping("/notices/{id}")
    public ApiResponse<Void> deleteNotice(@PathVariable Long id) {
        communicationService.deleteNotice(id);
        return ApiResponse.ok("Deleted notice", null);
    }
}
