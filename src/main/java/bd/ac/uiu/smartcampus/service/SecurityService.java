package bd.ac.uiu.smartcampus.service;

import bd.ac.uiu.smartcampus.dto.*;
import bd.ac.uiu.smartcampus.model.CampusVisitor;
import bd.ac.uiu.smartcampus.model.EmergencyAlert;
import bd.ac.uiu.smartcampus.model.ParkingZone;
import bd.ac.uiu.smartcampus.model.SecurityIncident;
import bd.ac.uiu.smartcampus.repository.CampusVisitorRepository;
import bd.ac.uiu.smartcampus.repository.EmergencyAlertRepository;
import bd.ac.uiu.smartcampus.repository.ParkingZoneRepository;
import bd.ac.uiu.smartcampus.repository.SecurityIncidentRepository;
import bd.ac.uiu.smartcampus.syllabus.collections.AdminActionStackService;
import bd.ac.uiu.smartcampus.syllabus.collections.UniqueAttendeeSetService;
import bd.ac.uiu.smartcampus.syllabus.fileio.CampusLogFileWriter;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
public class SecurityService {

    private final CampusVisitorRepository visitorRepository;
    private final ParkingZoneRepository parkingZoneRepository;
    private final EmergencyAlertRepository emergencyAlertRepository;
    private final SecurityIncidentRepository incidentRepository;
    private final UniqueAttendeeSetService attendeeSetService;
    private final CampusLogFileWriter logFileWriter;
    private final AdminActionStackService actionStackService;

    public SecurityService(CampusVisitorRepository visitorRepository,
                           ParkingZoneRepository parkingZoneRepository,
                           EmergencyAlertRepository emergencyAlertRepository,
                           SecurityIncidentRepository incidentRepository,
                           UniqueAttendeeSetService attendeeSetService,
                           CampusLogFileWriter logFileWriter,
                           AdminActionStackService actionStackService) {
        this.visitorRepository = visitorRepository;
        this.parkingZoneRepository = parkingZoneRepository;
        this.emergencyAlertRepository = emergencyAlertRepository;
        this.incidentRepository = incidentRepository;
        this.attendeeSetService = attendeeSetService;
        this.logFileWriter = logFileWriter;
        this.actionStackService = actionStackService;
    }

    // ─── DASHBOARD SUMMARY ──────────────────────────────────────
    public Map<String, Object> getDashboardSummary() {
        Map<String, Object> summary = new LinkedHashMap<>();

        LocalDate today = LocalDate.now();
        List<CampusVisitor> allVisitors = visitorRepository.findTop50ByOrderByCreatedAtDesc();
        long pendingVisitors = visitorRepository.countByStatus("PENDING");
        long onCampusVisitors = allVisitors.stream().filter(v -> "CHECKED_IN".equals(v.getStatus())).count();
        long todayVisitors = allVisitors.stream().filter(v -> today.equals(v.getVisitDate())).count();

        List<ParkingZone> parkingZones = parkingZoneRepository.findAll();
        int totalParkingCapacity = parkingZones.stream().mapToInt(ParkingZone::getTotalCapacity).sum();
        int totalParkingOccupied = parkingZones.stream().mapToInt(ParkingZone::getCurrentOccupied).sum();

        List<EmergencyAlert> activeAlerts = emergencyAlertRepository.findByActiveTrueOrderByBroadcastTimeDesc();
        List<SecurityIncident> openIncidents = incidentRepository.findByStatusOrderByReportedAtDesc("OPEN");

        summary.put("todayVisitorsCount", todayVisitors);
        summary.put("pendingVisitorsCount", pendingVisitors);
        summary.put("onCampusVisitorsCount", onCampusVisitors);
        summary.put("uniqueGatePassCount", attendeeSetService.getUniqueCount());
        summary.put("totalParkingCapacity", totalParkingCapacity);
        summary.put("totalParkingOccupied", totalParkingOccupied);
        summary.put("parkingZones", parkingZones);
        summary.put("activeEmergencyAlerts", activeAlerts);
        summary.put("hasActiveEmergency", !activeAlerts.isEmpty());
        summary.put("openIncidentsCount", openIncidents.size());
        summary.put("recentVisitors", allVisitors.stream().limit(10).toList());
        summary.put("recentIncidents", incidentRepository.findTop50ByOrderByReportedAtDesc().stream().limit(5).toList());

        return summary;
    }

    // ─── VISITOR MANAGEMENT ─────────────────────────────────────
    public List<CampusVisitor> getAllVisitors() {
        return visitorRepository.findTop50ByOrderByCreatedAtDesc();
    }

