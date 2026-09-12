package bd.ac.uiu.smartcampus.config;

import bd.ac.uiu.smartcampus.model.*;
import bd.ac.uiu.smartcampus.repository.AdminActionLogRepository;
import bd.ac.uiu.smartcampus.repository.CampusNoticeRepository;
import bd.ac.uiu.smartcampus.repository.MaintenanceComplaintRepository;
import bd.ac.uiu.smartcampus.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final CampusNoticeRepository noticeRepository;
    private final MaintenanceComplaintRepository complaintRepository;
    private final AdminActionLogRepository actionLogRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           CampusNoticeRepository noticeRepository,
                           MaintenanceComplaintRepository complaintRepository,
                           AdminActionLogRepository actionLogRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.noticeRepository = noticeRepository;
        this.complaintRepository = complaintRepository;
        this.actionLogRepository = actionLogRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        logger.info("Initializing UIU Smart Campus Digital Twin seed data...");

        // 1. Seed Users (if not exists)
        seedUser("admin@uiu.ac.bd", "admin123", "Dr. Mahmudul Hasan (Admin)", "EMP-ADMIN-01", "Administration", Role.ROLE_ADMIN);
        seedUser("teacher@uiu.ac.bd", "teacher123", "Prof. Tariqul Islam", "EMP-CSE-104", "Computer Science & Engineering", Role.ROLE_TEACHER);
        seedUser("student@uiu.ac.bd", "student123", "Rahat Hossain", "011211001", "Computer Science & Engineering", Role.ROLE_STUDENT);
        seedUser("security@uiu.ac.bd", "security123", "Officer Abul Kalam", "SEC-GATE-02", "Campus Security & Safety", Role.ROLE_SECURITY);

        // 2. Seed Initial Campus Notices (if empty)
        if (noticeRepository.count() == 0) {
            noticeRepository.save(new CampusNotice(
                    "Smart Campus Digital Twin System Live",
                    "Welcome to the UIU Real-Time Smart Campus Digital Twin. All classroom occupancy, shuttle routes, and gate controls are now operating in real-time simulation.",
                    "GENERAL",
                    "HIGH",
                    "System Administrator"
            ));

            noticeRepository.save(new CampusNotice(
                    "AOOP Project Milestone Update 1 Scheduled",
                    "Update 1 presentation will be held on September 5. Ensure your environment, Spring Boot architecture, and login flows are verified.",
                    "ACADEMIC",
                    "HIGH",
                    "Department of CSE"
            ));

            noticeRepository.save(new CampusNotice(
                    "UIU Shuttle Bus Real-Time Tracking Online",
                    "Campus shuttle route 1 (Natun Bazar to UIU) and route 2 (Kuril to UIU) socket telemetry feeds are actively transmitting.",
                    "TRANSPORT",
                    "MEDIUM",
                    "Transport Division"
            ));
        }

        // 3. Seed Initial Maintenance Complaints (for AOOP Queue Demo)
        if (complaintRepository.count() == 0) {
            complaintRepository.save(new MaintenanceComplaint(
                    "Rahat Hossain",
                    "011211001",
                    "Room 524 - Multimedia Lab",
                    "Projector HDMI Port Signal Intermittent",
                    "The main projector loses video signal every few minutes during lecture presentations.",
                    "HIGH"
            ));

            complaintRepository.save(new MaintenanceComplaint(
                    "Tanvir Ahmed",
                    "011211045",
                    "Library 3rd Floor - Study Cubicle 12",
                    "WiFi Hotspot Packet Drop",
                    "Students experiencing slow ping and intermittent disconnects on UIU-Student-5G.",
                    "MEDIUM"
            ));

            complaintRepository.save(new MaintenanceComplaint(
                    "Sadia Rahman",
                    "011211088",
                    "Cafeteria Ground Floor",
                    "Water Dispenser Cooling Coil Inactive",
                    "Ground floor drinking water dispenser is dispensing room temperature water.",
                    "LOW"
            ));
        }

        // 4. Seed Admin Action History (for AOOP Stack Demo)
        if (actionLogRepository.count() == 0) {
            actionLogRepository.save(new AdminActionLog("admin@uiu.ac.bd", "SYSTEM_INIT", "Initial digital twin environment booted with XAMPP MySQL and Spring Security."));
            actionLogRepository.save(new AdminActionLog("admin@uiu.ac.bd", "SECURITY_POLICY", "Enforced BCrypt 10-round salt password hashing for all user accounts."));
            actionLogRepository.save(new AdminActionLog("admin@uiu.ac.bd", "ROOM_CALIBRATION", "Calibrated 48 smart classrooms and 12 laboratory digital twins."));
        }

        logger.info("Seed data initialization completed successfully!");
    }

    private void seedUser(String email, String rawPassword, String fullName, String studentOrEmpId, String department, Role role) {
        if (!userRepository.existsByEmail(email)) {
            User user = new User(
                    email,
                    passwordEncoder.encode(rawPassword),
                    fullName,
                    studentOrEmpId,
                    department,
                    role
            );
            user.setCreatedAt(LocalDateTime.now().minusDays(2));
            userRepository.save(user);
            logger.info("Created default user: {} [{}]", email, role);
        }
    }
}
