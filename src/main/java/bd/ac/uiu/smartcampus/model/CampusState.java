package bd.ac.uiu.smartcampus.model;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * Demonstrates AOOP Syllabus Topic: Object Serialization (ObjectOutputStream / ObjectInputStream)
 * Represents an in-memory snapshot of the Smart Campus state for backup/restore.
 */
public class CampusState implements Serializable {
    private static final long serialVersionUID = 1L;

    private String campusName;
    private int activeStudentsCount;
    private int activeFacultyCount;
    private int totalClassrooms;
    private int occupiedClassrooms;
    private double currentEnergyConsumptionKW;
    private String campusStatusMode; // NORMAL, EXAM_MODE, CONVOCATION, EMERGENCY
    private LocalDateTime snapshotTimestamp;

    public CampusState() {
        this.snapshotTimestamp = LocalDateTime.now();
    }

    public CampusState(String campusName, int activeStudentsCount, int activeFacultyCount,
                       int totalClassrooms, int occupiedClassrooms, double currentEnergyConsumptionKW,
                       String campusStatusMode) {
        this.campusName = campusName;
        this.activeStudentsCount = activeStudentsCount;
        this.activeFacultyCount = activeFacultyCount;
        this.totalClassrooms = totalClassrooms;
        this.occupiedClassrooms = occupiedClassrooms;
        this.currentEnergyConsumptionKW = currentEnergyConsumptionKW;
        this.campusStatusMode = campusStatusMode;
        this.snapshotTimestamp = LocalDateTime.now();
    }

    // Getters and Setters
    public String getCampusName() {
        return campusName;
    }

    public void setCampusName(String campusName) {
        this.campusName = campusName;
    }

    public int getActiveStudentsCount() {
        return activeStudentsCount;
    }

    public void setActiveStudentsCount(int activeStudentsCount) {
        this.activeStudentsCount = activeStudentsCount;
    }

    public int getActiveFacultyCount() {
        return activeFacultyCount;
    }

    public void setActiveFacultyCount(int activeFacultyCount) {
        this.activeFacultyCount = activeFacultyCount;
    }

    public int getTotalClassrooms() {
        return totalClassrooms;
    }

    public void setTotalClassrooms(int totalClassrooms) {
        this.totalClassrooms = totalClassrooms;
    }

    public int getOccupiedClassrooms() {
        return occupiedClassrooms;
    }

    public void setOccupiedClassrooms(int occupiedClassrooms) {
        this.occupiedClassrooms = occupiedClassrooms;
    }

    public double getCurrentEnergyConsumptionKW() {
        return currentEnergyConsumptionKW;
    }

    public void setCurrentEnergyConsumptionKW(double currentEnergyConsumptionKW) {
        this.currentEnergyConsumptionKW = currentEnergyConsumptionKW;
    }

    public String getCampusStatusMode() {
        return campusStatusMode;
    }

    public void setCampusStatusMode(String campusStatusMode) {
        this.campusStatusMode = campusStatusMode;
    }

    public LocalDateTime getSnapshotTimestamp() {
        return snapshotTimestamp;
    }

    public void setSnapshotTimestamp(LocalDateTime snapshotTimestamp) {
        this.snapshotTimestamp = snapshotTimestamp;
    }

    @Override
    public String toString() {
        return "CampusState{" +
                "campusName='" + campusName + '\'' +
                ", activeStudentsCount=" + activeStudentsCount +
                ", occupiedClassrooms=" + occupiedClassrooms + "/" + totalClassrooms +
                ", energyKW=" + currentEnergyConsumptionKW +
                ", statusMode='" + campusStatusMode + '\'' +
                ", timestamp=" + snapshotTimestamp +
                '}';
    }
}
