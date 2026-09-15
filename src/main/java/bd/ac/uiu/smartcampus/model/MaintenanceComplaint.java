package bd.ac.uiu.smartcampus.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "maintenance_complaints")
public class MaintenanceComplaint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String studentName;

    @Column(nullable = false, length = 30)
    private String studentId;

    @Column(length = 50)
    private String reporterId;

    @Column(length = 100)
    private String reporterName;

    @Column(length = 30)
    private String reporterRole;

    @Column(nullable = false, length = 50)
    private String location; // e.g., Room 522, Lab 4, Cafeteria

    @Column(nullable = false, length = 100)
    private String issueTitle;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 30)
    private String status = "OPEN"; // OPEN, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED

    @Column(length = 30)
    private String priority = "MEDIUM"; // HIGH, MEDIUM, LOW

    @Column(nullable = false)
    private LocalDateTime reportedAt = LocalDateTime.now();

    @Column
    private LocalDateTime resolvedAt;

    @Column(columnDefinition = "TEXT")
    private String resolutionNote;

    public MaintenanceComplaint() {
    }

    public MaintenanceComplaint(String studentName, String studentId, String location, String issueTitle, String description, String priority) {
        this.studentName = studentName;
        this.studentId = studentId;
        this.reporterName = studentName;
        this.reporterId = studentId;
        this.reporterRole = "ROLE_STUDENT";
        this.location = location;
        this.issueTitle = issueTitle;
        this.description = description;
        this.priority = priority;
        this.status = "OPEN";
        this.reportedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public String getReporterId() {
        return reporterId;
    }

    public void setReporterId(String reporterId) {
        this.reporterId = reporterId;
    }

    public String getReporterName() {
        return reporterName;
    }

    public void setReporterName(String reporterName) {
        this.reporterName = reporterName;
    }

    public String getReporterRole() {
        return reporterRole;
    }

    public void setReporterRole(String reporterRole) {
        this.reporterRole = reporterRole;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getIssueTitle() {
        return issueTitle;
    }

    public void setIssueTitle(String issueTitle) {
        this.issueTitle = issueTitle;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
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

    public String getResolutionNote() {
        return resolutionNote;
    }

    public void setResolutionNote(String resolutionNote) {
        this.resolutionNote = resolutionNote;
    }
}
