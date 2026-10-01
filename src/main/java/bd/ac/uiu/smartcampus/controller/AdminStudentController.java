package bd.ac.uiu.smartcampus.controller;

import bd.ac.uiu.smartcampus.dto.AdminStudentDetailDto;
import bd.ac.uiu.smartcampus.dto.AdminStudentDto;
import bd.ac.uiu.smartcampus.dto.AdminStudentEnrollmentRequest;
import bd.ac.uiu.smartcampus.dto.AdminStudentUpdateRequest;
import bd.ac.uiu.smartcampus.dto.TeachingScheduleResponse;
import bd.ac.uiu.smartcampus.service.AdminStudentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/students")
public class AdminStudentController {

    private final AdminStudentService studentService;

    public AdminStudentController(AdminStudentService studentService) {
        this.studentService = studentService;
    }

    @GetMapping
    public ResponseEntity<List<AdminStudentDto>> getStudents(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String department) {
        return ResponseEntity.ok(studentService.searchStudents(search, active, department));
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getStudentSummary() {
        return ResponseEntity.ok(studentService.getStudentSummary());
    }

    @GetMapping("/departments")
    public ResponseEntity<List<String>> getStudentDepartments() {
        return ResponseEntity.ok(studentService.getStudentDepartments());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminStudentDetailDto> getStudentDetail(@PathVariable Long id) {
        return ResponseEntity.ok(studentService.getStudentDetail(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AdminStudentDetailDto> updateStudentProfile(
            @PathVariable Long id,
            @RequestBody AdminStudentUpdateRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(studentService.updateStudentProfile(id, request, authentication.getName()));
    }

    @GetMapping("/{id}/enrollment-options")
    public ResponseEntity<List<TeachingScheduleResponse>> getEnrollmentOptions(@PathVariable Long id) {
        return ResponseEntity.ok(studentService.getAvailableEnrollmentOptions(id));
    }

    @PostMapping("/{id}/enrollments")
    public ResponseEntity<AdminStudentDetailDto> addEnrollment(
            @PathVariable Long id,
            @RequestBody AdminStudentEnrollmentRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(studentService.addEnrollment(id, request, authentication.getName()));
    }

    @DeleteMapping("/{id}/enrollments/{enrollmentId}")
    public ResponseEntity<AdminStudentDetailDto> removeEnrollment(
            @PathVariable Long id,
            @PathVariable Long enrollmentId,
            Authentication authentication) {
        return ResponseEntity.ok(studentService.removeEnrollment(id, enrollmentId, authentication.getName()));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Void> toggleStudentStatus(
            @PathVariable Long id,
            @RequestParam boolean active,
            Authentication authentication) {
        studentService.toggleStudentStatus(id, active, authentication.getName());
        return ResponseEntity.ok().build();
    }
}
