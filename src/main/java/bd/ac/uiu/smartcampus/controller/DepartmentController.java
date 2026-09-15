package bd.ac.uiu.smartcampus.controller;

import bd.ac.uiu.smartcampus.dto.DepartmentDto;
import bd.ac.uiu.smartcampus.service.DepartmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/departments")
@PreAuthorize("hasRole('ADMIN')")
public class DepartmentController {

    private final DepartmentService departmentService;

    public DepartmentController(DepartmentService departmentService) {
        this.departmentService = departmentService;
    }

    @GetMapping
    public ResponseEntity<List<DepartmentDto>> getAllDepartments() {
        return ResponseEntity.ok(departmentService.getAllDepartments());
    }

    @PostMapping
    public ResponseEntity<DepartmentDto> createDepartment(@RequestBody DepartmentDto request, Authentication authentication) {
        return ResponseEntity.ok(departmentService.createDepartment(request, authentication.getName()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DepartmentDto> updateDepartment(@PathVariable Long id, @RequestBody DepartmentDto request, Authentication authentication) {
        return ResponseEntity.ok(departmentService.updateDepartment(id, request, authentication.getName()));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<DepartmentDto> toggleStatus(@PathVariable Long id, @RequestBody Map<String, Boolean> payload, Authentication authentication) {
        return ResponseEntity.ok(departmentService.toggleStatus(id, payload.get("active"), authentication.getName()));
    }
}
