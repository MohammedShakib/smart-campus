package bd.ac.uiu.smartcampus.dto;

import java.time.LocalDateTime;

public class CampusTelemetryDto {
    private int activeStudents;
    private int facultyOnCampus;
    private int occupiedRooms;
    private int totalRooms;
    private double powerConsumptionKW;
    private double campusTemperatureC;
    private String airQualityIndex;
    private int activeBuses;
    private int pendingComplaints;
    private int visitorsToday;
    private String systemStatus;
    private LocalDateTime timestamp;

    public CampusTelemetryDto() {
        this.timestamp = LocalDateTime.now();
    }

    public int getActiveStudents() {
        return activeStudents;
    }

    public void setActiveStudents(int activeStudents) {
        this.activeStudents = activeStudents;
    }

    public int getFacultyOnCampus() {
        return facultyOnCampus;
    }

    public void setFacultyOnCampus(int facultyOnCampus) {
        this.facultyOnCampus = facultyOnCampus;
    }

    public int getOccupiedRooms() {
        return occupiedRooms;
    }

    public void setOccupiedRooms(int occupiedRooms) {
        this.occupiedRooms = occupiedRooms;
    }

    public int getTotalRooms() {
        return totalRooms;
    }

    public void setTotalRooms(int totalRooms) {
        this.totalRooms = totalRooms;
    }

    public double getPowerConsumptionKW() {
        return powerConsumptionKW;
    }

    public void setPowerConsumptionKW(double powerConsumptionKW) {
        this.powerConsumptionKW = powerConsumptionKW;
    }

    public double getCampusTemperatureC() {
        return campusTemperatureC;
    }

    public void setCampusTemperatureC(double campusTemperatureC) {
        this.campusTemperatureC = campusTemperatureC;
    }

    public String getAirQualityIndex() {
        return airQualityIndex;
    }

    public void setAirQualityIndex(String airQualityIndex) {
        this.airQualityIndex = airQualityIndex;
    }

    public int getActiveBuses() {
        return activeBuses;
    }

    public void setActiveBuses(int activeBuses) {
        this.activeBuses = activeBuses;
    }

    public int getPendingComplaints() {
        return pendingComplaints;
    }

    public void setPendingComplaints(int pendingComplaints) {
        this.pendingComplaints = pendingComplaints;
    }

    public int getVisitorsToday() {
        return visitorsToday;
    }

    public void setVisitorsToday(int visitorsToday) {
        this.visitorsToday = visitorsToday;
    }

    public String getSystemStatus() {
        return systemStatus;
    }

    public void setSystemStatus(String systemStatus) {
        this.systemStatus = systemStatus;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
