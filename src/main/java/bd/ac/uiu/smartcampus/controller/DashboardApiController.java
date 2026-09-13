package bd.ac.uiu.smartcampus.controller;

import bd.ac.uiu.smartcampus.dto.ApiResponse;
import bd.ac.uiu.smartcampus.dto.CampusTelemetryDto;
import bd.ac.uiu.smartcampus.model.Role;
import bd.ac.uiu.smartcampus.repository.CampusNoticeRepository;
import bd.ac.uiu.smartcampus.repository.MaintenanceComplaintRepository;
import bd.ac.uiu.smartcampus.repository.UserRepository;
import bd.ac.uiu.smartcampus.security.CustomUserDetails;
import bd.ac.uiu.smartcampus.service.TeacherDashboardService;
import bd.ac.uiu.smartcampus.syllabus.collections.AdminActionStackService;
import bd.ac.uiu.smartcampus.syllabus.collections.ClassroomModel;
import bd.ac.uiu.smartcampus.syllabus.collections.ComplaintQueueService;
import bd.ac.uiu.smartcampus.syllabus.collections.UniqueAttendeeSetService;
import bd.ac.uiu.smartcampus.syllabus.concurrency.CampusSimulationWorker;
import bd.ac.uiu.smartcampus.syllabus.networking.BusServerSocketManager;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardApiController {

    private final UserRepository userRepository;
    private final CampusNoticeRepository noticeRepository;
    private final MaintenanceComplaintRepository complaintRepository;
    private final AdminActionStackService actionStackService;
    private final ComplaintQueueService complaintQueueService;
    private final UniqueAttendeeSetService attendeeSetService;
    private final CampusSimulationWorker simulationWorker;
    private final BusServerSocketManager busServerManager;
    private final TeacherDashboardService teacherDashboardService;

    public DashboardApiController(UserRepository userRepository,
                                  CampusNoticeRepository noticeRepository,
                                  MaintenanceComplaintRepository complaintRepository,
                                  AdminActionStackService actionStackService,
                                  ComplaintQueueService complaintQueueService,
                                  UniqueAttendeeSetService attendeeSetService,
                                  CampusSimulationWorker simulationWorker,
                                  BusServerSocketManager busServerManager,
                                  TeacherDashboardService teacherDashboardService) {
        this.userRepository = userRepository;
        this.noticeRepository = noticeRepository;
        this.complaintRepository = complaintRepository;
        this.actionStackService = actionStackService;
        this.complaintQueueService = complaintQueueService;
        this.attendeeSetService = attendeeSetService;
        this.simulationWorker = simulationWorker;
        this.busServerManager = busServerManager;
        this.teacherDashboardService = teacherDashboardService;
    }

    @GetMapping("/admin")
    public ApiResponse<Map<String, Object>> admin(@AuthenticationPrincipal CustomUserDetails userDetails) {
        Map<String, Object> data = basePayload(userDetails, "admin");
        data.put("totalUsers", userRepository.count());
        data.put("totalStudents", userRepository.countByRole(Role.ROLE_STUDENT));
        data.put("totalTeachers", userRepository.countByRole(Role.ROLE_TEACHER));
        data.put("totalSecurity", userRepository.countByRole(Role.ROLE_SECURITY));
        data.put("actionStackHistory", actionStackService.getRecentStackHistory());
        data.put("actionStackSize", actionStackService.getStackSize());
        data.put("queuedComplaints", complaintQueueService.getQueuedComplaints());
        data.put("queueSize", complaintQueueService.getQueueSize());
        data.put("uniqueAttendeesCount", attendeeSetService.getUniqueCount());
        data.put("busLocations", busServerManager.getLatestBusLocations());
        data.put("notices", noticeRepository.findTop10ByOrderByPostedAtDesc());
        return ApiResponse.ok("Admin dashboard data", data);
    }

    @GetMapping("/teacher")
    public ApiResponse<Map<String, Object>> teacher(@AuthenticationPrincipal CustomUserDetails userDetails) {
        Map<String, Object> data = basePayload(userDetails, "teacher");
        String teacherEmail = userDetails != null ? userDetails.getUsername() : "teacher-demo";
        data.put("notices", noticeRepository.findTop10ByOrderByPostedAtDesc());
        data.put("classrooms", teacherDashboardService.getClassrooms());
        data.put("schedule", teacherDashboardService.getSchedule(teacherEmail));
        data.put("classes", teacherDashboardService.getTeacherClasses(teacherEmail));
        data.put("attendanceSessions", teacherDashboardService.getAttendanceSessions(teacherEmail));
        data.put("reservations", teacherDashboardService.getReservations(teacherEmail));
        teacherDashboardService.getNextClass(teacherEmail).ifPresent(next -> data.put("nextClass", next));
        return ApiResponse.ok("Faculty dashboard data", data);
    }

    @GetMapping("/student")
    public ApiResponse<Map<String, Object>> student(@AuthenticationPrincipal CustomUserDetails userDetails) {
        Map<String, Object> data = basePayload(userDetails, "student");
        String studentId = userDetails != null ? userDetails.getStudentOrEmpId() : "011211001";
        data.put("notices", noticeRepository.findTop10ByOrderByPostedAtDesc());
        data.put("busLocations", busServerManager.getLatestBusLocations());
        data.put("myComplaints", complaintRepository.findByStudentIdOrderByReportedAtDesc(studentId));
        return ApiResponse.ok("Student dashboard data", data);
    }

    @GetMapping("/security")
    public ApiResponse<Map<String, Object>> security(@AuthenticationPrincipal CustomUserDetails userDetails) {
        Map<String, Object> data = basePayload(userDetails, "security");
        data.put("uniqueGatePassCount", attendeeSetService.getUniqueCount());
        data.put("busLocations", busServerManager.getLatestBusLocations());
        data.put("notices", noticeRepository.findTop10ByOrderByPostedAtDesc());
        return ApiResponse.ok("Security dashboard data", data);
    }

    private Map<String, Object> basePayload(CustomUserDetails userDetails, String dashboard) {
        CampusTelemetryDto telemetry = simulationWorker.getLatestTelemetry();
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("projectName", "Smart Campus");
        data.put("dashboard", dashboard);
        data.put("telemetry", telemetry);
        data.put("user", userPayload(userDetails));
        return data;
    }

    private Map<String, Object> userPayload(CustomUserDetails userDetails) {
        Map<String, Object> user = new LinkedHashMap<>();
        if (userDetails == null) {
            return user;
        }
        user.put("fullName", userDetails.getFullName());
        user.put("email", userDetails.getUsername());
        user.put("role", userDetails.getRoleName());
        user.put("department", userDetails.getDepartment());
        user.put("studentOrEmpId", userDetails.getStudentOrEmpId());
        return user;
    }

    public static List<ClassroomModel> sampleClassrooms() {
        List<ClassroomModel> list = new ArrayList<>();
        list.add(new ClassroomModel("Room 524 (CSE Lab 4)", 60, 5, true, 3.8));
        list.add(new ClassroomModel("Room 522 (Theory)", 55, 5, false, 0.4));
        list.add(new ClassroomModel("Room 412 (Multimedia)", 70, 4, true, 4.2));
        list.add(new ClassroomModel("Room 301 (Auditorium)", 250, 3, true, 18.5));
        list.add(new ClassroomModel("Room 608 (Seminar)", 45, 6, false, 0.2));
        Collections.sort(list);
        return list;
    }
}
