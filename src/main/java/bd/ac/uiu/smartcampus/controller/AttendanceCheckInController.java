package bd.ac.uiu.smartcampus.controller;

import bd.ac.uiu.smartcampus.dto.ApiResponse;
import bd.ac.uiu.smartcampus.model.AttendanceRecord;
import bd.ac.uiu.smartcampus.security.CustomUserDetails;
import bd.ac.uiu.smartcampus.service.TeacherDashboardService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceCheckInController {

    private final TeacherDashboardService teacherDashboardService;

    public AttendanceCheckInController(TeacherDashboardService teacherDashboardService) {
        this.teacherDashboardService = teacherDashboardService;
    }

    @PostMapping("/checkin")
    public ApiResponse<AttendanceRecord> checkIn(@RequestParam String token,
                                                 @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.ok("Attendance check-in recorded", teacherDashboardService.checkInWithToken(token, userDetails));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ApiResponse<Void> handleBadRequest(IllegalArgumentException exception) {
        return ApiResponse.error(exception.getMessage());
    }
}
