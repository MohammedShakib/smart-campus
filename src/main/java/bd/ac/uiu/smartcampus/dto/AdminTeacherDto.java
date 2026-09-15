package bd.ac.uiu.smartcampus.dto;

import bd.ac.uiu.smartcampus.model.User;

import java.time.LocalDateTime;

public class AdminTeacherDto {
    private Long id;
    private String fullName;
    private String loginIdentifier;
    private String employeeId;
    private String department;
    private String designation;
    private String officeRoom;
    private boolean active;
    private LocalDateTime createdAt;
    private long classCount;
    private long studentCount;

    public AdminTeacherDto() {
    }

    public AdminTeacherDto(User teacher, String designation, String officeRoom, long classCount, long studentCount) {
        this.id = teacher.getId();
        this.fullName = teacher.getFullName();
        this.loginIdentifier = teacher.getEmail();
        this.employeeId = teacher.getStudentOrEmpId();
        this.department = teacher.getDepartment();
        this.designation = designation;
        this.officeRoom = officeRoom;
        this.active = teacher.isActive();
        this.createdAt = teacher.getCreatedAt();
        this.classCount = classCount;
        this.studentCount = studentCount;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getLoginIdentifier() {
        return loginIdentifier;
    }

    public void setLoginIdentifier(String loginIdentifier) {
        this.loginIdentifier = loginIdentifier;
    }

    public String getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getDesignation() {
        return designation;
    }

    public void setDesignation(String designation) {
        this.designation = designation;
    }

    public String getOfficeRoom() {
        return officeRoom;
    }

    public void setOfficeRoom(String officeRoom) {
        this.officeRoom = officeRoom;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public long getClassCount() {
        return classCount;
    }

    public void setClassCount(long classCount) {
        this.classCount = classCount;
    }

    public long getStudentCount() {
        return studentCount;
    }

    public void setStudentCount(long studentCount) {
        this.studentCount = studentCount;
    }
}
