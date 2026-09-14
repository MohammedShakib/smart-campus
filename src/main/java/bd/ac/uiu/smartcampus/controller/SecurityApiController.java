package bd.ac.uiu.smartcampus.controller;

import bd.ac.uiu.smartcampus.dto.*;
import bd.ac.uiu.smartcampus.model.CampusVisitor;
import bd.ac.uiu.smartcampus.model.EmergencyAlert;
import bd.ac.uiu.smartcampus.model.ParkingZone;
import bd.ac.uiu.smartcampus.model.SecurityIncident;
import bd.ac.uiu.smartcampus.security.CustomUserDetails;
import bd.ac.uiu.smartcampus.service.SecurityService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/security")
public class SecurityApiController {

    private final SecurityService securityService;

    public SecurityApiController(SecurityService securityService) {
        this.securityService = securityService;
    }

    // ─── DASHBOARD SUMMARY ──────────────────────────────────────
    @GetMapping("/summary")
    public ApiResponse<Map<String, Object>> getSecuritySummary() {
        return ApiResponse.ok("Security dashboard summary", securityService.getDashboardSummary());
    }

    // ─── VISITOR MANAGEMENT ─────────────────────────────────────
    @GetMapping("/visitors")
    public ApiResponse<List<CampusVisitor>> getVisitors(@RequestParam(required = false) String search,
                                                        @RequestParam(required = false) String status) {
        if (search != null && !search.isBlank()) {
            return ApiResponse.ok("Search results", securityService.searchVisitors(search));
        }
        if ("PENDING".equalsIgnoreCase(status)) {
            return ApiResponse.ok("Pending visitors", securityService.getPendingVisitors());
        }
        return ApiResponse.ok("Visitor records", securityService.getAllVisitors());
    }

    @GetMapping("/visitors/pending")
    public ApiResponse<List<CampusVisitor>> getPendingVisitors() {
        return ApiResponse.ok("Pending visitor requests", securityService.getPendingVisitors());
    }

    @PostMapping("/visitors/request")
    public ApiResponse<CampusVisitor> createVisitor(@RequestBody VisitorRequestDto dto,
                                                    @AuthenticationPrincipal CustomUserDetails userDetails) {
        String officer = userDetails != null ? userDetails.getFullName() : "Security Post";
        CampusVisitor created = securityService.createVisitorRequest(dto, officer);
        return ApiResponse.ok(dto.isWalkIn() ? "Walk-in visitor logged & checked in!" : "Visitor request created successfully!", created);
    }

    @PostMapping("/visitors/{id}/approve")
    public ApiResponse<CampusVisitor> approveVisitor(@PathVariable Long id,
                                                     @RequestParam(required = false, defaultValue = "") String remarks,
                                                     @AuthenticationPrincipal CustomUserDetails userDetails) {
        String officer = userDetails != null ? userDetails.getFullName() : "Security Officer";
        CampusVisitor approved = securityService.approveVisitor(id, officer, remarks);
        return ApiResponse.ok("Visitor #" + id + " has been approved.", approved);
    }

    @PostMapping("/visitors/{id}/reject")
    public ApiResponse<CampusVisitor> rejectVisitor(@PathVariable Long id,
                                                    @RequestParam(required = false, defaultValue = "") String remarks,
                                                    @AuthenticationPrincipal CustomUserDetails userDetails) {
        String officer = userDetails != null ? userDetails.getFullName() : "Security Officer";
        CampusVisitor rejected = securityService.rejectVisitor(id, officer, remarks);
        return ApiResponse.ok("Visitor #" + id + " has been rejected.", rejected);
    }

