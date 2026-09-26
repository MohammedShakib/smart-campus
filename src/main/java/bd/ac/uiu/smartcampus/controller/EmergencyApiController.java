package bd.ac.uiu.smartcampus.controller;

import bd.ac.uiu.smartcampus.dto.ApiResponse;
import bd.ac.uiu.smartcampus.model.EmergencyAlert;
import bd.ac.uiu.smartcampus.service.SecurityService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Shared emergency read-only endpoint.
 * Accessible by ALL authenticated roles (Admin, Teacher, Student, Security).
 * Emergency mutation remains under /api/security/emergency (Security/Admin only).
 */
@RestController
@RequestMapping("/api/emergencies")
public class EmergencyApiController {

    private final SecurityService securityService;

    public EmergencyApiController(SecurityService securityService) {
        this.securityService = securityService;
    }

    /**
     * Shared cross-role read: returns currently active (not yet resolved) emergency alerts.
     * Called by ActiveEmergencyBanner shown on all dashboards.
     */
    @GetMapping("/active")
    public ApiResponse<List<EmergencyAlert>> getActiveEmergencies() {
        return ApiResponse.ok("Active emergency alerts", securityService.getActiveEmergencyAlerts());
    }
}
