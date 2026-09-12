package bd.ac.uiu.smartcampus.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "admin_action_logs")
public class AdminActionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String adminEmail;

    @Column(nullable = false, length = 100)
    private String actionType; // USER_CREATE, NOTICE_POST, GATE_LOCKDOWN, CONFIG_CHANGE

    @Column(nullable = false, columnDefinition = "TEXT")
    private String actionDetails;

    @Column(nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now();

    public AdminActionLog() {
    }

    public AdminActionLog(String adminEmail, String actionType, String actionDetails) {
        this.adminEmail = adminEmail;
        this.actionType = actionType;
        this.actionDetails = actionDetails;
        this.timestamp = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getAdminEmail() {
        return adminEmail;
    }

    public void setAdminEmail(String adminEmail) {
        this.adminEmail = adminEmail;
    }

    public String getActionType() {
        return actionType;
    }

    public void setActionType(String actionType) {
        this.actionType = actionType;
    }

    public String getActionDetails() {
        return actionDetails;
    }

    public void setActionDetails(String actionDetails) {
        this.actionDetails = actionDetails;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
