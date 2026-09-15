package bd.ac.uiu.smartcampus.dto;

import bd.ac.uiu.smartcampus.model.Course;

public class CourseDto {
    private Long id;
    private String courseCode;
    private String courseName;
    private int creditHours;
    private boolean active = true;
    private String departmentCode;
    private String departmentName;
    private Long departmentId;

    public CourseDto() {}

    public CourseDto(Course entity) {
        this.id = entity.getId();
        this.courseCode = entity.getCourseCode();
        this.courseName = entity.getCourseName();
        this.creditHours = entity.getCreditHours();
        this.active = entity.isActive();
        if (entity.getDepartment() != null) {
            this.departmentId = entity.getDepartment().getId();
            this.departmentCode = entity.getDepartment().getCode();
            this.departmentName = entity.getDepartment().getName();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCourseCode() { return courseCode; }
    public void setCourseCode(String courseCode) { this.courseCode = courseCode; }

    public String getCourseName() { return courseName; }
    public void setCourseName(String courseName) { this.courseName = courseName; }

    public int getCreditHours() { return creditHours; }
    public void setCreditHours(int creditHours) { this.creditHours = creditHours; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public String getDepartmentCode() { return departmentCode; }
    public void setDepartmentCode(String departmentCode) { this.departmentCode = departmentCode; }

    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }

    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
}
