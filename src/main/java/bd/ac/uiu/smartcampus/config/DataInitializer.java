package bd.ac.uiu.smartcampus.config;

import bd.ac.uiu.smartcampus.model.*;
import bd.ac.uiu.smartcampus.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    @org.springframework.beans.factory.annotation.Autowired
    private BusRepository busRepository;
    @org.springframework.beans.factory.annotation.Autowired
    private BusRouteRepository busRouteRepository;
    @org.springframework.beans.factory.annotation.Autowired
    private CampusEventRepository campusEventRepository;
    @org.springframework.beans.factory.annotation.Autowired
    private CafeteriaMenuItemRepository cafeteriaMenuItemRepository;

    private final UserRepository userRepository;
    private final CampusNoticeRepository noticeRepository;
    private final MaintenanceComplaintRepository complaintRepository;
    private final AdminActionLogRepository actionLogRepository;
    private final TeachingScheduleRepository teachingScheduleRepository;
    private final ClassroomRepository classroomRepository;
    private final ClassEnrollmentRepository enrollmentRepository;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final AbsenceExcuseRepository absenceExcuseRepository;
    private final LostFoundItemRepository lostFoundItemRepository;
    private final LabEquipmentRepository labEquipmentRepository;
    private final FacultyOfficeHourSlotRepository officeHourSlotRepository;
    private final CampusVisitorRepository campusVisitorRepository;
    private final ParkingZoneRepository parkingZoneRepository;
    private final EmergencyAlertRepository emergencyAlertRepository;
    private final SecurityIncidentRepository securityIncidentRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final TeacherProfileRepository teacherProfileRepository;
    private final DepartmentRepository departmentRepository;
    private final CourseRepository courseRepository;
    private final BuildingRepository buildingRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           CampusNoticeRepository noticeRepository,
                           MaintenanceComplaintRepository complaintRepository,
                           AdminActionLogRepository actionLogRepository,
                           TeachingScheduleRepository teachingScheduleRepository,
                           ClassroomRepository classroomRepository,
                           ClassEnrollmentRepository enrollmentRepository,
                           AttendanceSessionRepository attendanceSessionRepository,
                           AttendanceRecordRepository attendanceRecordRepository,
                           AbsenceExcuseRepository absenceExcuseRepository,
                           LostFoundItemRepository lostFoundItemRepository,
                           LabEquipmentRepository labEquipmentRepository,
                           FacultyOfficeHourSlotRepository officeHourSlotRepository,
                           CampusVisitorRepository campusVisitorRepository,
                           ParkingZoneRepository parkingZoneRepository,
                           EmergencyAlertRepository emergencyAlertRepository,
                           SecurityIncidentRepository securityIncidentRepository,
                           StudentProfileRepository studentProfileRepository,
                           TeacherProfileRepository teacherProfileRepository,
                           DepartmentRepository departmentRepository,
                           CourseRepository courseRepository,
                           BuildingRepository buildingRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.noticeRepository = noticeRepository;
        this.complaintRepository = complaintRepository;
        this.actionLogRepository = actionLogRepository;
        this.teachingScheduleRepository = teachingScheduleRepository;
        this.classroomRepository = classroomRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.attendanceSessionRepository = attendanceSessionRepository;
        this.attendanceRecordRepository = attendanceRecordRepository;
        this.absenceExcuseRepository = absenceExcuseRepository;
        this.lostFoundItemRepository = lostFoundItemRepository;
        this.labEquipmentRepository = labEquipmentRepository;
        this.officeHourSlotRepository = officeHourSlotRepository;
        this.campusVisitorRepository = campusVisitorRepository;
        this.parkingZoneRepository = parkingZoneRepository;
        this.emergencyAlertRepository = emergencyAlertRepository;
        this.securityIncidentRepository = securityIncidentRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.teacherProfileRepository = teacherProfileRepository;
        this.departmentRepository = departmentRepository;
        this.courseRepository = courseRepository;
        this.buildingRepository = buildingRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        logger.info("Initializing UIU Smart Campus seed data...");

        // 0. Seed Master Data (Phase 2)
        seedMasterData();

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

        // 2.5 Seed student profiles if missing
        seedStudentProfiles();

        // 2.6 Seed teacher profiles if missing
        seedTeacherProfiles();

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

        // 4.5 Backfill relationships for Phase 2
        backfillLegacyRelationships();

        // 5. Seed demo class enrollments
        seedEnrollments();

        // 6. Seed past attendance sessions & records
        seedAttendanceData();

        // 7. Seed sample absence excuses
        seedAbsenceExcuses();

        // 8. Seed Digital Lost & Found items
        seedLostAndFound();

        // 9. Seed Lab & Hardware Equipment
        seedLabEquipment();

        // 9.5 Backfill equipment added after the first relationship pass
        backfillLegacyRelationships();

        // 10. Seed Faculty Office Hour slots
        seedOfficeHourSlots();

        // 11. Seed campus notices
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
                    "Campus shuttle routes for Natun Bazar, Kuril, and Badda are actively transmitting socket telemetry.",
                    "TRANSPORT", "MEDIUM", "Transport Division"
            ));
        }

        // 12. Seed maintenance complaints
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

        // 13. Seed admin action history
        if (actionLogRepository.count() == 0) {
            actionLogRepository.save(new AdminActionLog("admin-demo", "SYSTEM_INIT", "Initial Smart Campus environment booted with XAMPP MySQL and Spring Security."));
            actionLogRepository.save(new AdminActionLog("admin-demo", "SECURITY_POLICY", "Enforced BCrypt 10-round salt password hashing for all user accounts."));
            actionLogRepository.save(new AdminActionLog("admin-demo", "ROOM_CALIBRATION", "Calibrated 48 smart classrooms and 12 laboratory telemetry profiles."));
        }

        // 14. Seed Security operations (Visitors, Parking Zones, Incidents)
        seedSecurityData();

        // 15. Seed Campus Operations (Phase 4)
        seedCampusOperationsData();

        logger.info("Seed data initialization completed successfully!");
    }

    private void seedCampusOperationsData() {
        Bus bus1 = seedBus("BUS-01", "DHAKA METRO-JA 11-2233", 40, "Karim Mia", "01711223344");
        Bus bus2 = seedBus("BUS-02", "DHAKA METRO-JA 44-5566", 50, "Rahim Uddin", "01811223344");
        Bus bus3 = seedBus("BUS-03", "DHAKA METRO-JA 77-8899", 45, "Jamal Hossain", "01911223344");

        seedBusRoute(
                "R-01",
                "Natun Bazar to UIU",
                "Natun Bazar",
                "UIU",
                bus1,
                List.of(
                        new BusRouteStop("Natun Bazar", 1, 0),
                        new BusRouteStop("100 Feet Bridge", 2, 10),
                        new BusRouteStop("UIU", 3, 20)
                )
        );
        seedBusRoute(
                "R-02",
                "Kuril Bishwaroad to UIU",
                "Kuril Bishwaroad",
                "UIU",
                bus2,
                List.of(
                        new BusRouteStop("Kuril Bishwaroad", 1, 0),
                        new BusRouteStop("Bashundhara R/A Road 02", 2, 12),
                        new BusRouteStop("UIU Campus Gate", 3, 25)
                )
        );
        seedBusRoute(
                "R-03",
                "UIU to Badda",
                "UIU",
                "Badda",
                bus3,
                List.of(
                        new BusRouteStop("UIU Campus Gate", 1, 0),
                        new BusRouteStop("Wonderland Road", 2, 8),
                        new BusRouteStop("Meradia Kacha Bazar", 3, 20)
                )
        );

        if (campusEventRepository.count() == 0) {
            campusEventRepository.save(new CampusEvent("Tech Fest 2026", "Annual technology festival.", LocalDate.now().plusDays(10), LocalTime.of(10, 0), LocalTime.of(18, 0), "UIU Open Ground", 500, "CSE Club", "PUBLISHED"));
            campusEventRepository.save(new CampusEvent("Job Fair", "Career networking event.", LocalDate.now().plusDays(15), LocalTime.of(9, 0), LocalTime.of(17, 0), "UIU Lobby", 1000, "Career Counseling Center", "DRAFT"));
        }

        if (cafeteriaMenuItemRepository.count() == 0) {
            cafeteriaMenuItemRepository.save(new CafeteriaMenuItem("Chicken Sandwich", "SNACKS", java.math.BigDecimal.valueOf(120), true, "Freshly made sandwich with grilled chicken."));
            cafeteriaMenuItemRepository.save(new CafeteriaMenuItem("Cold Coffee", "DRINKS", java.math.BigDecimal.valueOf(80), true, "Refreshing cold coffee."));
            cafeteriaMenuItemRepository.save(new CafeteriaMenuItem("Fried Rice with Chicken", "LUNCH", java.math.BigDecimal.valueOf(250), true, "Classic fried rice and fried chicken combo."));
        }
    }

    private Bus seedBus(String busCode, String registrationNumber, int capacity, String driverName, String driverPhone) {
        return busRepository.findByBusCode(busCode)
                .orElseGet(() -> busRepository.save(new Bus(busCode, registrationNumber, capacity, driverName, driverPhone)));
    }

    private void seedBusRoute(String routeCode, String name, String origin, String destination, Bus assignedBus, List<BusRouteStop> stops) {
        busRouteRepository.findByRouteCode(routeCode).orElseGet(() -> {
            BusRoute route = new BusRoute(routeCode, name, origin, destination);
            route.setAssignedBus(assignedBus);
            stops.forEach(route::addStop);
            return busRouteRepository.save(route);
        });
    }

    private void seedMasterData() {
        // Departments
        seedDepartment("CSE", "Computer Science & Engineering");
        seedDepartment("EEE", "Electrical & Electronic Engineering");
        seedDepartment("BBA", "Business Administration");
        seedDepartment("ADMIN", "Administration");
        seedDepartment("SEC", "Campus Security & Safety");
        seedDepartment("REG", "Registrar");
        seedDepartment("SA", "Student Affairs");
        seedDepartment("ENG", "English");
        seedDepartment("GED", "General Education");
        seedDepartment("MATH", "Mathematics");
        seedDepartment("PHY", "Physics");
        seedDepartment("BIO", "Biology");
        seedDepartment("SOC", "Social Sciences");
        seedDepartment("PMG", "Project Management");
        seedDepartment("BDS", "Bangladesh Studies");
        seedDepartment("ECO", "Economics");
        seedDepartment("ACT", "Accounting");
        seedDepartment("IPE", "Industrial & Production Engineering");
        seedDepartment("PSY", "Psychology");
        seedDepartment("BAN", "Bangla");
        seedDepartment("FLN", "Foreign Languages");
        seedDepartment("SWL", "Software and Law");
        seedDepartment("BHV", "Behavioral Science");
        seedDepartment("URC", "University Required Courses");

        // Buildings
        if (!buildingRepository.existsByCode("UIU-MAIN")) {
            buildingRepository.save(new Building("UIU-MAIN", "UIU Main Campus", 6, "Main Academic Building"));
        }

        // UIU BSCSE curriculum, effective Summer 2026 onward.
        Object[][] courses = {
                {"ENG 1011", "English I", 3},
                {"ENG 1013", "English II", 3},
                {"SOC 2101", "Society, Environment and Engineering Ethics", 3},
                {"PMG 4101", "Project Management", 3},
                {"BDS 1201", "History of the Emergence of Bangladesh", 2},
                {"ECO 4101", "Economics", 3},
                {"SOC 4101", "Introduction to Sociology", 3},
                {"ACT 2111", "Financial and Managerial Accounting", 3},
                {"IPE 3401", "Industrial and Operational Management", 3},
                {"GED 4003", "Technology Entrepreneurship", 3},
                {"PSY 2101", "Psychology", 3},
                {"BDS 2201", "Bangladesh Studies", 3},
                {"BAN 2501", "Bangla", 3},
                {"SOC 4301", "Introduction to Anthropology", 3},
                {"FLN 1101", "Introduction to a Foreign Language", 3},
                {"SWL 4101", "Software and Law", 3},
                {"BHV 2101", "Introduction to Behavioral Science", 3},
                {"URC 1101", "Life Skill for Success", 3},
                {"GED 1005", "AI Literacy and Prompt Engineering", 3},
                {"PHY 2105", "Physics", 3},
                {"PHY 2106", "Physics Laboratory", 1},
                {"BIO 3105", "Biology for Engineers", 3},
                {"MATH 1151", "Fundamental Calculus", 3},
                {"MATH 2183", "Calculus and Linear Algebra", 3},
                {"MATH 2201", "Coordinate Geometry and Vector Analysis", 3},
                {"MATH 2205", "Probability and Statistics", 3},
                {"EEE 2113", "Electrical Circuits", 3},
                {"EEE 2123", "Electronics", 3},
                {"EEE 2124", "Electronics Laboratory", 1},
                {"EEE 4261", "Green Computing", 3},
                {"CSE 1110", "Introduction to Computer Systems", 1},
                {"CSE 1111", "Structured Programming Language", 3},
                {"CSE 1112", "Structured Programming Language Laboratory", 1},
                {"CSE 1115", "Object Oriented Programming", 3},
                {"CSE 1116", "Object Oriented Programming Laboratory", 1},
                {"CSE 2118", "Advanced Object Oriented Programming Laboratory", 1},
                {"CSE 4165", "Web Programming", 3},
                {"CSE 1325", "Digital Logic Design", 3},
                {"CSE 1326", "Digital Logic Design Laboratory", 1},
                {"CSE 3313", "Computer Architecture", 3},
                {"CSE 4325", "Microprocessors and Microcontrollers", 3},
                {"CSE 4326", "Microprocessors and Microcontrollers Laboratory", 1},
                {"CSE 2213", "Discrete Mathematics", 3},
                {"CSE 2215", "Data Structure and Algorithms I", 3},
                {"CSE 2216", "Data Structure and Algorithms I Laboratory", 1},
                {"CSE 2217", "Data Structure and Algorithms II", 3},
                {"CSE 2218", "Data Structure and Algorithms II Laboratory", 1},
                {"CSE 2233", "Theory of Computation", 3},
                {"CSE 3411", "System Analysis and Design", 3},
                {"CSE 3412", "System Analysis and Design Laboratory", 1},
                {"CSE 3421", "Software Engineering", 3},
                {"CSE 3422", "Software Engineering Laboratory", 1},
                {"CSE 4531", "Computer Security", 3},
                {"CSE 3521", "Database Management Systems", 3},
                {"CSE 3522", "Database Management Systems Laboratory", 1},
                {"CSE 4509", "Operating Systems", 3},
                {"CSE 4510", "Operating Systems Laboratory", 1},
                {"CSE 3711", "Computer Networks", 3},
                {"CSE 3712", "Computer Networks Laboratory", 1},
                {"CSE 3811", "Artificial Intelligence", 3},
                {"CSE 3812", "Artificial Intelligence Laboratory", 1},
                {"CSE 4889", "Machine Learning", 3},
                {"CSE 4121", "Security Monitoring", 3},
                {"CSE 4759", "Wireless and Cellular Communication", 3},
                {"CSE 4123", "Software and Application Security", 3},
                {"CSE 4125", "Ethical Hacking and Network Defense", 3},
                {"CSE 4127", "Cloud Security", 3},
                {"CSE 4129", "Digital Forensics", 3},
                {"CSE 4131", "Internet of Things (IoT) Security", 3},
                {"CSE 3715", "Data Communication", 3},
                {"CSE 4199", "Special Topics", 3},
                {"CSE 4793", "Advanced Network Services and Management", 3},
                {"CSE 4783", "Cryptography", 3},
                {"CSE 4777", "Network Security", 3},
                {"CSE 4943", "Web Application Security", 3},
                {"CSE 4949", "IT Audit: Concepts and Practice", 3},
                {"CSE 3542", "Industry Internship", 3},
                {"CSE 4435", "Software Architecture", 3},
                {"CSE 4181", "Mobile Application Development", 3},
                {"CSE 4495", "Software Testing and Quality Assurance", 3},
                {"CSE 4587", "Cloud Computing", 3},
                {"CSE 4567", "Advanced Database Management Systems", 3},
                {"CSE 4413", "Virtual Reality/Augmented Reality System Design", 3},
                {"CSE 4611", "Compiler Design", 3},
                {"CSE 4945", "UI: Concepts and Design", 3},
                {"CSE 4871", "Data Analytics", 3},
                {"CSE 4299", "Special Topics", 3},
                {"CSE 4133", "Business Intelligence", 3},
                {"CSE 4451", "Human Computer Interaction", 3},
                {"CSE 4485", "Game Design and Development", 3},
                {"CSE 4519", "Distributed Systems", 3},
                {"CSE 4523", "Simulation and Modeling", 3},
                {"CSE 4621", "Computer Graphics", 3},
                {"CSE 4601", "Mathematical Analysis for Computer Science", 3},
                {"CSE 4633", "Basic Graph Theory", 3},
                {"CSE 4655", "Algorithm Engineering", 3},
                {"CSE 4547", "Multimedia Systems Design", 3},
                {"CSE 4613", "Computational Geometry", 3},
                {"CSE 4379", "Real-time Embedded Systems", 3},
                {"CSE 4337", "Robotics", 3},
                {"CSE 4399", "Special Topics", 3},
                {"CSE 4327", "VLSI Design", 3},
                {"CSE 4853", "Internet of Things (IoT)", 3},
                {"CSE 4819", "AI for Autonomous Systems", 3},
                {"CSE 4813", "Deep Learning", 3},
                {"CSE 4815", "Large Language Model and Generative AI", 3},
                {"CSE 4329", "Digital System Design", 3},
                {"CSE 4397", "Interfacing", 3},
                {"CSE 4891", "Data Mining", 3},
                {"CSE 4823", "Data Driven Decision Making", 3},
                {"CSE 4817", "Big Data Analytics", 3},
                {"CSE 4821", "Digital Marketing", 3},
                {"CSE 4941", "Enterprise Systems: Concepts and Practice", 3},
                {"CSE 4765", "Electronic Commerce", 3},
                {"CSE 4499", "Special Topics", 3},
                {"CSE 4811", "Natural Language Processing", 3},
                {"CSE 4893", "Introduction to Bioinformatics", 3},
                {"CSE 4883", "Digital Image Processing", 3},
                {"CSE 4825", "Speech Processing and Recognition", 3},
                {"CSE 4599", "Special Topics", 3},
                {"CSE 4000A", "Final Year Design Project - I", 2},
                {"CSE 4000B", "Final Year Design Project - II", 2},
                {"CSE 4000C", "Final Year Design Project - III", 2}
        };

        for (Object[] course : courses) {
            Department department = resolveDepartmentForCourse((String) course[0]);
            if (department != null) {
                seedCourse((String) course[0], (String) course[1], department, (Integer) course[2]);
            }
        }
    }

    private void seedDepartment(String code, String name) {
        if (!departmentRepository.existsByCode(code)) {
            departmentRepository.save(new Department(code, name));
        }
    }

    private Department resolveDepartmentForCourse(String courseCode) {
        String prefix = courseCode.split("\\s+")[0];
        return departmentRepository.findByCode(prefix)
                .or(() -> departmentRepository.findByCode("GED"))
                .orElse(null);
    }

    private void seedCourse(String code, String name, Department dept, int credits) {
        if (!courseRepository.existsByCourseCode(code)) {
            courseRepository.save(new Course(code, name, dept, credits));
        }
    }

    private void backfillLegacyRelationships() {
        // 1. Backfill Users -> Department
        userRepository.findAll().forEach(user -> {
            if (user.getDepartmentRef() == null && user.getDepartment() != null) {
                departmentRepository.findByName(user.getDepartment()).ifPresent(dept -> {
                    user.setDepartmentRef(dept);
                    userRepository.save(user);
                });
            }
        });

        // 2. Backfill Classroom -> Building
        Building mainBuilding = buildingRepository.findByCode("UIU-MAIN").orElse(null);
        if (mainBuilding != null) {
            classroomRepository.findAll().forEach(room -> {
                if (room.getBuildingRef() == null && "UIU Main Campus".equals(room.getBuilding())) {
                    room.setBuildingRef(mainBuilding);
                    classroomRepository.save(room);
                }
            });
        }

        // 3. Backfill TeachingSchedule -> Course & Classroom
        teachingScheduleRepository.findAll().forEach(schedule -> {
            boolean updated = false;
            if (schedule.getCourseRef() == null && schedule.getCourseCode() != null) {
                Optional<Course> course = courseRepository.findByCourseCode(schedule.getCourseCode());
                if (course.isPresent()) {
                    schedule.setCourseRef(course.get());
                    updated = true;
                }
            }
            if (schedule.getClassroomRef() == null && schedule.getRoomNumber() != null) {
                Optional<Classroom> room = resolveClassroom(schedule.getRoomNumber());
                if (room.isPresent()) {
                    schedule.setClassroomRef(room.get());
                    updated = true;
                }
            }
            if (updated) {
                teachingScheduleRepository.save(schedule);
            }
        });

        // 4. Backfill LabEquipment -> Classroom
        labEquipmentRepository.findAll().forEach(eq -> {
            if (eq.getHomeClassroom() == null && eq.getLabLocation() != null) {
                resolveClassroom(eq.getLabLocation()).ifPresent(room -> {
                    eq.setHomeClassroom(room);
                    labEquipmentRepository.save(eq);
                });
            }
        });
    }

    private Optional<Classroom> resolveClassroom(String location) {
        if (location == null || location.isBlank()) {
            return Optional.empty();
        }
        Optional<Classroom> exact = classroomRepository.findByRoomNumber(location.trim());
        if (exact.isPresent()) {
            return exact;
        }
        String roomToken = extractRoomToken(location);
        if (roomToken == null) {
            return Optional.empty();
        }
        List<Classroom> matches = classroomRepository.findAll().stream()
                .filter(room -> roomToken.equals(extractRoomToken(room.getRoomNumber())))
                .toList();
        return matches.size() == 1 ? Optional.of(matches.get(0)) : Optional.empty();
    }

    private String extractRoomToken(String value) {
        Matcher matcher = Pattern.compile("\\b(\\d{3,})\\b").matcher(value);
        return matcher.find() ? matcher.group(1) : null;
    }

    private void seedEnrollments() {
        User teacher = userRepository.findByEmail("teacher-demo").orElse(null);
        if (teacher == null) return;

        String[] cse2211Students = {
                "student-demo", "student-tanvir", "student-sadia",
                "student-mehedi", "student-nusrat", "student-rafi"
        };
        for (String email : cse2211Students) {
            seedEnrollment(teacher, email, "CSE 2211", "Section A");
        }

        String[] cse3312Students = {
                "student-demo", "student-mehedi", "student-nusrat", "student-rafi",
                "student-tanha", "student-sabbir"
        };
        for (String email : cse3312Students) {
            seedEnrollment(teacher, email, "CSE 3312", "Section B");
        }
    }

    private void seedEnrollment(User teacher, String studentEmail, String courseCode, String sectionName) {
        userRepository.findByEmail(studentEmail).ifPresent(student -> {
            if (!student.getRole().equals(Role.ROLE_STUDENT)) return;
            if (!enrollmentRepository.existsByTeacherAndStudentAndCourseCodeAndSectionName(
                    teacher, student, courseCode, sectionName)) {
                enrollmentRepository.save(new ClassEnrollment(teacher, student, courseCode, sectionName));
            }
        });
    }

    private void seedAttendanceData() {
        if (attendanceSessionRepository.count() > 0) return;

        teachingScheduleRepository.findAll().forEach(schedule -> {
            if ("CSE 2211".equals(schedule.getCourseCode())) {
                createPastSession(schedule, LocalDate.now().minusDays(14), true);  // Present
                createPastSession(schedule, LocalDate.now().minusDays(10), true);  // Present
                createPastSession(schedule, LocalDate.now().minusDays(7), false);  // Absent (for excuse demo)
                createPastSession(schedule, LocalDate.now().minusDays(3), true);   // Present
            } else if ("CSE 3312".equals(schedule.getCourseCode())) {
                createPastSession(schedule, LocalDate.now().minusDays(12), true);  // Present
                createPastSession(schedule, LocalDate.now().minusDays(8), true);   // Present
                createPastSession(schedule, LocalDate.now().minusDays(5), false);  // Absent
                createPastSession(schedule, LocalDate.now().minusDays(1), true);   // Present
            }
        });
    }

    private void createPastSession(TeachingSchedule schedule, LocalDate date, boolean studentDemoPresent) {
        AttendanceSession session = new AttendanceSession(schedule, schedule.getTeacherEmail(), UUID.randomUUID().toString());
        session.setSessionDate(date);
        session.setStartedAt(date.atTime(schedule.getStartTime()));
        session.setEndedAt(date.atTime(schedule.getEndTime()));
        session.setActive(false);
        session = attendanceSessionRepository.save(session);

        // Student-demo record
        if (studentDemoPresent) {
            attendanceRecordRepository.save(new AttendanceRecord(
                    session, "011211001", "Rahat Hossain", AttendanceStatus.PRESENT, date.atTime(schedule.getStartTime().plusMinutes(5))
            ));
        } else {
            attendanceRecordRepository.save(new AttendanceRecord(
                    session, "011211001", "Rahat Hossain", AttendanceStatus.ABSENT, null
            ));
        }

        // Add records for other enrolled students
        attendanceRecordRepository.save(new AttendanceRecord(session, "011221002", "Tanvir Ahmed", AttendanceStatus.PRESENT, date.atTime(schedule.getStartTime())));
        attendanceRecordRepository.save(new AttendanceRecord(session, "011221003", "Sadia Rahman", AttendanceStatus.PRESENT, date.atTime(schedule.getStartTime().plusMinutes(2))));
        attendanceRecordRepository.save(new AttendanceRecord(session, "011221004", "Mehedi Hasan", AttendanceStatus.LATE, date.atTime(schedule.getStartTime().plusMinutes(12))));
    }

    private void seedAbsenceExcuses() {
        if (absenceExcuseRepository.count() > 0) return;

        AbsenceExcuse excuse = new AbsenceExcuse(
                "011211001", "Rahat Hossain", "student-demo",
                "CSE 2211", "Advanced Object Oriented Programming", "Section A",
                "teacher-demo", LocalDate.now().minusDays(7), "MEDICAL",
                "Had high fever and consulted physician. Medical prescription attached for verification.",
                "MED-PRESCRIPTION-UIU-9821.pdf"
        );
        excuse.setStatus(AbsenceExcuse.ExcuseStatus.PENDING);
        absenceExcuseRepository.save(excuse);
    }

    private void seedLostAndFound() {
        if (lostFoundItemRepository.count() > 0) return;

        lostFoundItemRepository.save(new LostFoundItem(
                "Casio fx-991EX ClassWiz Calculator",
                "Found on desk 4 in Room 524 Lab after the morning AOOP session. Black body with blue keys.",
                LostFoundItem.ItemCategory.ELECTRONICS,
                LostFoundItem.ItemType.FOUND,
                "Room 524 (CSE Lab 4)",
                LocalDate.now().minusDays(1),
                "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop&q=60",
                "EMP-CSE-104", "Prof. Tariqul Islam", "teacher-demo", "Drop by Faculty Room 524"
        ));

        lostFoundItemRepository.save(new LostFoundItem(
                "UIU Student ID Card (ID: 011221003)",
                "Student ID card belonging to Sadia Rahman found near the 2nd floor library reading area.",
                LostFoundItem.ItemCategory.ID_CARDS,
                LostFoundItem.ItemType.FOUND,
                "Library 2nd Floor",
                LocalDate.now().minusDays(2),
                "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=60",
                "SEC-GATE-02", "Officer Abul Kalam", "security-demo", "Deposited at Security Gate Post 1"
        ));

        lostFoundItemRepository.save(new LostFoundItem(
                "Motorcycle Key with Leather Tag",
                "Honda motorcycle smart key with a brown leather keychain found on a bench in the cafeteria.",
                LostFoundItem.ItemCategory.KEYS,
                LostFoundItem.ItemType.FOUND,
                "Cafeteria Ground Floor Bench",
                LocalDate.now().minusDays(3),
                "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600&auto=format&fit=crop&q=60",
                "011221002", "Tanvir Ahmed", "student-tanvir", "Contact via student portal"
        ));

        lostFoundItemRepository.save(new LostFoundItem(
                "Hardcover Spiral Notebook - Advanced Java Notes",
                "Lost my black spiral notebook containing handwritten AOOP notes and UML diagrams.",
                LostFoundItem.ItemCategory.BOOKS_STATIONERY,
                LostFoundItem.ItemType.LOST,
                "Room 412 Multimedia Room",
                LocalDate.now().minusDays(2),
                "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=60",
                "011211001", "Rahat Hossain", "student-demo", "Cell: 01700000000"
        ));
    }

    private void seedLabEquipment() {
        if (labEquipmentRepository.count() > 0) return;

        labEquipmentRepository.save(new LabEquipment(
                "Raspberry Pi 4 Model B (4GB RAM)",
                LabEquipment.EquipmentCategory.DEV_BOARD,
                "Lab 524 - IoT & Embedded Systems",
                12, 9,
                "Quad-core Cortex-A72, 4GB LPDDR4, dual micro-HDMI 4K, Gigabit Ethernet, Bluetooth 5.0.",
                "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop&q=60"
        ));

        labEquipmentRepository.save(new LabEquipment(
                "Arduino Mega 2560 R3 Kit",
                LabEquipment.EquipmentCategory.DEV_BOARD,
                "Lab 524 - IoT & Embedded Systems",
                20, 16,
                "ATmega2560 microcontroller, 54 digital I/O pins, 16 analog inputs, 4 UART serial ports.",
                "https://images.unsplash.com/photo-1608564697071-ddf911d81370?w=600&auto=format&fit=crop&q=60"
        ));

        labEquipmentRepository.save(new LabEquipment(
                "STM32 Nucleo-64 (STM32F401RE)",
                LabEquipment.EquipmentCategory.DEV_BOARD,
                "Lab 524 - Embedded Systems Lab",
                10, 8,
                "ARM Cortex-M4 84 MHz with FPU, 512 KB Flash, Arduino Uno V3 connectivity and ST morpho headers.",
                "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=60"
        ));

        labEquipmentRepository.save(new LabEquipment(
                "Rigol DS1054Z 50MHz 4-Channel Digital Oscilloscope",
                LabEquipment.EquipmentCategory.MEASURING_INSTRUMENT,
                "Lab 412 - Hardware & Measurement Lab",
                6, 4,
                "50 MHz bandwidth, 4 analog channels, 1 GSa/s real-time sample rate, 24 Mpts memory depth.",
                "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=60"
        ));

        labEquipmentRepository.save(new LabEquipment(
                "Fluke 117 True-RMS Digital Multimeter",
                LabEquipment.EquipmentCategory.MEASURING_INSTRUMENT,
                "Lab 412 - Hardware & Measurement Lab",
                15, 12,
                "VoltAlert non-contact AC voltage detection, AutoVolt automatic AC/DC voltage selection, low input impedance.",
                "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600&auto=format&fit=crop&q=60"
        ));

        labEquipmentRepository.save(new LabEquipment(
                "24MHz 8-Channel USB Logic Analyzer",
                LabEquipment.EquipmentCategory.ACCESSORY,
                "Lab 524 - Embedded Systems Lab",
                15, 14,
                "8 digital channels, 24 MHz sample rate, I2C, SPI, UART, PWM protocol decoding via PulseView.",
                "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=60"
        ));

        labEquipmentRepository.save(new LabEquipment(
                "RPLiDAR A1M8 360-Degree Laser Scanner",
                LabEquipment.EquipmentCategory.SENSOR_ACTUATOR,
                "Lab 524 - Robotics & IoT Lab",
                5, 3,
                "12m range radius, 360-degree omnidirectional laser scan, 5.5Hz rotational frequency, SLAM compatible.",
                "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&auto=format&fit=crop&q=60"
        ));
    }

    private void seedOfficeHourSlots() {
        if (officeHourSlotRepository.count() > 0) return;

        LocalDate tomorrow = LocalDate.now().plusDays(1);
        LocalDate dayAfter = LocalDate.now().plusDays(2);
        LocalDate dayThree = LocalDate.now().plusDays(3);

        officeHourSlotRepository.save(new FacultyOfficeHourSlot(
                "teacher-demo", "Prof. Tariqul Islam", "Computer Science & Engineering",
                "Room 524 (Faculty Corner)", tomorrow.getDayOfWeek().name(),
                tomorrow, LocalTime.of(11, 0), LocalTime.of(11, 30)
        ));

        officeHourSlotRepository.save(new FacultyOfficeHourSlot(
                "teacher-demo", "Prof. Tariqul Islam", "Computer Science & Engineering",
                "Room 524 (Faculty Corner)", tomorrow.getDayOfWeek().name(),
                tomorrow, LocalTime.of(11, 30), LocalTime.of(12, 0)
        ));

        officeHourSlotRepository.save(new FacultyOfficeHourSlot(
                "teacher-demo", "Prof. Tariqul Islam", "Computer Science & Engineering",
                "Room 524 (Faculty Corner)", dayAfter.getDayOfWeek().name(),
                dayAfter, LocalTime.of(14, 0), LocalTime.of(14, 30)
        ));

        officeHourSlotRepository.save(new FacultyOfficeHourSlot(
                "teacher-demo", "Prof. Tariqul Islam", "Computer Science & Engineering",
                "Room 524 (Faculty Corner)", dayAfter.getDayOfWeek().name(),
                dayAfter, LocalTime.of(14, 30), LocalTime.of(15, 0)
        ));

        officeHourSlotRepository.save(new FacultyOfficeHourSlot(
                "teacher-demo", "Prof. Tariqul Islam", "Computer Science & Engineering",
                "Room 524 (Faculty Corner)", dayThree.getDayOfWeek().name(),
                dayThree, LocalTime.of(10, 0), LocalTime.of(10, 30)
        ));
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

    private void seedStudentProfiles() {
        userRepository.findByRole(Role.ROLE_STUDENT).forEach(student -> {
            if (studentProfileRepository.findByUserId(student.getId()).isEmpty()) {
                studentProfileRepository.save(new StudentProfile(student, 6)); // Default 6th semester
            }
        });
    }

    private void seedTeacherProfiles() {
        userRepository.findByRole(Role.ROLE_TEACHER).forEach(teacher -> {
            if (teacherProfileRepository.findByUserId(teacher.getId()).isEmpty()) {
                teacherProfileRepository.save(new TeacherProfile(teacher, "Professor", "Room 524"));
            }
        });
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
        }
    }

    private void seedClassroom(String roomNumber, int capacity, int floor, boolean occupied,
                               double powerKW, String building, String roomType) {
        if (!classroomRepository.existsByRoomNumber(roomNumber)) {
            classroomRepository.save(new Classroom(roomNumber, capacity, floor, occupied, powerKW, building, roomType));
        }
    }

    private void seedSecurityData() {
        // Seed Parking Zones
        if (parkingZoneRepository.count() == 0) {
            parkingZoneRepository.save(new ParkingZone("B1-EAST", "Basement 1 - East Wing (Faculty & Staff)", "FACULTY_VIP", 120, 84, 85));
            parkingZoneRepository.save(new ParkingZone("B1-WEST", "Basement 1 - West Wing (General Cars)", "CAR", 150, 142, 90));
            parkingZoneRepository.save(new ParkingZone("B2-BIKE", "Basement 2 - Motorcycle Bay", "MOTORCYCLE", 250, 246, 92));
            parkingZoneRepository.save(new ParkingZone("OPEN-GROUND", "Open Ground - Overflow & Visitors", "GENERAL", 80, 28, 80));
        }

        // Seed Visitors
        if (campusVisitorRepository.count() == 0) {
            CampusVisitor v1 = new CampusVisitor(
                    "Dr. Shamsul Alam", "01711009988", "shamsul.alam@partner-uni.edu",
                    "External Examination & Research Collaboration", "Prof. Tariqul Islam", "CSE",
                    LocalDate.now(), LocalTime.of(10, 30), "Dhaka Metro-Gha 14-8899", "1985449922001", false
            );
            v1.setPassCode("VIS-UIU-78219");
            v1.setStatus("APPROVED");
            v1.setApprovedBy("Security Desk");
            campusVisitorRepository.save(v1);

            CampusVisitor v2 = new CampusVisitor(
                    "Kamrul Hasan (Vendor)", "01819223344", "kamrul@hvac-tech.com",
                    "Central AC & Chiller Compressor Maintenance", "Engr. Zahirul Haque", "Administration",
                    LocalDate.now(), LocalTime.of(11, 0), "Dhaka Metro-Ta 11-4455", "1990223344556", false
            );
            v2.setPassCode("VIS-UIU-90214");
            v2.setStatus("PENDING");
            campusVisitorRepository.save(v2);

            CampusVisitor v3 = new CampusVisitor(
                    "Anika Tabassum", "01912556677", "anika.tabassum@gmail.com",
                    "Undergraduate Admission Counseling", "Admission Office", "Registrar",
                    LocalDate.now(), LocalTime.of(9, 30), "N/A (Pedestrian)", "2002334455667", true
            );
            v3.setPassCode("VIS-UIU-33018");
            v3.setStatus("CHECKED_IN");
            v3.setActualCheckInTime(LocalDateTime.now().minusMinutes(45));
            v3.setApprovedBy("Officer Abul Kalam");
            campusVisitorRepository.save(v3);

            CampusVisitor v4 = new CampusVisitor(
                    "Mahbubur Rahman", "01611889900", "mahbub@corp-bank.com",
                    "UIU Career Placement Interview Panel", "Career Counseling Center", "Student Affairs",
                    LocalDate.now().minusDays(1), LocalTime.of(14, 0), "Dhaka Metro-Kha 12-3344", "1988990011223", false
            );
            v4.setPassCode("VIS-UIU-11928");
            v4.setStatus("CHECKED_OUT");
            v4.setActualCheckInTime(LocalDateTime.now().minusDays(1).withHour(14).withMinute(5));
            v4.setActualCheckOutTime(LocalDateTime.now().minusDays(1).withHour(17).withMinute(30));
            v4.setApprovedBy("Officer Abul Kalam");
            campusVisitorRepository.save(v4);
        }

        // Seed Security Incidents
        if (securityIncidentRepository.count() == 0) {
            SecurityIncident inc1 = new SecurityIncident(
                    "Tailgating Attempt at Gate 2 Vehicle Boom",
                    "UNAUTHORIZED_ENTRY", "Gate 2 (North Barrier)", "HIGH",
                    "An unidentified private car attempted to tailgate an authorized faculty vehicle without presenting an RFID pass.",
                    "Unidentified Driver, Vehicle: Dhaka Metro-Ga 22-9012", "Officer Abul Kalam"
            );
            inc1.setStatus("INVESTIGATING");
            inc1.setActionTaken("Security guard stopped vehicle manually. Vehicle was escorted to visitor bay for verification.");
            securityIncidentRepository.save(inc1);

            SecurityIncident inc2 = new SecurityIncident(
                    "Basement 2 Motorcycle Bay Parking Line Obstruction",
                    "TRAFFIC_PARKING", "Basement 2 Bay C", "LOW",
                    "Two motorbikes parked outside designated yellow markers, blocking the fire hose cabinet access.",
                    "Student Bikers (Reg: DH-1123, DH-4456)", "Officer Abul Kalam"
            );
            inc2.setStatus("RESOLVED");
            inc2.setActionTaken("Owners contacted via student database and vehicles repositioned to Bay D.");
            inc2.setResolvedAt(LocalDateTime.now().minusHours(2));
            securityIncidentRepository.save(inc2);
        }
    }
}
