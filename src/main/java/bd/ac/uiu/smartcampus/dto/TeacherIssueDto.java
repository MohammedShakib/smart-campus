package bd.ac.uiu.smartcampus.dto;

import java.time.LocalDateTime;

public class TeacherIssueDto {
    private Long id;
    private String issueTitle;
    private String location;
    private String priority;
    private String status;
    private String description;
    private LocalDateTime reportedAt;

    public TeacherIssueDto(Long id, String issueTitle, String location, String priority, String status, String description, LocalDateTime reportedAt) {
        this.id = id;
        this.issueTitle = issueTitle;
        this.location = location;
        this.priority = priority;
        this.status = status;
        this.description = description;
        this.reportedAt = reportedAt;
    }

    public TeacherIssueDto() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getIssueTitle() {
        return issueTitle;
    }

    public void setIssueTitle(String issueTitle) {
        this.issueTitle = issueTitle;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getReportedAt() {
        return reportedAt;
    }

    public void setReportedAt(LocalDateTime reportedAt) {
        this.reportedAt = reportedAt;
    }
}
