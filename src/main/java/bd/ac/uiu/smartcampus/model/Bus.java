package bd.ac.uiu.smartcampus.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "buses")
public class Bus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String busCode; // e.g. "BUS-01"

    @Column(nullable = false, unique = true, length = 50)
    private String registrationNumber;

    @Column(nullable = false)
    private int capacity;

    @Column(length = 100)
    private String driverName;

    @Column(length = 30)
    private String driverPhone;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false, length = 30)
    private String operationalStatus = "AVAILABLE"; // AVAILABLE, IN_SERVICE, ON_ROUTE, MAINTENANCE, OUT_OF_SERVICE

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Bus() {
    }

    public Bus(String busCode, String registrationNumber, int capacity, String driverName, String driverPhone) {
        this.busCode = busCode;
        this.registrationNumber = registrationNumber;
        this.capacity = capacity;
        this.driverName = driverName;
        this.driverPhone = driverPhone;
        this.active = true;
        this.operationalStatus = "AVAILABLE";
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getBusCode() {
        return busCode;
    }

    public void setBusCode(String busCode) {
        this.busCode = busCode;
    }

    public String getRegistrationNumber() {
        return registrationNumber;
    }

    public void setRegistrationNumber(String registrationNumber) {
        this.registrationNumber = registrationNumber;
    }

    public int getCapacity() {
        return capacity;
    }

    public void setCapacity(int capacity) {
        this.capacity = capacity;
    }

    public String getDriverName() {
        return driverName;
    }

    public void setDriverName(String driverName) {
        this.driverName = driverName;
    }

    public String getDriverPhone() {
        return driverPhone;
    }

    public void setDriverPhone(String driverPhone) {
        this.driverPhone = driverPhone;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public String getOperationalStatus() {
        return operationalStatus;
    }

    public void setOperationalStatus(String operationalStatus) {
        this.operationalStatus = operationalStatus;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
