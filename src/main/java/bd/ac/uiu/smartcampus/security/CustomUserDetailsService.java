package bd.ac.uiu.smartcampus.security;

import bd.ac.uiu.smartcampus.model.User;
import bd.ac.uiu.smartcampus.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String emailOrId) throws UsernameNotFoundException {
        // Try finding by Email first, then by Student/Employee ID
        User user = userRepository.findByEmail(emailOrId)
                .or(() -> userRepository.findByStudentOrEmpId(emailOrId))
                .orElseThrow(() -> new UsernameNotFoundException("User not found with identifier: " + emailOrId));

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        return new CustomUserDetails(user);
    }
}
