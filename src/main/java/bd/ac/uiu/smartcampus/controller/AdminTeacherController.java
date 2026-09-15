package bd.ac.uiu.smartcampus.controller;

import bd.ac.uiu.smartcampus.dto.AdminTeacherDetailDto;
import bd.ac.uiu.smartcampus.dto.AdminTeacherDto;
import bd.ac.uiu.smartcampus.dto.AdminTeacherUpdateRequest;
import bd.ac.uiu.smartcampus.service.AdminTeacherService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/teachers")
@PreAuthorize("hasRole('ROLE_ADMIN')")
public class AdminTeacherController {

    private final AdminTeacherService adminTeacherService;

    public AdminTeacherController(AdminTeacherService adminTeacherService) {
        this.adminTeacherService = adminTeacherService;
    }

    @GetMapping
    public ResponseEntity<List<AdminTeacherDto>> searchTeachers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String department) {
        return ResponseEntity.ok(adminTeacherService.searchTeachers(search, active, department));
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getTeacherSummary() {
        return ResponseEntity.ok(adminTeacherService.getTeacherSummary());
    }

    @GetMapping("/departments")
    public ResponseEntity<List<String>> getTeacherDepartments() {
        return ResponseEntity.ok(adminTeacherService.getTeacherDepartments());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminTeacherDetailDto> getTeacherDetail(@PathVariable Long id) {
        return ResponseEntity.ok(adminTeacherService.getTeacherDetail(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AdminTeacherDetailDto> updateTeacherProfile(
            @PathVariable Long id,
            @RequestBody AdminTeacherUpdateRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(adminTeacherService.updateTeacherProfile(id, request, authentication.getName()));
    }

    @PostMapping("/{id}/status")
    public ResponseEntity<Void> toggleTeacherStatus(
            @PathVariable Long id,
            @RequestParam boolean active,
            Authentication authentication) {
        adminTeacherService.toggleTeacherStatus(id, active, authentication.getName());
        return ResponseEntity.ok().build();
    }
}
