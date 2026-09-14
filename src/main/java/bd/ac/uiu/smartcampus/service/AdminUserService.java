package bd.ac.uiu.smartcampus.service;

import bd.ac.uiu.smartcampus.dto.AdminUserCreateRequest;
import bd.ac.uiu.smartcampus.dto.AdminUserDto;
import bd.ac.uiu.smartcampus.dto.AdminUserUpdateRequest;
import bd.ac.uiu.smartcampus.model.AdminActionLog;
import bd.ac.uiu.smartcampus.model.Role;
import bd.ac.uiu.smartcampus.model.User;
import bd.ac.uiu.smartcampus.repository.AdminActionLogRepository;
import bd.ac.uiu.smartcampus.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class AdminUserService {

    private final UserRepository userRepository;
    private final AdminActionLogRepository actionLogRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminUserService(UserRepository userRepository,
                            AdminActionLogRepository actionLogRepository,
                            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.actionLogRepository = actionLogRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<AdminUserDto> searchUsers(String search, Role role, Boolean status) {
        if (search != null && search.trim().isEmpty()) {
            search = null;
        }
        return userRepository.searchUsers(search, role, status).stream()
                .map(AdminUserDto::new)
                .collect(Collectors.toList());
    }

    public AdminUserDto getUserById(Long id) {
        return userRepository.findById(id)
                .map(AdminUserDto::new)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
    }

    @Transactional
    public AdminUserDto createUser(AdminUserCreateRequest request, String currentAdminEmail) {
        String loginIdentifier = request.getEmail().trim();
        String studentOrEmpId = blankToNull(request.getStudentOrEmpId());

        if (userRepository.existsByEmailIgnoreCase(loginIdentifier)) {
            throw new IllegalArgumentException("Login identifier already exists: " + loginIdentifier);
        }
        if (studentOrEmpId != null) {
            if (userRepository.existsByStudentOrEmpId(studentOrEmpId)) {
                throw new IllegalArgumentException("Student or Employee ID already exists: " + studentOrEmpId);
            }
        }

        User user = new User(
                loginIdentifier,
                passwordEncoder.encode(request.getPassword()),
                request.getFullName().trim(),
                studentOrEmpId,
                blankToNull(request.getDepartment()),
                request.getRole()
        );
        user.setActive(true);

        User savedUser = userRepository.save(user);

        logAction(currentAdminEmail, "USER_CREATED", "Created new user: " + savedUser.getEmail() + " with role: " + savedUser.getRole());

        return new AdminUserDto(savedUser);
    }

    @Transactional
    public AdminUserDto updateUser(Long id, AdminUserUpdateRequest request, String currentAdminEmail) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));

        String requestedLoginIdentifier = request.getEmail().trim();
        String requestedStudentOrEmpId = blankToNull(request.getStudentOrEmpId());

        if (!Objects.equals(user.getEmail(), requestedLoginIdentifier)) {
            throw new IllegalArgumentException("Login identifier cannot be changed in Phase 1.");
        }

        if (!Objects.equals(user.getStudentOrEmpId(), requestedStudentOrEmpId)) {
            throw new IllegalArgumentException("Student or Employee ID cannot be changed in Phase 1.");
        }

        if (user.getRole() != request.getRole()) {
            throw new IllegalArgumentException("Role cannot be changed in Phase 1.");
        }

        user.setFullName(request.getFullName().trim());
        user.setDepartment(blankToNull(request.getDepartment()));

        User savedUser = userRepository.save(user);

        logAction(currentAdminEmail, "USER_UPDATED", "Updated safe profile fields for: " + savedUser.getEmail());

        return new AdminUserDto(savedUser);
    }

    @Transactional
    public void toggleUserStatus(Long id, boolean active, String currentAdminEmail) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));

        if (!active && user.getEmail().equalsIgnoreCase(currentAdminEmail)) {
            throw new IllegalArgumentException("You cannot disable your own account.");
        }
        if (!active && user.getRole() == Role.ROLE_ADMIN && userRepository.countByRoleAndActiveTrue(Role.ROLE_ADMIN) <= 1) {
            throw new IllegalArgumentException("At least one active admin account must remain.");
        }

        user.setActive(active);
        userRepository.save(user);

        String actionType = active ? "USER_ENABLED" : "USER_DISABLED";
        logAction(currentAdminEmail, actionType, "Changed active status to " + active + " for user: " + user.getEmail());
    }

    private void logAction(String adminEmail, String actionType, String details) {
        AdminActionLog log = new AdminActionLog(adminEmail, actionType, details);
        actionLogRepository.save(log);
    }

    private String blankToNull(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }
}
