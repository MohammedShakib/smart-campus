package bd.ac.uiu.smartcampus.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "emergency_alerts")
public class EmergencyAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String alertTitle;

    @Column(nullable = false, length = 1000)
    private String alertMessage;

    @Column(nullable = false, length = 30)
    private String severity = "WARNING"; // "INFO", "WARNING", "CRITICAL", "EMERGENCY"

    @Column(nullable = false, length = 50)
    private String category = "GENERAL"; // "FIRE", "MEDICAL", "SECURITY", "POWER", "WEATHER", "EVACUATION", "GENERAL"

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false)
    private LocalDateTime broadcastTime = LocalDateTime.now();

    @Column
    private LocalDateTime resolvedTime;

    @Column(length = 100)
    private String broadcastBy = "Chief Security Officer";

    @Column(length = 255)
    private String resolutionNotes;

    public EmergencyAlert() {
    }

    public EmergencyAlert(String alertTitle, String alertMessage, String severity, String category, String broadcastBy) {
        this.alertTitle = alertTitle;
        this.alertMessage = alertMessage;
        this.severity = severity;
        this.category = category;
        this.broadcastBy = broadcastBy;
        this.active = true;
        this.broadcastTime = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getAlertTitle() {
        return alertTitle;
    }

    public void setAlertTitle(String alertTitle) {
        this.alertTitle = alertTitle;
    }

    public String getAlertMessage() {
        return alertMessage;
    }

    public void setAlertMessage(String alertMessage) {
        this.alertMessage = alertMessage;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public LocalDateTime getBroadcastTime() {
        return broadcastTime;
    }

    public void setBroadcastTime(LocalDateTime broadcastTime) {
        this.broadcastTime = broadcastTime;
    }

    public LocalDateTime getResolvedTime() {
        return resolvedTime;
    }

    public void setResolvedTime(LocalDateTime resolvedTime) {
        this.resolvedTime = resolvedTime;
    }

    public String getBroadcastBy() {
        return broadcastBy;
    }

    public void setBroadcastBy(String broadcastBy) {
        this.broadcastBy = broadcastBy;
    }

    public String getResolutionNotes() {
        return resolutionNotes;
    }

    public void setResolutionNotes(String resolutionNotes) {
        this.resolutionNotes = resolutionNotes;
    }
}
