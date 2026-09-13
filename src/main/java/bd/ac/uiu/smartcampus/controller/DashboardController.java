package bd.ac.uiu.smartcampus.controller;

import bd.ac.uiu.smartcampus.dto.CampusTelemetryDto;
import bd.ac.uiu.smartcampus.model.Role;
import bd.ac.uiu.smartcampus.repository.CampusNoticeRepository;
import bd.ac.uiu.smartcampus.repository.ClassroomRepository;
import bd.ac.uiu.smartcampus.repository.MaintenanceComplaintRepository;
import bd.ac.uiu.smartcampus.repository.UserRepository;
import bd.ac.uiu.smartcampus.security.CustomUserDetails;
import bd.ac.uiu.smartcampus.syllabus.collections.AdminActionStackService;
import bd.ac.uiu.smartcampus.syllabus.collections.ComplaintQueueService;
import bd.ac.uiu.smartcampus.syllabus.collections.UniqueAttendeeSetService;
import bd.ac.uiu.smartcampus.syllabus.concurrency.CampusSimulationWorker;
import bd.ac.uiu.smartcampus.syllabus.networking.BusServerSocketManager;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

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
    private final ClassroomRepository classroomRepository;

    public DashboardController(UserRepository userRepository,
                               CampusNoticeRepository noticeRepository,
                               MaintenanceComplaintRepository complaintRepository,
                               AdminActionStackService actionStackService,
                               ComplaintQueueService complaintQueueService,
                               UniqueAttendeeSetService attendeeSetService,
                               CampusSimulationWorker simulationWorker,
                               BusServerSocketManager busServerManager,
                               ClassroomRepository classroomRepository) {
        this.userRepository = userRepository;
        this.noticeRepository = noticeRepository;
        this.complaintRepository = complaintRepository;
        this.actionStackService = actionStackService;
        this.complaintQueueService = complaintQueueService;
        this.attendeeSetService = attendeeSetService;
        this.simulationWorker = simulationWorker;
        this.busServerManager = busServerManager;
        this.classroomRepository = classroomRepository;
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

        return "forward:/app/index.html";
    }

    @GetMapping("/teacher")
    public String teacherDashboard(@AuthenticationPrincipal CustomUserDetails userDetails, Model model) {
        addUserAttributes(model, userDetails);

        CampusTelemetryDto telemetry = simulationWorker.getLatestTelemetry();
        model.addAttribute("telemetry", telemetry);
        model.addAttribute("notices", noticeRepository.findTop10ByOrderByPostedAtDesc());

        model.addAttribute("classrooms", classroomRepository.findAllByOrderByFloorAscRoomNumberAsc());

        return "forward:/app/index.html";
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

        return "forward:/app/index.html";
    }

    @GetMapping("/security")
    public String securityDashboard(@AuthenticationPrincipal CustomUserDetails userDetails, Model model) {
        addUserAttributes(model, userDetails);

        CampusTelemetryDto telemetry = simulationWorker.getLatestTelemetry();
        model.addAttribute("telemetry", telemetry);
        model.addAttribute("uniqueGatePassCount", attendeeSetService.getUniqueCount());
        model.addAttribute("busLocations", busServerManager.getLatestBusLocations());
        model.addAttribute("notices", noticeRepository.findTop10ByOrderByPostedAtDesc());

        return "forward:/app/index.html";
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

}
