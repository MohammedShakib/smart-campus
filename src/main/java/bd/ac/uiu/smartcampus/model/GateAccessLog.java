package bd.ac.uiu.smartcampus.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "gate_access_logs")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class GateAccessLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password", "departmentRef"})
    private User user;

    @Column(length = 50)
    private String identifierSnapshot; // E.g., the student ID used

    @Column(length = 30)
    private String userRoleSnapshot;

    @Column(nullable = false, length = 10)
    private String accessType; // ENTRY, EXIT

    @Column(nullable = false, length = 50)
    private String gateName;

    @Column(nullable = false, length = 100)
    private String securityOfficer;

    @Column(nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now();

    @Column(nullable = false, length = 10)
    private String result; // ALLOWED, DENIED

    @Column(length = 255)
    private String note;

    public GateAccessLog() {
    }

    public GateAccessLog(User user, String identifierSnapshot, String userRoleSnapshot, 
                         String accessType, String gateName, String securityOfficer, 
                         String result, String note) {
        this.user = user;
        this.identifierSnapshot = identifierSnapshot;
        this.userRoleSnapshot = userRoleSnapshot;
        this.accessType = accessType;
        this.gateName = gateName;
        this.securityOfficer = securityOfficer;
        this.result = result;
        this.note = note;
        this.timestamp = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getIdentifierSnapshot() {
        return identifierSnapshot;
    }

    public void setIdentifierSnapshot(String identifierSnapshot) {
        this.identifierSnapshot = identifierSnapshot;
    }

    public String getUserRoleSnapshot() {
        return userRoleSnapshot;
    }

    public void setUserRoleSnapshot(String userRoleSnapshot) {
        this.userRoleSnapshot = userRoleSnapshot;
    }

    public String getAccessType() {
        return accessType;
    }

    public void setAccessType(String accessType) {
        this.accessType = accessType;
    }

    public String getGateName() {
        return gateName;
    }

    public void setGateName(String gateName) {
        this.gateName = gateName;
    }

    public String getSecurityOfficer() {
        return securityOfficer;
    }

    public void setSecurityOfficer(String securityOfficer) {
        this.securityOfficer = securityOfficer;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getResult() {
        return result;
    }

    public void setResult(String result) {
        this.result = result;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
