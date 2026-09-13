package bd.ac.uiu.smartcampus.model;

import jakarta.persistence.*;

@Entity
@Table(name = "classrooms")
public class Classroom implements Comparable<Classroom> {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 80)
    private String roomNumber;

    @Column(nullable = false)
    private int capacity;

    @Column(nullable = false)
    private int floor;

    @Column(nullable = false)
    private boolean occupied;

    @Column(nullable = false)
    private double powerKW;

    @Column(length = 80)
    private String building;

    @Column(length = 80)
    private String roomType;

    public Classroom() {
    }

    public Classroom(String roomNumber, int capacity, int floor, boolean occupied, double powerKW, String building, String roomType) {
        this.roomNumber = roomNumber;
        this.capacity = capacity;
        this.floor = floor;
        this.occupied = occupied;
        this.powerKW = powerKW;
        this.building = building;
        this.roomType = roomType;
    }

    @Override
    public int compareTo(Classroom other) {
        int floorCompare = Integer.compare(this.floor, other.floor);
        return floorCompare != 0 ? floorCompare : this.roomNumber.compareToIgnoreCase(other.roomNumber);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
    }

    public int getCapacity() {
        return capacity;
    }

    public void setCapacity(int capacity) {
        this.capacity = capacity;
    }

    public int getFloor() {
        return floor;
    }

    public void setFloor(int floor) {
        this.floor = floor;
    }

    public boolean isOccupied() {
        return occupied;
    }

    public void setOccupied(boolean occupied) {
        this.occupied = occupied;
    }

    public double getPowerKW() {
        return powerKW;
    }

    public void setPowerKW(double powerKW) {
        this.powerKW = powerKW;
    }

    public String getBuilding() {
        return building;
    }

    public void setBuilding(String building) {
        this.building = building;
    }

    public String getRoomType() {
        return roomType;
    }

    public void setRoomType(String roomType) {
        this.roomType = roomType;
    }
}
