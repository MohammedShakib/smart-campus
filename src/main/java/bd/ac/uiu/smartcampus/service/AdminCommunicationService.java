package bd.ac.uiu.smartcampus.service;

import bd.ac.uiu.smartcampus.model.*;
import bd.ac.uiu.smartcampus.repository.CampusNoticeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminCommunicationService {

    private final CampusNoticeRepository noticeRepository;
    private final NotificationService notificationService;

    public AdminCommunicationService(CampusNoticeRepository noticeRepository, NotificationService notificationService) {
        this.noticeRepository = noticeRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public CampusNotice createNotice(String title, String content, String category, String priority, NoticeAudience audience, NoticeStatus status, String adminName) {
        CampusNotice notice = new CampusNotice(title, content, category, priority, adminName, audience, status);
        CampusNotice savedNotice = noticeRepository.save(notice);

        if (status == NoticeStatus.PUBLISHED) {
            fanOutNotice(savedNotice);
        }

        return savedNotice;
    }

    @Transactional
    public CampusNotice updateNoticeStatus(Long id, NoticeStatus status) {
        CampusNotice notice = noticeRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Notice not found"));
        NoticeStatus oldStatus = notice.getStatus();
        notice.setStatus(status);
        CampusNotice savedNotice = noticeRepository.save(notice);

        if (status == NoticeStatus.PUBLISHED && oldStatus != NoticeStatus.PUBLISHED) {
            fanOutNotice(savedNotice);
        }
        
        return savedNotice;
    }

    @Transactional
    public void deleteNotice(Long id) {
        if (!noticeRepository.existsById(id)) {
            throw new IllegalArgumentException("Notice not found");
        }
        noticeRepository.deleteById(id);
    }

    private void fanOutNotice(CampusNotice notice) {
        if (!"HIGH".equalsIgnoreCase(notice.getPriority()) && !"URGENT".equalsIgnoreCase(notice.getPriority())) {
            return; // Only fan out IMPORTANT or URGENT notices
        }

        Role targetRole = null;
        switch (notice.getAudience()) {
            case STUDENTS: targetRole = Role.ROLE_STUDENT; break;
            case TEACHERS: targetRole = Role.ROLE_TEACHER; break;
            case SECURITY: targetRole = Role.ROLE_SECURITY; break;
            case ADMIN: targetRole = Role.ROLE_ADMIN; break;
            case ALL: targetRole = null; break;
        }
        
        notificationService.fanOutNotificationToRole(
                targetRole,
                NotificationType.ANNOUNCEMENT,
                "New Campus Notice: " + notice.getPriority(),
                notice.getTitle(),
                "notices",
                notice.getId().toString(),
                "NOTICE:" + notice.getId() + ":PUBLISHED"
        );
    }
}
