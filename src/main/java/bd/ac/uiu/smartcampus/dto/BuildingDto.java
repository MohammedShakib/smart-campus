package bd.ac.uiu.smartcampus.dto;

import bd.ac.uiu.smartcampus.model.Building;

public class BuildingDto {
    private Long id;
    private String code;
    private String name;
    private int numberOfFloors;
    private boolean active;
    private String description;

    public BuildingDto() {}

    public BuildingDto(Building entity) {
        this.id = entity.getId();
        this.code = entity.getCode();
        this.name = entity.getName();
        this.numberOfFloors = entity.getNumberOfFloors();
        this.active = entity.isActive();
        this.description = entity.getDescription();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public int getNumberOfFloors() { return numberOfFloors; }
    public void setNumberOfFloors(int numberOfFloors) { this.numberOfFloors = numberOfFloors; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