    public List<CampusVisitor> getPendingVisitors() {
        return visitorRepository.findByStatusOrderByCreatedAtDesc("PENDING");
    }

    @Transactional
    public CampusVisitor createVisitorRequest(VisitorRequestDto dto, String officer) {
        LocalTime entryTime = LocalTime.of(10, 0);
        if (dto.getExpectedEntryTime() != null && !dto.getExpectedEntryTime().isBlank()) {
            try {
                entryTime = LocalTime.parse(dto.getExpectedEntryTime());
            } catch (Exception ignored) {
            }
        }
        LocalDate date = dto.getVisitDate() != null ? dto.getVisitDate() : LocalDate.now();

        CampusVisitor visitor = new CampusVisitor(
                dto.getVisitorName(),
                dto.getPhone(),
                dto.getEmail(),
                dto.getPurpose(),
                dto.getHostName(),
                dto.getHostDepartment() != null ? dto.getHostDepartment() : "General",
                date,
                entryTime,
                dto.getVehicleNumber(),
                dto.getNationalId(),
                dto.isWalkIn()
        );

        if (dto.isWalkIn()) {
            visitor.setApprovedBy(officer != null ? officer : "Gate Security Post");
            visitor.setActualCheckInTime(LocalDateTime.now());
            visitor.setStatus("CHECKED_IN");
            logFileWriter.appendAuditLog("SECURITY_WALKIN_VISITOR", "Walk-in visitor registered & checked in: " + visitor.getVisitorName() + " (" + visitor.getPassCode() + ")");
        } else {
            logFileWriter.appendAuditLog("VISITOR_REQUEST_CREATED", "Pre-registration request for: " + visitor.getVisitorName() + " (" + visitor.getPassCode() + ")");
        }

        return visitorRepository.save(visitor);
    }

    @Transactional
    public CampusVisitor approveVisitor(Long id, String approvedBy, String remarks) {
        CampusVisitor visitor = visitorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Visitor not found with ID: " + id));
        visitor.setStatus("APPROVED");
        visitor.setApprovedBy(approvedBy != null ? approvedBy : "Gate Security Officer");
        if (remarks != null && !remarks.isBlank()) {
            visitor.setSecurityRemarks(remarks);
        }
        logFileWriter.appendAuditLog("SECURITY_VISITOR_APPROVED", "Visitor #" + id + " (" + visitor.getVisitorName() + ") approved by " + approvedBy);
        return visitorRepository.save(visitor);
    }

    @Transactional
    public CampusVisitor rejectVisitor(Long id, String rejectedBy, String remarks) {
        CampusVisitor visitor = visitorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Visitor not found with ID: " + id));
        visitor.setStatus("REJECTED");
        visitor.setApprovedBy(rejectedBy != null ? rejectedBy : "Gate Security Officer");
        if (remarks != null && !remarks.isBlank()) {
            visitor.setSecurityRemarks(remarks);
        }
        logFileWriter.appendAuditLog("SECURITY_VISITOR_REJECTED", "Visitor #" + id + " (" + visitor.getVisitorName() + ") rejected by " + rejectedBy);
        return visitorRepository.save(visitor);
    }

    public CampusVisitor verifyPassCode(String passCode) {
        String trimmed = passCode != null ? passCode.trim() : "";
        return visitorRepository.findByPassCode(trimmed)
                .orElseThrow(() -> new IllegalArgumentException("Invalid QR Pass Code or visitor record not found: " + trimmed));
    }

    @Transactional
    public CampusVisitor confirmEntry(String passCodeOrId, String officer) {
        CampusVisitor visitor;
        try {
            Long id = Long.parseLong(passCodeOrId);
            visitor = visitorRepository.findById(id)
                    .orElseGet(() -> visitorRepository.findByPassCode(passCodeOrId)
                            .orElseThrow(() -> new IllegalArgumentException("Visitor not found.")));
        } catch (NumberFormatException e) {
            visitor = visitorRepository.findByPassCode(passCodeOrId)
                    .orElseThrow(() -> new IllegalArgumentException("Visitor not found with Pass Code: " + passCodeOrId));
        }

        if ("REJECTED".equals(visitor.getStatus())) {
            throw new IllegalStateException("Cannot check in a rejected visitor pass.");
        }
        if ("CHECKED_IN".equals(visitor.getStatus())) {
            throw new IllegalStateException("Visitor is already checked in at " + visitor.getActualCheckInTime());
        }
        if ("CHECKED_OUT".equals(visitor.getStatus())) {
            throw new IllegalStateException("Visitor has already checked out and pass is closed.");
        }

        visitor.setStatus("CHECKED_IN");
        visitor.setActualCheckInTime(LocalDateTime.now());
        if (visitor.getApprovedBy() == null) {
            visitor.setApprovedBy(officer);
        }
        logFileWriter.appendAuditLog("SECURITY_ENTRY_CONFIRMED", "Visitor checked in: " + visitor.getVisitorName() + " (" + visitor.getPassCode() + ") by " + officer);
        return visitorRepository.save(visitor);
    }

