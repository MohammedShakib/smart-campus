package bd.ac.uiu.smartcampus.dto;

import bd.ac.uiu.smartcampus.model.Department;

public class DepartmentDto {
    private Long id;
    private String code;
    private String name;
    private boolean active = true;

    public DepartmentDto() {}

    public DepartmentDto(Department entity) {
        this.id = entity.getId();
        this.code = entity.getCode();
        this.name = entity.getName();
        this.active = entity.isActive();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
