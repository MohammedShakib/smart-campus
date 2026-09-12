package bd.ac.uiu.smartcampus.service;

import bd.ac.uiu.smartcampus.dto.RegisterRequest;
import bd.ac.uiu.smartcampus.model.Role;
import bd.ac.uiu.smartcampus.model.User;
import bd.ac.uiu.smartcampus.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public User registerUser(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered: " + request.getEmail());
        }

        if (userRepository.existsByStudentOrEmpId(request.getStudentOrEmpId())) {
            throw new IllegalArgumentException("Student/Employee ID is already registered: " + request.getStudentOrEmpId());
        }

        Role role = request.getRole() != null ? request.getRole() : Role.ROLE_STUDENT;

        User user = new User(
                request.getEmail().trim().toLowerCase(),
                passwordEncoder.encode(request.getPassword()),
                request.getFullName().trim(),
                request.getStudentOrEmpId().trim(),
                request.getDepartment().trim(),
                role
        );

        return userRepository.save(user);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public long getTotalUsersCount() {
        return userRepository.count();
    }
}
