package bd.ac.uiu.smartcampus.dto;

public class SecurityIncidentRequestDto {
    private String title;
    private String incidentType;
    private String location;
    private String severity;
    private String description;
    private String involvedPersons;
    private String actionTaken;
    private String status;

    public SecurityIncidentRequestDto() {
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

    public String getActionTaken() {
        return actionTaken;
    }

    public void setActionTaken(String actionTaken) {
        this.actionTaken = actionTaken;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
