package bd.ac.uiu.smartcampus.syllabus.collections;

import java.util.Comparator;

/**
 * AOOP Syllabus Requirement: Comparable & Comparator
 * Demonstrates natural ordering via Comparable and multiple custom orderings via Comparator.
 */
public class ClassroomModel implements Comparable<ClassroomModel> {

    private String roomNumber; // e.g. "Room 524"
    private int capacity;      // e.g. 60
    private int floor;         // e.g. 5
    private boolean occupied;
    private double powerKW;    // e.g. 3.4 KW

    public ClassroomModel() {
    }

    public ClassroomModel(String roomNumber, int capacity, int floor, boolean occupied, double powerKW) {
        this.roomNumber = roomNumber;
        this.capacity = capacity;
        this.floor = floor;
        this.occupied = occupied;
        this.powerKW = powerKW;
    }

    /**
     * Natural ordering: by room number alphabetically/numerically
     */
    @Override
    public int compareTo(ClassroomModel other) {
        return this.roomNumber.compareTo(other.roomNumber);
    }

    // --- Custom Comparators ---
    public static final Comparator<ClassroomModel> BY_CAPACITY_DESC = (c1, c2) -> Integer.compare(c2.capacity, c1.capacity);
    public static final Comparator<ClassroomModel> BY_POWER_DESC = (c1, c2) -> Double.compare(c2.powerKW, c1.powerKW);
    public static final Comparator<ClassroomModel> BY_FLOOR_ASC = (c1, c2) -> Integer.compare(c1.floor, c2.floor);

    // Getters and Setters
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
}
