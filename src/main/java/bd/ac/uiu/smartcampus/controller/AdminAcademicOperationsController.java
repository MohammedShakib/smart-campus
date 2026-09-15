package bd.ac.uiu.smartcampus.controller;

import bd.ac.uiu.smartcampus.dto.AttendanceHistoryDto;
import bd.ac.uiu.smartcampus.service.AdminAcademicOperationsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/academic-operations")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAcademicOperationsController {

    private final AdminAcademicOperationsService operationsService;

    public AdminAcademicOperationsController(AdminAcademicOperationsService operationsService) {
        this.operationsService = operationsService;
    }

    @GetMapping("/active-classes")
    public ResponseEntity<List<Map<String, Object>>> getActiveClasses() {
        return ResponseEntity.ok(operationsService.getActiveClasses());
    }

    @GetMapping("/attendance")
    public ResponseEntity<List<AttendanceHistoryDto>> getAttendanceSessions() {
        return ResponseEntity.ok(operationsService.getAllAttendanceSessions());
    }

    @GetMapping("/reservations")
    public ResponseEntity<List<Map<String, Object>>> getReservations() {
        return ResponseEntity.ok(operationsService.getAllReservations());
    }

    @PatchMapping("/reservations/{id}/status")
    public ResponseEntity<Map<String, Object>> updateReservationStatus(@PathVariable Long id, @RequestBody Map<String, String> request, Principal principal) {
        String status = request.get("status");
        return ResponseEntity.ok(operationsService.updateReservationStatus(id, status, principal.getName()));
    }
}
