package bd.ac.uiu.smartcampus.controller;

import bd.ac.uiu.smartcampus.dto.*;
import bd.ac.uiu.smartcampus.model.*;
import bd.ac.uiu.smartcampus.repository.CampusNoticeRepository;
import bd.ac.uiu.smartcampus.security.CustomUserDetails;
import bd.ac.uiu.smartcampus.service.TeacherDashboardService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/teacher")
public class TeacherApiController {

    private final TeacherDashboardService teacherService;
    private final CampusNoticeRepository noticeRepository;

    public TeacherApiController(TeacherDashboardService teacherService,
                                CampusNoticeRepository noticeRepository) {
        this.teacherService = teacherService;
        this.noticeRepository = noticeRepository;
    }

    @GetMapping("/schedule")
    public ApiResponse<List<TeachingSchedule>> schedule(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.ok("Teacher schedule", teacherService.getSchedule(userDetails.getUsername()));
    }

    @GetMapping("/classes")
    public ApiResponse<List<java.util.Map<String, Object>>> classes(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.ok("Teacher classes", teacherService.getTeacherClasses(userDetails.getUsername()));
    }

    @PostMapping("/classes/{id}/start")
    public ApiResponse<ClassSession> startClass(@PathVariable Long id,
                                                @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.ok("Class started", teacherService.startClass(id, userDetails.getUsername()));
    }

    @PostMapping("/classes/{id}/end")
    public ApiResponse<ClassSession> endClass(@PathVariable Long id,
                                              @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.ok("Class ended", teacherService.endClass(id, userDetails.getUsername()));
    }

    @GetMapping("/attendance")
    public ApiResponse<List<java.util.Map<String, Object>>> attendance(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.ok("Attendance sessions", teacherService.getAttendanceSessions(userDetails.getUsername()));
    }

    @PostMapping("/attendance/start")
    public ApiResponse<java.util.Map<String, Object>> startAttendance(@RequestParam Long scheduleId,
                                                                      @AuthenticationPrincipal CustomUserDetails userDetails) {
        AttendanceSession session = teacherService.startAttendance(scheduleId, userDetails.getUsername());
        return ApiResponse.ok("Attendance session started", teacherService.attendancePayload(session));
    }

    @PostMapping("/attendance/{id}/end")
    public ApiResponse<java.util.Map<String, Object>> endAttendance(@PathVariable Long id,
                                                                    @AuthenticationPrincipal CustomUserDetails userDetails) {
        AttendanceSession session = teacherService.endAttendance(id, userDetails.getUsername());
        return ApiResponse.ok("Attendance session ended", teacherService.attendancePayload(session));
    }

    @PostMapping("/attendance/{id}/records")
    public ApiResponse<AttendanceRecord> markAttendance(@PathVariable Long id,
                                                        @RequestBody AttendanceRecordRequest request,
                                                        @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.ok("Attendance record saved", teacherService.markAttendance(id, userDetails.getUsername(), request));
    }

    @GetMapping("/reservations")
    public ApiResponse<List<RoomReservation>> reservations(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.ok("Teacher reservations", teacherService.getReservations(userDetails.getUsername()));
    }

    @PostMapping("/reservations")
    public ApiResponse<RoomReservation> reserve(@RequestBody RoomReservationRequest request,
                                                @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.ok("Room reserved", teacherService.reserveRoom(userDetails.getUsername(), request));
    }

    @GetMapping("/rooms/available")
    public ApiResponse<List<Classroom>> availableRooms(@RequestParam String date,
                                                       @RequestParam String startTime,
                                                       @RequestParam String endTime) {
        return ApiResponse.ok(
                "Available classrooms",
                teacherService.availableRooms(LocalDate.parse(date), LocalTime.parse(startTime), LocalTime.parse(endTime))
        );
    }

    @PostMapping("/announcements")
    public ApiResponse<CampusNotice> publishAnnouncement(@RequestBody TeacherNoticeRequest request,
                                                         @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (request.getTitle() == null || request.getTitle().isBlank() || request.getContent() == null || request.getContent().isBlank()) {
            return ApiResponse.error("Title and message are required.");
        }
        CampusNotice notice = new CampusNotice(
                request.getTitle().trim(),
                request.getContent().trim(),
                "ACADEMIC",
                "MEDIUM",
                userDetails.getFullName()
        );
        return ApiResponse.ok("Academic announcement published", noticeRepository.save(notice));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ApiResponse<Void> handleBadRequest(IllegalArgumentException exception) {
        return ApiResponse.error(exception.getMessage());
    }
}
