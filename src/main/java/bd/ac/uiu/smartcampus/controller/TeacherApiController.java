package bd.ac.uiu.smartcampus.controller;

import bd.ac.uiu.smartcampus.dto.*;
import bd.ac.uiu.smartcampus.model.*;
import bd.ac.uiu.smartcampus.repository.CampusNoticeRepository;
import bd.ac.uiu.smartcampus.repository.UserRepository;
import bd.ac.uiu.smartcampus.security.CustomUserDetails;
import bd.ac.uiu.smartcampus.service.FacultyOfficeHourService;
import bd.ac.uiu.smartcampus.service.NotificationService;
import bd.ac.uiu.smartcampus.service.StudentPortalService;
import bd.ac.uiu.smartcampus.service.TeacherDashboardService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/teacher")
public class TeacherApiController {

    private final TeacherDashboardService teacherService;
    private final CampusNoticeRepository noticeRepository;
    private final StudentPortalService studentPortalService;
    private final FacultyOfficeHourService officeHourService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public TeacherApiController(TeacherDashboardService teacherService,
                                CampusNoticeRepository noticeRepository,
                                StudentPortalService studentPortalService,
                                FacultyOfficeHourService officeHourService,
                                NotificationService notificationService,
                                UserRepository userRepository) {
        this.teacherService = teacherService;
        this.noticeRepository = noticeRepository;
        this.studentPortalService = studentPortalService;
        this.officeHourService = officeHourService;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    // ─────────────────────────────────────────────────────────
    // SCHEDULE & CLASSES
    // ─────────────────────────────────────────────────────────

    @GetMapping("/schedule")
    public ApiResponse<List<Map<String, Object>>> schedule(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.ok("Teacher schedule", teacherService.getSchedulePayloads(userDetails.getUsername()));
    }

    @GetMapping("/classes")
    public ApiResponse<List<Map<String, Object>>> classes(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.ok("Teacher classes", teacherService.getTeacherClasses(userDetails.getUsername()));
    }

    @PostMapping("/classes/{id}/start")
    public ApiResponse<Map<String, Object>> startClass(@PathVariable Long id,
                                                       @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.ok("Class started", teacherService.classSessionPayload(teacherService.startClass(id, userDetails.getUsername())));
    }

    @PostMapping("/classes/{id}/end")
    public ApiResponse<Map<String, Object>> endClass(@PathVariable Long id,
                                                     @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.ok("Class ended", teacherService.classSessionPayload(teacherService.endClass(id, userDetails.getUsername())));
    }

    // ─────────────────────────────────────────────────────────
    // ROSTER
    // ─────────────────────────────────────────────────────────

    /**
     * GET /api/teacher/roster/classes
     * Returns distinct course/section pairs the teacher has enrolled students in.
     */
    @GetMapping("/roster/classes")
    public ApiResponse<List<TeacherClassSummaryDto>> rosterClasses(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.ok("Roster classes",
                teacherService.getRosterClasses(userDetails.getUsername()));
    }

    /**
     * GET /api/teacher/roster?courseCode=CSE2211&section=Section A
     * Returns enrolled students with attendance stats for a specific class.
     */
    @GetMapping("/roster")
    public ApiResponse<List<RosterStudentDto>> roster(
            @RequestParam String courseCode,
            @RequestParam String section,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.ok("Class roster",
                teacherService.getRosterStudents(userDetails.getUsername(), courseCode, section));
    }

    /**
     * GET /api/teacher/roster/session/{sessionId}/students
     * Returns enrolled students for the active session's class — used for manual attendance dropdown.
     */
    @GetMapping("/roster/session/{sessionId}/students")
    public ApiResponse<List<Map<String, String>>> sessionStudents(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.ok("Session enrolled students",
                teacherService.getEnrolledStudentsForSession(sessionId, userDetails.getUsername()));
    }

    // ─────────────────────────────────────────────────────────
    // ATTENDANCE — session management
    // ─────────────────────────────────────────────────────────

    @GetMapping("/attendance")
    public ApiResponse<List<Map<String, Object>>> attendance(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.ok("Attendance sessions", teacherService.getAttendanceSessions(userDetails.getUsername()));
    }

    @PostMapping("/attendance/start")
    public ApiResponse<Map<String, Object>> startAttendance(@RequestParam Long scheduleId,
                                                            @AuthenticationPrincipal CustomUserDetails userDetails) {
        AttendanceSession session = teacherService.startAttendance(scheduleId, userDetails.getUsername());
        return ApiResponse.ok("Attendance session started", teacherService.attendancePayload(session));
    }

    @PostMapping("/attendance/{id}/end")
    public ApiResponse<Map<String, Object>> endAttendance(@PathVariable Long id,
                                                          @AuthenticationPrincipal CustomUserDetails userDetails) {
        AttendanceSession session = teacherService.endAttendance(id, userDetails.getUsername());
        return ApiResponse.ok("Attendance session ended", teacherService.attendancePayload(session));
    }

    @PostMapping("/attendance/{id}/records")
    public ApiResponse<AttendanceRecord> markAttendance(@PathVariable Long id,
                                                        @RequestBody AttendanceRecordRequest request,
                                                        @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.ok("Attendance record saved",
                teacherService.markAttendance(id, userDetails.getUsername(), request));
    }

    // ─────────────────────────────────────────────────────────
    // ATTENDANCE HISTORY
    // ─────────────────────────────────────────────────────────

    /**
     * GET /api/teacher/attendance/history?courseCode=&section=
     * Returns completed attendance sessions. Optional course/section filters.
     * Only returns sessions belonging to the authenticated teacher.
     */
    @GetMapping("/attendance/history")
    public ApiResponse<List<AttendanceHistoryDto>> attendanceHistory(
            @RequestParam(required = false) String courseCode,
            @RequestParam(required = false) String section,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.ok("Attendance history",
                teacherService.getAttendanceHistory(userDetails.getUsername(), courseCode, section));
    }

    /**
     * GET /api/teacher/attendance/history/{sessionId}
     * Returns detailed student records for a specific completed session.
     * Validates that the session belongs to the authenticated teacher.
     */
    @GetMapping("/attendance/history/{sessionId}")
    public ApiResponse<AttendanceSessionDetailDto> attendanceHistoryDetail(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.ok("Attendance session detail",
                teacherService.getAttendanceHistoryDetail(sessionId, userDetails.getUsername()));
    }

    // ─────────────────────────────────────────────────────────
    // ABSENCE EXCUSE REVIEWS
    // ─────────────────────────────────────────────────────────

    @GetMapping("/excuses")
    public ApiResponse<List<AbsenceExcuse>> getExcuses(@AuthenticationPrincipal CustomUserDetails userDetails) {
        String teacherEmail = userDetails != null ? userDetails.getUsername() : "teacher-demo";
        return ApiResponse.ok("Student absence excuses", studentPortalService.getTeacherExcuses(teacherEmail));
    }

    @PostMapping("/excuses/{id}/review")
    public ApiResponse<AbsenceExcuse> reviewExcuse(@PathVariable Long id,
                                                   @RequestParam String status,
                                                   @RequestParam(required = false, defaultValue = "") String remarks,
                                                   @AuthenticationPrincipal CustomUserDetails userDetails) {
        String teacherEmail = userDetails != null ? userDetails.getUsername() : "teacher-demo";
        return ApiResponse.ok("Excuse reviewed", studentPortalService.reviewExcuse(id, teacherEmail, status, remarks));
    }

    // ─────────────────────────────────────────────────────────
    // FACULTY OFFICE HOURS & PRE-SUBMITTED QUERIES
    // ─────────────────────────────────────────────────────────

    @GetMapping("/office-hours/slots")
    public ApiResponse<List<FacultyOfficeHourSlot>> getOfficeHourSlots(@AuthenticationPrincipal CustomUserDetails userDetails) {
        String teacherEmail = userDetails != null ? userDetails.getUsername() : "teacher-demo";
        return ApiResponse.ok("Faculty office hour slots", officeHourService.getTeacherSlots(teacherEmail));
    }

    @PostMapping("/office-hours/slots")
    public ApiResponse<FacultyOfficeHourSlot> createOfficeHourSlot(@RequestBody OfficeHourSlotCreateRequest request,
                                                                   @AuthenticationPrincipal CustomUserDetails userDetails) {
        String teacherEmail = userDetails != null ? userDetails.getUsername() : "teacher-demo";
        return ApiResponse.ok("Office hour slot created", officeHourService.createSlot(teacherEmail, request));
    }

    @PostMapping("/office-hours/slots/{id}/status")
    public ApiResponse<FacultyOfficeHourSlot> updateOfficeHourSlotStatus(@PathVariable Long id,
                                                                         @RequestParam String status,
                                                                         @RequestParam(required = false) String feedback,
                                                                         @AuthenticationPrincipal CustomUserDetails userDetails) {
        String teacherEmail = userDetails != null ? userDetails.getUsername() : "teacher-demo";
        FacultyOfficeHourSlot.SlotStatus slotStatus = FacultyOfficeHourSlot.SlotStatus.valueOf(status.toUpperCase());
        return ApiResponse.ok("Slot status updated", officeHourService.updateSlotStatus(id, teacherEmail, slotStatus, feedback));
    }

    // ─────────────────────────────────────────────────────────
    // ROOM RESERVATIONS
    // ─────────────────────────────────────────────────────────

    @GetMapping("/reservations")
    public ApiResponse<List<Map<String, Object>>> reservations(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.ok("Teacher reservations", teacherService.getReservations(userDetails.getUsername()));
    }

    @PostMapping("/reservations")
    public ApiResponse<RoomReservation> reserve(@RequestBody RoomReservationRequest request,
                                                @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.ok("Room reserved", teacherService.reserveRoom(userDetails.getUsername(), request));
    }

    @GetMapping("/rooms/available")
    public ApiResponse<List<ClassroomDto>> availableRooms(@RequestParam String date,
                                                          @RequestParam String startTime,
                                                          @RequestParam String endTime) {
        return ApiResponse.ok(
                "Available classrooms",
                teacherService.availableRooms(
                        LocalDate.parse(date), LocalTime.parse(startTime), LocalTime.parse(endTime))
        );
    }

    // ─────────────────────────────────────────────────────────
    // ANNOUNCEMENTS
    // ─────────────────────────────────────────────────────────

    @PostMapping("/announcements")
    public ApiResponse<CampusNotice> publishAnnouncement(@RequestBody TeacherNoticeRequest request,
                                                         @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (request.getTitle() == null || request.getTitle().isBlank()
                || request.getContent() == null || request.getContent().isBlank()) {
            return ApiResponse.error("Title and message are required.");
        }
        CampusNotice notice = new CampusNotice(
                request.getTitle().trim(),
                request.getContent().trim(),
                "ACADEMIC",
                "MEDIUM",
                userDetails.getFullName()
        );
        CampusNotice savedNotice = noticeRepository.save(notice);
        
        // Notify all teachers (except publisher, if we want, but simple is all)
        List<User> teachers = userRepository.findByRole(Role.ROLE_TEACHER);
        for (User teacher : teachers) {
            notificationService.createNotification(
                    teacher,
                    NotificationType.ANNOUNCEMENT,
                    "New academic announcement",
                    savedNotice.getTitle(),
                    "notices",
                    savedNotice.getId().toString(),
                    "ANNOUNCEMENT:" + savedNotice.getId() + ":" + teacher.getId()
            );
        }
        
        return ApiResponse.ok("Academic announcement published", savedNotice);
    }

    // ─────────────────────────────────────────────────────────
    // EXCEPTION HANDLER
    // ─────────────────────────────────────────────────────────

    @GetMapping("/issues")
    public ApiResponse<List<TeacherIssueDto>> getTeacherIssues(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.ok("Teacher issues", teacherService.getTeacherIssues(userDetails));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadRequest(IllegalArgumentException exception) {
        return ResponseEntity.badRequest().body(ApiResponse.error(exception.getMessage()));
    }
}
