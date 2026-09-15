package bd.ac.uiu.smartcampus.controller;

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
    public ResponseEntity<List<TeachingScheduleResponse>> getAllSchedules() {
        return ResponseEntity.ok(scheduleService.getAllSchedules());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TeachingScheduleResponse> getSchedule(@PathVariable Long id) {
        return ResponseEntity.ok(scheduleService.getScheduleById(id));
    }

    @PostMapping
    public ResponseEntity<TeachingScheduleResponse> createSchedule(@Valid @RequestBody TeachingScheduleRequest request, Principal principal) {
        return ResponseEntity.ok(scheduleService.createSchedule(request, principal.getName()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TeachingScheduleResponse> updateSchedule(@PathVariable Long id, @Valid @RequestBody TeachingScheduleRequest request, Principal principal) {
        return ResponseEntity.ok(scheduleService.updateSchedule(id, request, principal.getName()));
    }
}
