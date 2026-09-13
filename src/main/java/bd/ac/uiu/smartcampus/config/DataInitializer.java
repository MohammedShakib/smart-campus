package bd.ac.uiu.smartcampus.config;

import bd.ac.uiu.smartcampus.model.*;
import bd.ac.uiu.smartcampus.repository.*;
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
    private final ClassroomRepository classroomRepository;
    private final ClassEnrollmentRepository enrollmentRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           CampusNoticeRepository noticeRepository,
                           MaintenanceComplaintRepository complaintRepository,
                           AdminActionLogRepository actionLogRepository,
                           TeachingScheduleRepository teachingScheduleRepository,
                           ClassroomRepository classroomRepository,
                           ClassEnrollmentRepository enrollmentRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.noticeRepository = noticeRepository;
        this.complaintRepository = complaintRepository;
        this.actionLogRepository = actionLogRepository;
        this.teachingScheduleRepository = teachingScheduleRepository;
        this.classroomRepository = classroomRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        logger.info("Initializing UIU Smart Campus seed data...");

        // 1. Seed core users
        seedUser("admin-demo", "demo-admin-pass", "Dr. Mahmudul Hasan (Admin)", "EMP-ADMIN-01", "Administration", Role.ROLE_ADMIN);
        seedUser("teacher-demo", "demo-teacher-pass", "Prof. Tariqul Islam", "EMP-CSE-104", "Computer Science & Engineering", Role.ROLE_TEACHER);
        seedUser("student-demo", "demo-student-pass", "Rahat Hossain", "011211001", "Computer Science & Engineering", Role.ROLE_STUDENT);
        seedUser("security-demo", "demo-security-pass", "Officer Abul Kalam", "SEC-GATE-02", "Campus Security & Safety", Role.ROLE_SECURITY);

        // 2. Seed additional demo students for roster demonstration
        seedUser("student-tanvir", "demo-student-pass", "Tanvir Ahmed", "011221002", "Computer Science & Engineering", Role.ROLE_STUDENT);
        seedUser("student-sadia", "demo-student-pass", "Sadia Rahman", "011221003", "Computer Science & Engineering", Role.ROLE_STUDENT);
        seedUser("student-mehedi", "demo-student-pass", "Mehedi Hasan", "011221004", "Computer Science & Engineering", Role.ROLE_STUDENT);
        seedUser("student-nusrat", "demo-student-pass", "Nusrat Jahan", "011221005", "Computer Science & Engineering", Role.ROLE_STUDENT);
        seedUser("student-rafi", "demo-student-pass", "Rafi Islam", "011221006", "Computer Science & Engineering", Role.ROLE_STUDENT);
        seedUser("student-tanha", "demo-student-pass", "Tanha Begum", "011221007", "Computer Science & Engineering", Role.ROLE_STUDENT);
        seedUser("student-sabbir", "demo-student-pass", "Sabbir Khan", "011221008", "Computer Science & Engineering", Role.ROLE_STUDENT);

        // 3. Seed teaching schedules
        seedTeacherSchedule("teacher-demo", "CSE 2211", "Advanced Object Oriented Programming", "Section A", "Room 524", "Sunday", "10:30", "12:00");
        seedTeacherSchedule("teacher-demo", "CSE 2211", "Advanced Object Oriented Programming", "Section A", "Room 524", "Tuesday", "10:30", "12:00");
        seedTeacherSchedule("teacher-demo", "CSE 3312", "Database Systems", "Section B", "Room 412", "Monday", "14:00", "15:30");
        seedTeacherSchedule("teacher-demo", "CSE 3312", "Database Systems", "Section B", "Room 412", "Wednesday", "14:00", "15:30");

        // 4. Seed classrooms
        seedClassroom("Room 524 (CSE Lab 4)", 60, 5, true, 3.8, "UIU Main Campus", "CSE Lab");
        seedClassroom("Room 522 (Theory)", 55, 5, false, 0.4, "UIU Main Campus", "Theory");
        seedClassroom("Room 412 (Multimedia)", 70, 4, true, 4.2, "UIU Main Campus", "Multimedia");
        seedClassroom("Room 301 (Auditorium)", 250, 3, true, 18.5, "UIU Main Campus", "Auditorium");
        seedClassroom("Room 608 (Seminar)", 45, 6, false, 0.2, "UIU Main Campus", "Seminar");

        // 5. Seed demo class enrollments
        seedEnrollments();

        // 6. Seed campus notices
        if (noticeRepository.count() == 0) {
            noticeRepository.save(new CampusNotice(
                    "Smart Campus System Live",
                    "Welcome to UIU Smart Campus. Classroom occupancy, shuttle routes, and gate controls are now operating in real-time simulation.",
                    "GENERAL", "HIGH", "System Administrator"
            ));
            noticeRepository.save(new CampusNotice(
                    "AOOP Project Milestone Update 1 Scheduled",
                    "Update 1 presentation will be held on September 5. Ensure your environment, Spring Boot architecture, and login flows are verified.",
                    "ACADEMIC", "HIGH", "Department of CSE"
            ));
            noticeRepository.save(new CampusNotice(
                    "UIU Shuttle Bus Real-Time Tracking Online",
                    "Campus shuttle route 1 (Natun Bazar to UIU) and route 2 (Kuril to UIU) socket telemetry feeds are actively transmitting.",
                    "TRANSPORT", "MEDIUM", "Transport Division"
            ));
        }

        // 7. Seed maintenance complaints
        if (complaintRepository.count() == 0) {
            complaintRepository.save(new MaintenanceComplaint(
                    "Rahat Hossain", "011211001", "Room 524 - Multimedia Lab",
                    "Projector HDMI Port Signal Intermittent",
                    "The main projector loses video signal every few minutes during lecture presentations.",
                    "HIGH"
            ));
            complaintRepository.save(new MaintenanceComplaint(
                    "Tanvir Ahmed", "011221002", "Library 3rd Floor - Study Cubicle 12",
                    "WiFi Hotspot Packet Drop",
                    "Students experiencing slow ping and intermittent disconnects on UIU-Student-5G.",
                    "MEDIUM"
            ));
            complaintRepository.save(new MaintenanceComplaint(
                    "Sadia Rahman", "011221003", "Cafeteria Ground Floor",
                    "Water Dispenser Cooling Coil Inactive",
                    "Ground floor drinking water dispenser is dispensing room temperature water.",
                    "LOW"
            ));
        }

        // 8. Seed admin action history
        if (actionLogRepository.count() == 0) {
            actionLogRepository.save(new AdminActionLog("admin-demo", "SYSTEM_INIT", "Initial Smart Campus environment booted with XAMPP MySQL and Spring Security."));
            actionLogRepository.save(new AdminActionLog("admin-demo", "SECURITY_POLICY", "Enforced BCrypt 10-round salt password hashing for all user accounts."));
            actionLogRepository.save(new AdminActionLog("admin-demo", "ROOM_CALIBRATION", "Calibrated 48 smart classrooms and 12 laboratory telemetry profiles."));
        }

        logger.info("Seed data initialization completed successfully!");
    }

    /**
     * Seeds enrollment data for the roster demonstration.
     * CSE 2211 Section A: 6 students
     * CSE 3312 Section B: 5 students (overlap with CSE 2211 students is realistic)
     */
    private void seedEnrollments() {
        User teacher = userRepository.findByEmail("teacher-demo").orElse(null);
        if (teacher == null) {
            logger.warn("teacher-demo not found, skipping enrollment seeding.");
            return;
        }

        // CSE 2211 Section A students
        String[] cse2211Students = {
                "student-demo", "student-tanvir", "student-sadia",
                "student-mehedi", "student-nusrat", "student-rafi"
        };
        for (String email : cse2211Students) {
            seedEnrollment(teacher, email, "CSE 2211", "Section A");
        }

        // CSE 3312 Section B students (overlap on mehedi, nusrat, rafi, tanha, sabbir)
        String[] cse3312Students = {
                "student-mehedi", "student-nusrat", "student-rafi",
                "student-tanha", "student-sabbir"
        };
        for (String email : cse3312Students) {
            seedEnrollment(teacher, email, "CSE 3312", "Section B");
        }
    }

    private void seedEnrollment(User teacher, String studentEmail, String courseCode, String sectionName) {
        userRepository.findByEmail(studentEmail).ifPresent(student -> {
            if (!student.getRole().equals(Role.ROLE_STUDENT)) {
                logger.warn("User {} is not a student, skipping enrollment.", studentEmail);
                return;
            }
            if (!enrollmentRepository.existsByTeacherAndStudentAndCourseCodeAndSectionName(
                    teacher, student, courseCode, sectionName)) {
                enrollmentRepository.save(new ClassEnrollment(teacher, student, courseCode, sectionName));
                logger.info("Enrolled {} in {} {}", studentEmail, courseCode, sectionName);
            }
        });
    }

    private void seedUser(String email, String rawPassword, String fullName,
                          String studentOrEmpId, String department, Role role) {
        if (!userRepository.existsByEmail(email)) {
            User user = new User(email, passwordEncoder.encode(rawPassword),
                    fullName, studentOrEmpId, department, role);
            user.setCreatedAt(LocalDateTime.now().minusDays(2));
            userRepository.save(user);
            logger.info("Created default user: {} [{}]", email, role);
        }
    }

    private void seedTeacherSchedule(String teacherEmail, String courseCode, String courseTitle,
                                     String sectionName, String roomNumber,
                                     String dayOfWeek, String startTime, String endTime) {
        if (!teachingScheduleRepository.existsByTeacherEmailAndCourseCodeAndSectionNameAndDayOfWeek(
                teacherEmail, courseCode, sectionName, dayOfWeek)) {
            TeachingSchedule schedule = new TeachingSchedule(
                    teacherEmail, courseCode, courseTitle, sectionName,
                    roomNumber, dayOfWeek, LocalTime.parse(startTime), LocalTime.parse(endTime));
            teachingScheduleRepository.save(schedule);
            logger.info("Created teacher schedule: {} {} {}", teacherEmail, courseCode, dayOfWeek);
        } else {
            teachingScheduleRepository.findByTeacherEmailAndCourseCodeAndSectionNameAndDayOfWeek(
                    teacherEmail, courseCode, sectionName, dayOfWeek).ifPresent(schedule -> {
                if (schedule.getStatus() != ClassStatus.SCHEDULED
                        || schedule.getStartedAt() != null || schedule.getEndedAt() != null) {
                    schedule.setStatus(ClassStatus.SCHEDULED);
                    schedule.setStartedAt(null);
                    schedule.setEndedAt(null);
                    teachingScheduleRepository.save(schedule);
                }
            });
        }
    }

    private void seedClassroom(String roomNumber, int capacity, int floor, boolean occupied,
                               double powerKW, String building, String roomType) {
        if (!classroomRepository.existsByRoomNumber(roomNumber)) {
            classroomRepository.save(new Classroom(roomNumber, capacity, floor, occupied, powerKW, building, roomType));
            logger.info("Created classroom: {}", roomNumber);
        }
    }
}
