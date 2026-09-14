package bd.ac.uiu.smartcampus.dto;

import bd.ac.uiu.smartcampus.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class AdminUserCreateRequest {
    
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;
    
    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters long")
    private String password;
    
    @NotBlank(message = "Full name is required")
    private String fullName;
    
    private String studentOrEmpId;
    
    private String department;
    
    @NotNull(message = "Role is required")
    private Role role;
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    
    public String getStudentOrEmpId() { return studentOrEmpId; }
    public void setStudentOrEmpId(String studentOrEmpId) { this.studentOrEmpId = studentOrEmpId; }
    
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
}
