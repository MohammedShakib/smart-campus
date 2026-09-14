package bd.ac.uiu.smartcampus.dto;

public class ParkingZoneUpdateDto {
    private Integer currentOccupied;
    private Integer totalCapacity;
    private String status; // "AVAILABLE", "ALMOST_FULL", "FULL", "MAINTENANCE", "CLOSED"

    public ParkingZoneUpdateDto() {
    }

    public Integer getCurrentOccupied() {
        return currentOccupied;
    }

    public void setCurrentOccupied(Integer currentOccupied) {
        this.currentOccupied = currentOccupied;
    }

    public Integer getTotalCapacity() {
        return totalCapacity;
    }

    public void setTotalCapacity(Integer totalCapacity) {
        this.totalCapacity = totalCapacity;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