    @Transactional
    public CampusVisitor confirmExit(String passCodeOrId, String officer) {
        CampusVisitor visitor;
        try {
            Long id = Long.parseLong(passCodeOrId);
            visitor = visitorRepository.findById(id)
                    .orElseGet(() -> visitorRepository.findByPassCode(passCodeOrId)
                            .orElseThrow(() -> new IllegalArgumentException("Visitor not found.")));
        } catch (NumberFormatException e) {
            visitor = visitorRepository.findByPassCode(passCodeOrId)
                    .orElseThrow(() -> new IllegalArgumentException("Visitor not found with Pass Code: " + passCodeOrId));
        }

        if (!"CHECKED_IN".equals(visitor.getStatus())) {
            throw new IllegalStateException("Visitor is not currently checked in (Status: " + visitor.getStatus() + ").");
        }

        visitor.setStatus("CHECKED_OUT");
        visitor.setActualCheckOutTime(LocalDateTime.now());
        logFileWriter.appendAuditLog("SECURITY_EXIT_CONFIRMED", "Visitor checked out: " + visitor.getVisitorName() + " (" + visitor.getPassCode() + ") by " + officer);
        return visitorRepository.save(visitor);
    }

    public List<CampusVisitor> searchVisitors(String query) {
        if (query == null || query.isBlank()) {
            return getAllVisitors();
        }
        return visitorRepository.searchVisitors(query.trim());
    }

    // ─── PARKING MANAGEMENT ─────────────────────────────────────
    public List<ParkingZone> getAllParkingZones() {
        return parkingZoneRepository.findAll();
    }

    @Transactional
    public ParkingZone updateParkingZone(String zoneCode, ParkingZoneUpdateDto dto, String officer) {
        ParkingZone zone = parkingZoneRepository.findByZoneCode(zoneCode)
                .orElseThrow(() -> new IllegalArgumentException("Parking zone not found: " + zoneCode));

        if (dto.getCurrentOccupied() != null) {
            zone.setCurrentOccupied(Math.max(0, dto.getCurrentOccupied()));
        }
        if (dto.getTotalCapacity() != null && dto.getTotalCapacity() > 0) {
            zone.setTotalCapacity(dto.getTotalCapacity());
        }
        if (dto.getStatus() != null && !dto.getStatus().isBlank()) {
            zone.setStatus(dto.getStatus());
        } else {
            zone.updateStatus();
        }
        zone.setLastUpdate(LocalDateTime.now());

        logFileWriter.appendAuditLog("SECURITY_PARKING_UPDATE", "Parking zone " + zoneCode + " updated: " + zone.getCurrentOccupied() + "/" + zone.getTotalCapacity() + " (" + zone.getStatus() + ") by " + officer);
        return parkingZoneRepository.save(zone);
    }

    @Transactional
    public ParkingZone adjustParkingCount(String zoneCode, int delta, String officer) {
        ParkingZone zone = parkingZoneRepository.findByZoneCode(zoneCode)
                .orElseThrow(() -> new IllegalArgumentException("Parking zone not found: " + zoneCode));

        int newCount = Math.max(0, Math.min(zone.getTotalCapacity(), zone.getCurrentOccupied() + delta));
        zone.setCurrentOccupied(newCount);
        zone.updateStatus();
        zone.setLastUpdate(LocalDateTime.now());

        logFileWriter.appendAuditLog("SECURITY_PARKING_ADJUST", "Parking zone " + zoneCode + " adjusted (" + (delta >= 0 ? "+" : "") + delta + ") to " + newCount + "/" + zone.getTotalCapacity() + " by " + officer);
        return parkingZoneRepository.save(zone);
    }

    // ─── EMERGENCY MANAGEMENT ───────────────────────────────────
    public List<EmergencyAlert> getActiveEmergencyAlerts() {
        return emergencyAlertRepository.findByActiveTrueOrderByBroadcastTimeDesc();
    }

