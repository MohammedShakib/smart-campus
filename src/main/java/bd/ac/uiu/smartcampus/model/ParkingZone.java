package bd.ac.uiu.smartcampus.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "parking_zones")
public class ParkingZone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String zoneCode; // e.g. "B1-EAST", "B1-WEST", "B2-BIKE", "OPEN-GROUND"

    @Column(nullable = false, length = 100)
    private String zoneName; // e.g. "Basement 1 - East Wing (Faculty & Staff)"

    @Column(nullable = false, length = 30)
    private String type = "CAR"; // "CAR", "MOTORCYCLE", "FACULTY_VIP", "GENERAL"

    @Column(nullable = false)
    private int totalCapacity = 100;

    @Column(nullable = false)
    private int currentOccupied = 0;

    @Column(nullable = false, length = 30)
    private String status = "AVAILABLE"; // "AVAILABLE", "ALMOST_FULL", "FULL", "MAINTENANCE", "CLOSED"

    @Column(nullable = false)
    private int fullThresholdPercent = 90;

    @Column(nullable = false)
    private LocalDateTime lastUpdate = LocalDateTime.now();

    public ParkingZone() {
    }

    public ParkingZone(String zoneCode, String zoneName, String type, int totalCapacity, int currentOccupied, int fullThresholdPercent) {
        this.zoneCode = zoneCode;
        this.zoneName = zoneName;
        this.type = type;
        this.totalCapacity = totalCapacity;
        this.currentOccupied = currentOccupied;
        this.fullThresholdPercent = fullThresholdPercent;
        updateStatus();
        this.lastUpdate = LocalDateTime.now();
    }

    public void updateStatus() {
        if ("CLOSED".equalsIgnoreCase(this.status) || "MAINTENANCE".equalsIgnoreCase(this.status)) {
            return;
        }
        if (totalCapacity <= 0) {
            this.status = "MAINTENANCE";
            return;
        }
        double ratio = (double) currentOccupied / totalCapacity;
        if (ratio >= 1.0) {
            this.status = "FULL";
        } else if (ratio >= ((double) fullThresholdPercent / 100.0)) {
            this.status = "ALMOST_FULL";
        } else {
            this.status = "AVAILABLE";
        }
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getZoneCode() {
        return zoneCode;
    }

    public void setZoneCode(String zoneCode) {
        this.zoneCode = zoneCode;
    }

    public String getZoneName() {
        return zoneName;
    }

    public void setZoneName(String zoneName) {
        this.zoneName = zoneName;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public int getTotalCapacity() {
        return totalCapacity;
    }

    public void setTotalCapacity(int totalCapacity) {
        this.totalCapacity = totalCapacity;
        updateStatus();
    }

    public int getCurrentOccupied() {
        return currentOccupied;
    }

    public void setCurrentOccupied(int currentOccupied) {
        this.currentOccupied = currentOccupied;
        updateStatus();
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public int getFullThresholdPercent() {
        return fullThresholdPercent;
    }

    public void setFullThresholdPercent(int fullThresholdPercent) {
        this.fullThresholdPercent = fullThresholdPercent;
        updateStatus();
    }

    public LocalDateTime getLastUpdate() {
        return lastUpdate;
    }

    public void setLastUpdate(LocalDateTime lastUpdate) {
        this.lastUpdate = lastUpdate;
    }
}
