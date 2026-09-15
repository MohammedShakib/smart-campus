package bd.ac.uiu.smartcampus.service;

import bd.ac.uiu.smartcampus.dto.AdminUserCreateRequest;
import bd.ac.uiu.smartcampus.dto.AdminUserDto;
import bd.ac.uiu.smartcampus.dto.AdminUserUpdateRequest;
import bd.ac.uiu.smartcampus.model.AdminActionLog;
import bd.ac.uiu.smartcampus.model.Role;
import bd.ac.uiu.smartcampus.model.User;
import bd.ac.uiu.smartcampus.repository.AdminActionLogRepository;
import bd.ac.uiu.smartcampus.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class AdminUserService {

    private final UserRepository userRepository;
    private final AdminActionLogRepository actionLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final RoleTransitionValidator roleTransitionValidator;

    public AdminUserService(UserRepository userRepository,
                            AdminActionLogRepository actionLogRepository,
                            PasswordEncoder passwordEncoder,
                            RoleTransitionValidator roleTransitionValidator) {
        this.userRepository = userRepository;
        this.actionLogRepository = actionLogRepository;
        this.passwordEncoder = passwordEncoder;
        this.roleTransitionValidator = roleTransitionValidator;
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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with id: " + id));
    }

    @Transactional
    public AdminUserDto createUser(AdminUserCreateRequest request, String currentAdminEmail) {
        String loginIdentifier = request.getEmail().trim();
        String studentOrEmpId = blankToNull(request.getStudentOrEmpId());

        if (userRepository.existsByEmailIgnoreCase(loginIdentifier)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Login identifier already exists: " + loginIdentifier);
        }
        if (studentOrEmpId != null) {
            if (userRepository.existsByStudentOrEmpId(studentOrEmpId)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Student or Employee ID already exists: " + studentOrEmpId);
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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with id: " + id));

        String requestedLoginIdentifier = request.getEmail().trim();
        String requestedStudentOrEmpId = blankToNull(request.getStudentOrEmpId());

        if (!Objects.equals(user.getEmail(), requestedLoginIdentifier)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Login identifier cannot be changed for existing accounts.");
        }

        if (!Objects.equals(user.getStudentOrEmpId(), requestedStudentOrEmpId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Student or Employee ID cannot be changed for existing accounts to preserve historical records.");
        }

        if (user.getRole() != request.getRole()) {
            if (user.getEmail().equalsIgnoreCase(currentAdminEmail)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot demote your own admin account.");
            }
            if (user.isActive() && user.getRole() == Role.ROLE_ADMIN && userRepository.countByRoleAndActiveTrue(Role.ROLE_ADMIN) <= 1) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "At least one active admin account must remain. Cannot demote the last admin.");
            }
            
            roleTransitionValidator.validateRoleChange(user, request.getRole());
            
            String oldRole = user.getRole().name();
            user.setRole(request.getRole());
            logAction(currentAdminEmail, "USER_ROLE_CHANGED", "Changed role from " + oldRole + " to " + request.getRole() + " for: " + user.getEmail());
        }

        String requestedFullName = request.getFullName().trim();
        String requestedDepartment = blankToNull(request.getDepartment());
        boolean profileChanged = !Objects.equals(user.getFullName(), requestedFullName)
                || !Objects.equals(user.getDepartment(), requestedDepartment);

        user.setFullName(requestedFullName);
        user.setDepartment(requestedDepartment);

        User savedUser = userRepository.save(user);

        if (profileChanged) {
            logAction(currentAdminEmail, "USER_UPDATED", "Updated safe profile fields for: " + savedUser.getEmail());
        }

        return new AdminUserDto(savedUser);
    }

    @Transactional
    public void toggleUserStatus(Long id, boolean active, String currentAdminEmail) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with id: " + id));

        if (!active && user.getEmail().equalsIgnoreCase(currentAdminEmail)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot disable your own account.");
        }
        if (!active && user.isActive() && user.getRole() == Role.ROLE_ADMIN && userRepository.countByRoleAndActiveTrue(Role.ROLE_ADMIN) <= 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "At least one active admin account must remain.");
        }

        if (user.isActive() == active) {
            return;
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