    @GetMapping("/visitors/verify")
    public ApiResponse<CampusVisitor> verifyPass(@RequestParam String passCode) {
        try {
            CampusVisitor visitor = securityService.verifyPassCode(passCode);
            return ApiResponse.ok("Valid QR Pass: " + visitor.getVisitorName() + " (" + visitor.getStatus() + ")", visitor);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/visitors/checkin")
    public ApiResponse<CampusVisitor> confirmEntry(@RequestParam String passCodeOrId,
                                                   @AuthenticationPrincipal CustomUserDetails userDetails) {
        String officer = userDetails != null ? userDetails.getFullName() : "Gate Security Post";
        try {
            CampusVisitor checkedIn = securityService.confirmEntry(passCodeOrId, officer);
            return ApiResponse.ok("Entry Confirmed: Visitor " + checkedIn.getVisitorName() + " checked in successfully!", checkedIn);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/visitors/checkout")
    public ApiResponse<CampusVisitor> confirmExit(@RequestParam String passCodeOrId,
                                                  @AuthenticationPrincipal CustomUserDetails userDetails) {
        String officer = userDetails != null ? userDetails.getFullName() : "Gate Security Post";
        try {
            CampusVisitor checkedOut = securityService.confirmExit(passCodeOrId, officer);
            return ApiResponse.ok("Exit Confirmed: Visitor " + checkedOut.getVisitorName() + " checked out. Pass closed.", checkedOut);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    // ─── PARKING MANAGEMENT ─────────────────────────────────────
    @GetMapping("/parking")
    public ApiResponse<List<ParkingZone>> getParkingZones() {
        return ApiResponse.ok("Campus parking zones", securityService.getAllParkingZones());
    }

    @PostMapping("/parking/{zoneCode}/update")
    public ApiResponse<ParkingZone> updateParkingZone(@PathVariable String zoneCode,
                                                      @RequestBody ParkingZoneUpdateDto dto,
                                                      @AuthenticationPrincipal CustomUserDetails userDetails) {
        String officer = userDetails != null ? userDetails.getFullName() : "Security Officer";
        ParkingZone updated = securityService.updateParkingZone(zoneCode, dto, officer);
        return ApiResponse.ok("Parking zone " + zoneCode + " updated.", updated);
    }

    @PostMapping("/parking/{zoneCode}/adjust")
    public ApiResponse<ParkingZone> adjustParkingCount(@PathVariable String zoneCode,
                                                       @RequestParam int delta,
                                                       @AuthenticationPrincipal CustomUserDetails userDetails) {
        String officer = userDetails != null ? userDetails.getFullName() : "Security Officer";
        ParkingZone updated = securityService.adjustParkingCount(zoneCode, delta, officer);
        return ApiResponse.ok("Parking zone " + zoneCode + " adjusted (" + (delta >= 0 ? "+" : "") + delta + ")", updated);
    }

    // ─── EMERGENCY ALERTS ───────────────────────────────────────
    @GetMapping("/emergency/active")
    public ApiResponse<List<EmergencyAlert>> getActiveEmergencies() {
        return ApiResponse.ok("Active emergency alerts", securityService.getActiveEmergencyAlerts());
    }

    @GetMapping("/emergency/all")
    public ApiResponse<List<EmergencyAlert>> getAllEmergencies() {
        return ApiResponse.ok("All emergency alerts", securityService.getAllEmergencyAlerts());
    }

    @PostMapping("/emergency/broadcast")
    public ApiResponse<EmergencyAlert> broadcastEmergency(@RequestBody EmergencyAlertDto dto,
                                                          @AuthenticationPrincipal CustomUserDetails userDetails) {
        String officer = userDetails != null ? userDetails.getFullName() : "Security Command";
        EmergencyAlert broadcasted = securityService.broadcastEmergencyAlert(dto, officer);
        return ApiResponse.ok("🚨 EMERGENCY BROADCAST ACTIVATED: " + broadcasted.getAlertTitle(), broadcasted);
    }

    @PostMapping("/emergency/{id}/resolve")
    public ApiResponse<EmergencyAlert> resolveEmergency(@PathVariable Long id,
                                                        @RequestParam(required = false, defaultValue = "Resolved and safe.") String notes,
                                                        @AuthenticationPrincipal CustomUserDetails userDetails) {
        String officer = userDetails != null ? userDetails.getFullName() : "Security Officer";
        EmergencyAlert resolved = securityService.resolveEmergencyAlert(id, notes, officer);
        return ApiResponse.ok("Emergency alert #" + id + " has been resolved.", resolved);
    }

    // ─── INCIDENT REPORTING ─────────────────────────────────────
    @GetMapping("/incidents")
    public ApiResponse<List<SecurityIncident>> getIncidents(@RequestParam(required = false) String search) {
        if (search != null && !search.isBlank()) {
            return ApiResponse.ok("Search results", securityService.searchIncidents(search));
        }
        return ApiResponse.ok("Incident reports", securityService.getAllIncidents());
    }

    @PostMapping("/incidents/report")
    public ApiResponse<SecurityIncident> reportIncident(@RequestBody SecurityIncidentRequestDto dto,
                                                        @AuthenticationPrincipal CustomUserDetails userDetails) {
        String officer = userDetails != null ? userDetails.getFullName() : "Security Officer";
        SecurityIncident created = securityService.reportIncident(dto, officer);
        return ApiResponse.ok("Security Incident #" + created.getId() + " logged successfully.", created);
    }

    @PostMapping("/incidents/{id}/status")
    public ApiResponse<SecurityIncident> updateIncidentStatus(@PathVariable Long id,
                                                              @RequestParam String status,
                                                              @RequestParam(required = false, defaultValue = "") String actionTaken,
                                                              @AuthenticationPrincipal CustomUserDetails userDetails) {
        String officer = userDetails != null ? userDetails.getFullName() : "Security Officer";
        SecurityIncident updated = securityService.updateIncidentStatus(id, status, actionTaken, officer);
        return ApiResponse.ok("Incident #" + id + " status updated to " + status, updated);
    }
}
