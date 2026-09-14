package bd.ac.uiu.smartcampus.dto;

import bd.ac.uiu.smartcampus.model.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class AdminUserUpdateRequest {

    @NotBlank(message = "Login identifier is required")
    private String email;

    @NotBlank(message = "Full name is required")
    private String fullName;

    private String studentOrEmpId;

    private String department;

    @NotNull(message = "Role is required")
    private Role role;

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
}
