package bd.ac.uiu.smartcampus.dto;

public class EmergencyAlertDto {
    private String alertTitle;
    private String alertMessage;
    private String severity; // "INFO", "WARNING", "CRITICAL", "EMERGENCY"
    private String category; // "FIRE", "MEDICAL", "SECURITY", "POWER", "WEATHER", "EVACUATION", "GENERAL"
    private String broadcastBy;
    private String resolutionNotes;

    public EmergencyAlertDto() {
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
