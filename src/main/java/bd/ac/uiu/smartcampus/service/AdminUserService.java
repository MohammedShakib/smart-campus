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
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists: " + request.getEmail());
        }
        if (request.getStudentOrEmpId() != null && !request.getStudentOrEmpId().isEmpty()) {
            if (userRepository.existsByStudentOrEmpId(request.getStudentOrEmpId())) {
                throw new IllegalArgumentException("Student or Employee ID already exists: " + request.getStudentOrEmpId());
            }
        }

        User user = new User(
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                request.getFullName(),
                request.getStudentOrEmpId(),
                request.getDepartment(),
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

        if (!user.getEmail().equalsIgnoreCase(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists: " + request.getEmail());
        }
        
        if (request.getStudentOrEmpId() != null && !request.getStudentOrEmpId().isEmpty()) {
            if (!request.getStudentOrEmpId().equals(user.getStudentOrEmpId()) && userRepository.existsByStudentOrEmpId(request.getStudentOrEmpId())) {
                throw new IllegalArgumentException("Student or Employee ID already exists: " + request.getStudentOrEmpId());
            }
        }

        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setStudentOrEmpId(request.getStudentOrEmpId());
        user.setDepartment(request.getDepartment());
        user.setRole(request.getRole());

        User savedUser = userRepository.save(user);

        logAction(currentAdminEmail, "USER_UPDATED", "Updated user details for: " + savedUser.getEmail());

        return new AdminUserDto(savedUser);
    }

    @Transactional
    public void toggleUserStatus(Long id, boolean active, String currentAdminEmail) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));

        if (!active && user.getEmail().equalsIgnoreCase(currentAdminEmail)) {
            throw new IllegalArgumentException("You cannot disable your own account.");
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
}
