package bd.ac.uiu.smartcampus.dto;

import bd.ac.uiu.smartcampus.model.User;
import java.time.LocalDateTime;

public class AdminStudentDto {
    private Long id;
    private String fullName;
    private String loginIdentifier;
    private String studentId;
    private String department;
    private Integer semester;
    private boolean active;
    private LocalDateTime createdAt;
    private long enrolledCourseCount;
    private Double attendancePercentage;

    public AdminStudentDto() {
    }

    public AdminStudentDto(User user, Integer semester, long enrolledCourseCount, Double attendancePercentage) {
        this.id = user.getId();
        this.fullName = user.getFullName();
        this.loginIdentifier = user.getEmail();
        this.studentId = user.getStudentOrEmpId();
        this.department = user.getDepartment();
        this.semester = semester;
        this.active = user.isActive();
        this.createdAt = user.getCreatedAt();
        this.enrolledCourseCount = enrolledCourseCount;
        this.attendancePercentage = attendancePercentage;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getLoginIdentifier() { return loginIdentifier; }
    public void setLoginIdentifier(String loginIdentifier) { this.loginIdentifier = loginIdentifier; }
    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public Integer getSemester() { return semester; }
    public void setSemester(Integer semester) { this.semester = semester; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public long getEnrolledCourseCount() { return enrolledCourseCount; }
    public void setEnrolledCourseCount(long enrolledCourseCount) { this.enrolledCourseCount = enrolledCourseCount; }
    public Double getAttendancePercentage() { return attendancePercentage; }
    public void setAttendancePercentage(Double attendancePercentage) { this.attendancePercentage = attendancePercentage; }
}
