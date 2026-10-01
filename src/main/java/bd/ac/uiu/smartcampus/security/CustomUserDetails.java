package bd.ac.uiu.smartcampus.security;

import bd.ac.uiu.smartcampus.model.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.io.Serializable;
import java.util.Collection;
import java.util.Collections;

public class CustomUserDetails implements UserDetails, Serializable {

    private static final long serialVersionUID = 1L;

    private final Long id;
    private final String email;
    private final String password;
    private final String fullName;
    private final String studentOrEmpId;
    private final String department;
    private final String roleName;
    private final boolean active;
    private final String profileImageUrl;

    public CustomUserDetails(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.password = user.getPassword();
        this.fullName = user.getFullName();
        this.studentOrEmpId = user.getStudentOrEmpId();
        this.department = user.getDepartment();
        this.roleName = user.getRole().name();
        this.active = user.isActive();
        this.profileImageUrl = user.getProfileImageUrl();
    }

    public User getUser() {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setPassword(password);
        user.setFullName(fullName);
        user.setStudentOrEmpId(studentOrEmpId);
        user.setDepartment(department);
        user.setRole(bd.ac.uiu.smartcampus.model.Role.valueOf(roleName));
        user.setActive(active);
        user.setProfileImageUrl(profileImageUrl);
        return user;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new SimpleGrantedAuthority(roleName));
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    public String getFullName() {
        return fullName;
    }

    public String getStudentOrEmpId() {
        return studentOrEmpId;
    }

    public String getDepartment() {
        return department;
    }

    public String getRoleName() {
        return roleName;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return active;
    }
}
