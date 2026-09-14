package bd.ac.uiu.smartcampus.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "security_incidents")
public class SecurityIncident {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, length = 50)
    private String incidentType; // "UNAUTHORIZED_ENTRY", "PROPERTY_DAMAGE", "MEDICAL_EMERGENCY", "SUSPICIOUS_ACTIVITY", "TRAFFIC_PARKING", "THEFT_LOST", "OTHER"

    @Column(nullable = false, length = 100)
    private String location;

    @Column(nullable = false, length = 30)
    private String severity = "MEDIUM"; // "LOW", "MEDIUM", "HIGH", "CRITICAL"

    @Column(nullable = false, length = 1000)
    private String description;

    @Column(length = 255)
    private String involvedPersons;

    @Column(nullable = false, length = 100)
    private String reportedBy = "Officer Abul Kalam";

    @Column(nullable = false, length = 30)
    private String status = "OPEN"; // "OPEN", "INVESTIGATING", "RESOLVED", "ESCALATED"

    @Column(length = 500)
    private String actionTaken;

    @Column(nullable = false)
    private LocalDateTime reportedAt = LocalDateTime.now();

    @Column
    private LocalDateTime resolvedAt;

    public SecurityIncident() {
    }

    public SecurityIncident(String title, String incidentType, String location, String severity,
                            String description, String involvedPersons, String reportedBy) {
        this.title = title;
        this.incidentType = incidentType;
        this.location = location;
        this.severity = severity;
        this.description = description;
        this.involvedPersons = involvedPersons;
        this.reportedBy = reportedBy;
        this.status = "OPEN";
        this.reportedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getIncidentType() {
        return incidentType;
    }

    public void setIncidentType(String incidentType) {
        this.incidentType = incidentType;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getInvolvedPersons() {
        return involvedPersons;
    }

    public void setInvolvedPersons(String involvedPersons) {
        this.involvedPersons = involvedPersons;
    }

    public String getReportedBy() {
        return reportedBy;
    }

    public void setReportedBy(String reportedBy) {
        this.reportedBy = reportedBy;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getActionTaken() {
        return actionTaken;
    }

    public void setActionTaken(String actionTaken) {
        this.actionTaken = actionTaken;
    }

    public LocalDateTime getReportedAt() {
        return reportedAt;
    }

    public void setReportedAt(LocalDateTime reportedAt) {
        this.reportedAt = reportedAt;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(LocalDateTime resolvedAt) {
        this.resolvedAt = resolvedAt;
    }
}
