package bd.ac.uiu.smartcampus.controller;

import bd.ac.uiu.smartcampus.dto.CampusTelemetryDto;
import bd.ac.uiu.smartcampus.model.Role;
import bd.ac.uiu.smartcampus.repository.CampusNoticeRepository;
import bd.ac.uiu.smartcampus.repository.MaintenanceComplaintRepository;
import bd.ac.uiu.smartcampus.repository.UserRepository;
import bd.ac.uiu.smartcampus.security.CustomUserDetails;
import bd.ac.uiu.smartcampus.syllabus.collections.AdminActionStackService;
import bd.ac.uiu.smartcampus.syllabus.collections.ClassroomModel;
import bd.ac.uiu.smartcampus.syllabus.collections.ComplaintQueueService;
import bd.ac.uiu.smartcampus.syllabus.collections.UniqueAttendeeSetService;
import bd.ac.uiu.smartcampus.syllabus.concurrency.CampusSimulationWorker;
import bd.ac.uiu.smartcampus.syllabus.networking.BusServerSocketManager;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Controller
@RequestMapping("/dashboard")
public class DashboardController {

    private final UserRepository userRepository;
    private final CampusNoticeRepository noticeRepository;
    private final MaintenanceComplaintRepository complaintRepository;
    private final AdminActionStackService actionStackService;
    private final ComplaintQueueService complaintQueueService;
    private final UniqueAttendeeSetService attendeeSetService;
    private final CampusSimulationWorker simulationWorker;
    private final BusServerSocketManager busServerManager;

    public DashboardController(UserRepository userRepository,
                               CampusNoticeRepository noticeRepository,
                               MaintenanceComplaintRepository complaintRepository,
                               AdminActionStackService actionStackService,
                               ComplaintQueueService complaintQueueService,
                               UniqueAttendeeSetService attendeeSetService,
                               CampusSimulationWorker simulationWorker,
                               BusServerSocketManager busServerManager) {
        this.userRepository = userRepository;
        this.noticeRepository = noticeRepository;
        this.complaintRepository = complaintRepository;
        this.actionStackService = actionStackService;
        this.complaintQueueService = complaintQueueService;
        this.attendeeSetService = attendeeSetService;
        this.simulationWorker = simulationWorker;
        this.busServerManager = busServerManager;
    }

    @GetMapping("/admin")
    public String adminDashboard(@AuthenticationPrincipal CustomUserDetails userDetails, Model model) {
        addUserAttributes(model, userDetails);

        CampusTelemetryDto telemetry = simulationWorker.getLatestTelemetry();
        model.addAttribute("telemetry", telemetry);
        model.addAttribute("totalUsers", userRepository.count());
        model.addAttribute("totalStudents", userRepository.countByRole(Role.ROLE_STUDENT));
        model.addAttribute("totalTeachers", userRepository.countByRole(Role.ROLE_TEACHER));
        model.addAttribute("totalSecurity", userRepository.countByRole(Role.ROLE_SECURITY));

        // AOOP Syllabus Components
        model.addAttribute("actionStackHistory", actionStackService.getRecentStackHistory());
        model.addAttribute("actionStackSize", actionStackService.getStackSize());
        model.addAttribute("queuedComplaints", complaintQueueService.getQueuedComplaints());
        model.addAttribute("queueSize", complaintQueueService.getQueueSize());
        model.addAttribute("uniqueAttendeesCount", attendeeSetService.getUniqueCount());
        model.addAttribute("busLocations", busServerManager.getLatestBusLocations());
        model.addAttribute("notices", noticeRepository.findTop10ByOrderByPostedAtDesc());

        return "dashboard-admin";
    }

    @GetMapping("/teacher")
    public String teacherDashboard(@AuthenticationPrincipal CustomUserDetails userDetails, Model model) {
        addUserAttributes(model, userDetails);

        CampusTelemetryDto telemetry = simulationWorker.getLatestTelemetry();
        model.addAttribute("telemetry", telemetry);
        model.addAttribute("notices", noticeRepository.findTop10ByOrderByPostedAtDesc());

        // Sample Classrooms demonstrating Comparable / Comparator
        List<ClassroomModel> classrooms = getSampleClassrooms();
        Collections.sort(classrooms); // Uses Comparable natural order
        model.addAttribute("classrooms", classrooms);

        return "dashboard-teacher";
    }

    @GetMapping("/student")
    public String studentDashboard(@AuthenticationPrincipal CustomUserDetails userDetails, Model model) {
        addUserAttributes(model, userDetails);

        CampusTelemetryDto telemetry = simulationWorker.getLatestTelemetry();
        model.addAttribute("telemetry", telemetry);
        model.addAttribute("notices", noticeRepository.findTop10ByOrderByPostedAtDesc());
        model.addAttribute("busLocations", busServerManager.getLatestBusLocations());
        model.addAttribute("myComplaints", complaintRepository.findByStudentIdOrderByReportedAtDesc(
                userDetails != null ? userDetails.getStudentOrEmpId() : "011211001"));

        return "dashboard-student";
    }

    @GetMapping("/security")
    public String securityDashboard(@AuthenticationPrincipal CustomUserDetails userDetails, Model model) {
        addUserAttributes(model, userDetails);

        CampusTelemetryDto telemetry = simulationWorker.getLatestTelemetry();
        model.addAttribute("telemetry", telemetry);
        model.addAttribute("uniqueGatePassCount", attendeeSetService.getUniqueCount());
        model.addAttribute("busLocations", busServerManager.getLatestBusLocations());
        model.addAttribute("notices", noticeRepository.findTop10ByOrderByPostedAtDesc());

        return "dashboard-security";
    }

    private void addUserAttributes(Model model, CustomUserDetails userDetails) {
        if (userDetails != null) {
            model.addAttribute("currentUser", userDetails.getUser());
            model.addAttribute("userFullName", userDetails.getFullName());
            model.addAttribute("userEmail", userDetails.getUsername());
            model.addAttribute("userRole", userDetails.getRoleName());
            model.addAttribute("userDepartment", userDetails.getDepartment());
            model.addAttribute("userIdCode", userDetails.getStudentOrEmpId());
        }
    }

    private List<ClassroomModel> getSampleClassrooms() {
        List<ClassroomModel> list = new ArrayList<>();
        list.add(new ClassroomModel("Room 524 (CSE Lab 4)", 60, 5, true, 3.8));
        list.add(new ClassroomModel("Room 522 (Theory)", 55, 5, false, 0.4));
        list.add(new ClassroomModel("Room 412 (Multimedia)", 70, 4, true, 4.2));
        list.add(new ClassroomModel("Room 301 (Auditorium)", 250, 3, true, 18.5));
        list.add(new ClassroomModel("Room 608 (Seminar)", 45, 6, false, 0.2));
        return list;
    }
}
