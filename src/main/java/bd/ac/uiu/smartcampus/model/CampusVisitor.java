package bd.ac.uiu.smartcampus.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "campus_visitors")
public class CampusVisitor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String passCode; // e.g. "VIS-UIU-78219"

    @Column(nullable = false, length = 100)
    private String visitorName;

    @Column(nullable = false, length = 30)
    private String phone;

    @Column(length = 100)
    private String email;

    @Column(nullable = false, length = 255)
    private String purpose;

    @Column(nullable = false, length = 100)
    private String hostName;

    @Column(nullable = false, length = 50)
    private String hostDepartment;

    @Column(nullable = false)
    private LocalDate visitDate;

    @Column
    private LocalTime expectedEntryTime;

    @Column
    private LocalDateTime actualCheckInTime;

    @Column
    private LocalDateTime actualCheckOutTime;

    @Column(nullable = false, length = 30)
    private String status = "PENDING"; // "PENDING", "APPROVED", "REJECTED", "CHECKED_IN", "CHECKED_OUT"

    @Column(length = 50)
    private String vehicleNumber;

    @Column(length = 50)
    private String nationalId;

    @Column(length = 100)
    private String approvedBy;

    @Column(length = 255)
    private String securityRemarks;

    @Column(nullable = false)
    private boolean walkIn = false;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public CampusVisitor() {
        this.passCode = "VIS-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    public CampusVisitor(String visitorName, String phone, String email, String purpose,
                         String hostName, String hostDepartment, LocalDate visitDate,
                         LocalTime expectedEntryTime, String vehicleNumber, String nationalId, boolean walkIn) {
        this.passCode = "VIS-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        this.visitorName = visitorName;
        this.phone = phone;
        this.email = email;
        this.purpose = purpose;
        this.hostName = hostName;
        this.hostDepartment = hostDepartment;
        this.visitDate = visitDate;
        this.expectedEntryTime = expectedEntryTime != null ? expectedEntryTime : LocalTime.of(10, 0);
        this.vehicleNumber = vehicleNumber;
        this.nationalId = nationalId;
        this.walkIn = walkIn;
        this.status = walkIn ? "CHECKED_IN" : "PENDING";
        if (walkIn) {
            this.actualCheckInTime = LocalDateTime.now();
            this.approvedBy = "Gate Security Officer";
        }
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPassCode() {
        return passCode;
    }

    public void setPassCode(String passCode) {
        this.passCode = passCode;
    }

    public String getVisitorName() {
        return visitorName;
    }

    public void setVisitorName(String visitorName) {
        this.visitorName = visitorName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public String getHostName() {
        return hostName;
    }

    public void setHostName(String hostName) {
        this.hostName = hostName;
    }

    public String getHostDepartment() {
        return hostDepartment;
    }

    public void setHostDepartment(String hostDepartment) {
        this.hostDepartment = hostDepartment;
    }

    public LocalDate getVisitDate() {
        return visitDate;
    }

    public void setVisitDate(LocalDate visitDate) {
        this.visitDate = visitDate;
    }

    public LocalTime getExpectedEntryTime() {
        return expectedEntryTime;
    }

    public void setExpectedEntryTime(LocalTime expectedEntryTime) {
        this.expectedEntryTime = expectedEntryTime;
    }

    public LocalDateTime getActualCheckInTime() {
        return actualCheckInTime;
    }

    public void setActualCheckInTime(LocalDateTime actualCheckInTime) {
        this.actualCheckInTime = actualCheckInTime;
    }

    public LocalDateTime getActualCheckOutTime() {
        return actualCheckOutTime;
    }

    public void setActualCheckOutTime(LocalDateTime actualCheckOutTime) {
        this.actualCheckOutTime = actualCheckOutTime;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getVehicleNumber() {
        return vehicleNumber;
    }

    public void setVehicleNumber(String vehicleNumber) {
        this.vehicleNumber = vehicleNumber;
    }

    public String getNationalId() {
        return nationalId;
    }

    public void setNationalId(String nationalId) {
        this.nationalId = nationalId;
    }

    public String getApprovedBy() {
        return approvedBy;
    }

    public void setApprovedBy(String approvedBy) {
        this.approvedBy = approvedBy;
    }

    public String getSecurityRemarks() {
        return securityRemarks;
    }

    public void setSecurityRemarks(String securityRemarks) {
        this.securityRemarks = securityRemarks;
    }

    public boolean isWalkIn() {
        return walkIn;
    }

    public void setWalkIn(boolean walkIn) {
        this.walkIn = walkIn;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
