package bd.ac.uiu.smartcampus.controller;

import bd.ac.uiu.smartcampus.dto.ApiResponse;
import bd.ac.uiu.smartcampus.dto.TeachingScheduleRequest;
import bd.ac.uiu.smartcampus.dto.TeachingScheduleResponse;
import bd.ac.uiu.smartcampus.service.AdminScheduleService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/admin/schedules")
@PreAuthorize("hasRole('ADMIN')")
public class AdminScheduleController {

    private final AdminScheduleService scheduleService;

    public AdminScheduleController(AdminScheduleService scheduleService) {
        this.scheduleService = scheduleService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TeachingScheduleResponse>>> getAllSchedules() {
        return ResponseEntity.ok(ApiResponse.ok("Fetched schedules", scheduleService.getAllSchedules()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TeachingScheduleResponse>> getSchedule(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Fetched schedule", scheduleService.getScheduleById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TeachingScheduleResponse>> createSchedule(@Valid @RequestBody TeachingScheduleRequest request, Principal principal) {
        return ResponseEntity.ok(ApiResponse.ok("Created schedule", scheduleService.createSchedule(request, principal.getName())));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TeachingScheduleResponse>> updateSchedule(@PathVariable Long id, @Valid @RequestBody TeachingScheduleRequest request, Principal principal) {
        return ResponseEntity.ok(ApiResponse.ok("Updated schedule", scheduleService.updateSchedule(id, request, principal.getName())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSchedule(@PathVariable Long id, Principal principal) {
        scheduleService.deleteSchedule(id, principal.getName());
        return ResponseEntity.ok(ApiResponse.ok("Deleted schedule", null));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<TeachingScheduleResponse>> updateScheduleStatus(@PathVariable Long id, @RequestBody java.util.Map<String, String> payload, Principal principal) {
        String statusStr = payload.get("status");
        bd.ac.uiu.smartcampus.model.ClassStatus status = bd.ac.uiu.smartcampus.model.ClassStatus.valueOf(statusStr);
        return ResponseEntity.ok(ApiResponse.ok("Updated schedule status", scheduleService.updateScheduleStatus(id, status, principal.getName())));
    }
}
