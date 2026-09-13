package bd.ac.uiu.smartcampus.config;

import bd.ac.uiu.smartcampus.model.*;
import bd.ac.uiu.smartcampus.repository.AdminActionLogRepository;
import bd.ac.uiu.smartcampus.repository.CampusNoticeRepository;
import bd.ac.uiu.smartcampus.repository.MaintenanceComplaintRepository;
import bd.ac.uiu.smartcampus.repository.TeachingScheduleRepository;
import bd.ac.uiu.smartcampus.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final CampusNoticeRepository noticeRepository;
    private final MaintenanceComplaintRepository complaintRepository;
    private final AdminActionLogRepository actionLogRepository;
    private final TeachingScheduleRepository teachingScheduleRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           CampusNoticeRepository noticeRepository,
                           MaintenanceComplaintRepository complaintRepository,
                           AdminActionLogRepository actionLogRepository,
                           TeachingScheduleRepository teachingScheduleRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.noticeRepository = noticeRepository;
        this.complaintRepository = complaintRepository;
        this.actionLogRepository = actionLogRepository;
        this.teachingScheduleRepository = teachingScheduleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        logger.info("Initializing UIU Smart Campus seed data...");

        // 1. Seed Users (if not exists)
        seedUser("admin-demo", "demo-admin-pass", "Dr. Mahmudul Hasan (Admin)", "EMP-ADMIN-01", "Administration", Role.ROLE_ADMIN);
        seedUser("teacher-demo", "demo-teacher-pass", "Prof. Tariqul Islam", "EMP-CSE-104", "Computer Science & Engineering", Role.ROLE_TEACHER);
        seedUser("student-demo", "demo-student-pass", "Rahat Hossain", "011211001", "Computer Science & Engineering", Role.ROLE_STUDENT);
        seedUser("security-demo", "demo-security-pass", "Officer Abul Kalam", "SEC-GATE-02", "Campus Security & Safety", Role.ROLE_SECURITY);
        seedTeacherSchedule("teacher-demo", "CSE 2211", "Advanced Object Oriented Programming", "Section A", "Room 524", "Sunday", "10:30", "12:00");
        seedTeacherSchedule("teacher-demo", "CSE 2211", "Advanced Object Oriented Programming", "Section A", "Room 524", "Tuesday", "10:30", "12:00");
        seedTeacherSchedule("teacher-demo", "CSE 3312", "Database Systems", "Section B", "Room 412", "Monday", "14:00", "15:30");
        seedTeacherSchedule("teacher-demo", "CSE 3312", "Database Systems", "Section B", "Room 412", "Wednesday", "14:00", "15:30");

        // 2. Seed Initial Campus Notices (if empty)
        if (noticeRepository.count() == 0) {
            noticeRepository.save(new CampusNotice(
                    "Smart Campus System Live",
                    "Welcome to UIU Smart Campus. Classroom occupancy, shuttle routes, and gate controls are now operating in real-time simulation.",
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
            actionLogRepository.save(new AdminActionLog("admin-demo", "SYSTEM_INIT", "Initial Smart Campus environment booted with XAMPP MySQL and Spring Security."));
            actionLogRepository.save(new AdminActionLog("admin-demo", "SECURITY_POLICY", "Enforced BCrypt 10-round salt password hashing for all user accounts."));
            actionLogRepository.save(new AdminActionLog("admin-demo", "ROOM_CALIBRATION", "Calibrated 48 smart classrooms and 12 laboratory telemetry profiles."));
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

    private void seedTeacherSchedule(String teacherEmail, String courseCode, String courseTitle, String sectionName,
                                     String roomNumber, String dayOfWeek, String startTime, String endTime) {
        if (!teachingScheduleRepository.existsByTeacherEmailAndCourseCodeAndSectionNameAndDayOfWeek(teacherEmail, courseCode, sectionName, dayOfWeek)) {
            TeachingSchedule schedule = new TeachingSchedule(
                    teacherEmail,
                    courseCode,
                    courseTitle,
                    sectionName,
                    roomNumber,
                    dayOfWeek,
                    LocalTime.parse(startTime),
                    LocalTime.parse(endTime)
            );
            teachingScheduleRepository.save(schedule);
            logger.info("Created teacher schedule: {} {} {}", teacherEmail, courseCode, dayOfWeek);
        }
    }
}
