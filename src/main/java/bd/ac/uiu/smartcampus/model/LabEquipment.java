package bd.ac.uiu.smartcampus.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "lab_equipment")
public class LabEquipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private EquipmentCategory category = EquipmentCategory.DEV_BOARD;

    @Column(name = "lab_location", nullable = false, length = 100)
    private String labLocation; // e.g. "Lab 524 - IoT & Embedded Systems", "Lab 412 - Hardware Lab"

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "home_classroom_id")
    @JsonIgnore
    private Classroom homeClassroom;

    @Column(name = "total_quantity", nullable = false)
    private int totalQuantity = 1;

    @Column(name = "available_quantity", nullable = false)
    private int availableQuantity = 1;

    @Column(columnDefinition = "TEXT")
    private String specifications;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(nullable = false)
    private boolean active = true;

    public enum EquipmentCategory {
        DEV_BOARD,             // Arduino, Raspberry Pi, STM32, ESP32
        SENSOR_ACTUATOR,       // Ultrasonic, IMU, LiDAR, Motors
        MEASURING_INSTRUMENT,  // Multimeter, DSO, Function Generator
        ROBOTICS_KIT,          // Rover chassis, Robotic Arm
        ACCESSORY              // Breadboards, Logic Analyzer, Power Supply
    }

    public LabEquipment() {
    }

    public LabEquipment(String name, EquipmentCategory category, String labLocation,
                        int totalQuantity, int availableQuantity, String specifications, String imageUrl) {
        this.name = name;
        this.category = category;
        this.labLocation = labLocation;
        this.totalQuantity = totalQuantity;
        this.availableQuantity = availableQuantity;
        this.specifications = specifications;
        this.imageUrl = imageUrl;
        this.active = true;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public EquipmentCategory getCategory() {
        return category;
    }

    public void setCategory(EquipmentCategory category) {
        this.category = category;
    }

    public String getLabLocation() {
        return labLocation;
    }

    public void setLabLocation(String labLocation) {
        this.labLocation = labLocation;
    }

    public int getTotalQuantity() {
        return totalQuantity;
    }

    public void setTotalQuantity(int totalQuantity) {
        this.totalQuantity = totalQuantity;
    }

    public int getAvailableQuantity() {
        return availableQuantity;
    }

    public void setAvailableQuantity(int availableQuantity) {
        this.availableQuantity = availableQuantity;
    }

    public String getSpecifications() {
        return specifications;
    }

    public void setSpecifications(String specifications) {
        this.specifications = specifications;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Classroom getHomeClassroom() {
        return homeClassroom;
    }

    public void setHomeClassroom(Classroom homeClassroom) {
        this.homeClassroom = homeClassroom;
    }
}
