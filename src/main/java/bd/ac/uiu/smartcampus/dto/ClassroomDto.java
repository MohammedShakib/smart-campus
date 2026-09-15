package bd.ac.uiu.smartcampus.dto;

import bd.ac.uiu.smartcampus.model.Classroom;

public class ClassroomDto {
    private Long id;
    private String roomNumber;
    private int capacity;
    private int floor;
    private boolean occupied;
    private double powerKW;
    private String roomType;
    private String building; // Legacy string
    private Long buildingId;
    private String buildingCode;
    private String buildingName;
    private boolean active = true;

    public ClassroomDto() {}

    public ClassroomDto(Classroom entity) {
        this.id = entity.getId();
        this.roomNumber = entity.getRoomNumber();
        this.capacity = entity.getCapacity();
        this.floor = entity.getFloor();
        this.occupied = entity.isOccupied();
        this.active = entity.isActive();
        this.powerKW = entity.getPowerKW();
        this.roomType = entity.getRoomType();
        this.building = entity.getBuilding();
        
        if (entity.getBuildingRef() != null) {
            this.buildingId = entity.getBuildingRef().getId();
            this.buildingCode = entity.getBuildingRef().getCode();
            this.buildingName = entity.getBuildingRef().getName();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }

    public int getCapacity() { return capacity; }
    public void setCapacity(int capacity) { this.capacity = capacity; }

    public int getFloor() { return floor; }
    public void setFloor(int floor) { this.floor = floor; }

    public boolean isOccupied() { return occupied; }
    public void setOccupied(boolean occupied) { this.occupied = occupied; }

    public double getPowerKW() { return powerKW; }
    public void setPowerKW(double powerKW) { this.powerKW = powerKW; }

    public String getRoomType() { return roomType; }
    public void setRoomType(String roomType) { this.roomType = roomType; }

    public String getBuilding() { return building; }
    public void setBuilding(String building) { this.building = building; }

    public Long getBuildingId() { return buildingId; }
    public void setBuildingId(Long buildingId) { this.buildingId = buildingId; }

    public String getBuildingCode() { return buildingCode; }
    public void setBuildingCode(String buildingCode) { this.buildingCode = buildingCode; }

    public String getBuildingName() { return buildingName; }
    public void setBuildingName(String buildingName) { this.buildingName = buildingName; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