    public List<EmergencyAlert> getAllEmergencyAlerts() {
        return emergencyAlertRepository.findTop20ByOrderByBroadcastTimeDesc();
    }

    @Transactional
    public EmergencyAlert broadcastEmergencyAlert(EmergencyAlertDto dto, String broadcastBy) {
        if (dto.getAlertTitle() == null || dto.getAlertTitle().isBlank()) {
            throw new IllegalArgumentException("Alert title is required.");
        }
        if (dto.getAlertMessage() == null || dto.getAlertMessage().isBlank()) {
            throw new IllegalArgumentException("Alert message is required.");
        }

        EmergencyAlert alert = new EmergencyAlert(
                dto.getAlertTitle(),
                dto.getAlertMessage(),
                dto.getSeverity() != null ? dto.getSeverity() : "CRITICAL",
                dto.getCategory() != null ? dto.getCategory() : "GENERAL",
                broadcastBy != null ? broadcastBy : "Campus Security Command"
        );

        EmergencyAlert saved = emergencyAlertRepository.save(alert);
        logFileWriter.appendAuditLog("EMERGENCY_BROADCAST", "EMERGENCY BROADCAST ACTIVATED: [" + alert.getSeverity() + "] " + alert.getAlertTitle() + " by " + broadcastBy);
        actionStackService.recordAction(broadcastBy != null ? broadcastBy : "security-demo", "EMERGENCY_BROADCAST", "Broadcasted alert: " + alert.getAlertTitle());
        return saved;
    }

    @Transactional
    public EmergencyAlert resolveEmergencyAlert(Long id, String resolutionNotes, String officer) {
        EmergencyAlert alert = emergencyAlertRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Emergency alert not found with ID: " + id));

        alert.setActive(false);
        alert.setResolvedTime(LocalDateTime.now());
        alert.setResolutionNotes(resolutionNotes != null ? resolutionNotes : "Resolved and declared safe by Security Control.");

        logFileWriter.appendAuditLog("EMERGENCY_RESOLVED", "Emergency Alert #" + id + " (" + alert.getAlertTitle() + ") marked resolved by " + officer);
        actionStackService.recordAction(officer != null ? officer : "security-demo", "EMERGENCY_RESOLVED", "Resolved alert: " + alert.getAlertTitle());
        return emergencyAlertRepository.save(alert);
    }

    // ─── INCIDENT REPORTING ─────────────────────────────────────
    public List<SecurityIncident> getAllIncidents() {
        return incidentRepository.findTop50ByOrderByReportedAtDesc();
    }

    @Transactional
    public SecurityIncident reportIncident(SecurityIncidentRequestDto dto, String reportedBy) {
        if (dto.getTitle() == null || dto.getTitle().isBlank()) {
            throw new IllegalArgumentException("Incident title is required.");
        }
        if (dto.getLocation() == null || dto.getLocation().isBlank()) {
            throw new IllegalArgumentException("Incident location is required.");
        }

        SecurityIncident incident = new SecurityIncident(
                dto.getTitle(),
                dto.getIncidentType() != null ? dto.getIncidentType() : "OTHER",
                dto.getLocation(),
                dto.getSeverity() != null ? dto.getSeverity() : "MEDIUM",
                dto.getDescription() != null ? dto.getDescription() : "",
                dto.getInvolvedPersons(),
                reportedBy != null ? reportedBy : "Security Post"
        );

        if (dto.getActionTaken() != null) {
            incident.setActionTaken(dto.getActionTaken());
        }

        SecurityIncident saved = incidentRepository.save(incident);
        logFileWriter.appendAuditLog("SECURITY_INCIDENT_LOGGED", "Security Incident #" + saved.getId() + " (" + saved.getTitle() + ") logged by " + reportedBy);
        return saved;
    }

    @Transactional
    public SecurityIncident updateIncidentStatus(Long id, String status, String actionTaken, String officer) {
        SecurityIncident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Incident not found with ID: " + id));

        incident.setStatus(status);
        if (actionTaken != null && !actionTaken.isBlank()) {
            incident.setActionTaken(actionTaken);
        }
        if ("RESOLVED".equalsIgnoreCase(status)) {
            incident.setResolvedAt(LocalDateTime.now());
        }

        logFileWriter.appendAuditLog("SECURITY_INCIDENT_UPDATED", "Incident #" + id + " updated to " + status + " by " + officer);
        return incidentRepository.save(incident);
    }

    public List<SecurityIncident> searchIncidents(String query) {
        if (query == null || query.isBlank()) {
            return getAllIncidents();
        }
        return incidentRepository.searchIncidents(query.trim());
    }
}
