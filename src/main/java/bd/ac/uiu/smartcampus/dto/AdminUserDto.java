package bd.ac.uiu.smartcampus.dto;

import bd.ac.uiu.smartcampus.model.Role;
import bd.ac.uiu.smartcampus.model.User;

import java.time.LocalDateTime;

public class AdminUserDto {
    private Long id;
    private String email;
    private String fullName;
    private String studentOrEmpId;
    private String department;
    private Role role;
    private boolean active;
    private LocalDateTime createdAt;
    
    public AdminUserDto() {}
    
    public AdminUserDto(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.fullName = user.getFullName();
        this.studentOrEmpId = user.getStudentOrEmpId();
        this.department = user.getDepartment();
        this.role = user.getRole();
        this.active = user.isActive();
        this.createdAt = user.getCreatedAt();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    
    public String getStudentOrEmpId() { return studentOrEmpId; }
    public void setStudentOrEmpId(String studentOrEmpId) { this.studentOrEmpId = studentOrEmpId; }
    
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
