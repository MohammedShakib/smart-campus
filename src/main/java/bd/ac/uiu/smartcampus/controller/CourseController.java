package bd.ac.uiu.smartcampus.controller;

import bd.ac.uiu.smartcampus.dto.CourseDto;
import bd.ac.uiu.smartcampus.service.CourseService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/courses")
@PreAuthorize("hasRole('ADMIN')")
public class CourseController {

    private final CourseService courseService;

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @GetMapping
    public ResponseEntity<List<CourseDto>> getAllCourses() {
        return ResponseEntity.ok(courseService.getAllCourses());
    }

    @PostMapping
    public ResponseEntity<CourseDto> createCourse(@RequestBody CourseDto request, Authentication authentication) {
        return ResponseEntity.ok(courseService.createCourse(request, authentication.getName()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CourseDto> updateCourse(@PathVariable Long id, @RequestBody CourseDto request, Authentication authentication) {
        return ResponseEntity.ok(courseService.updateCourse(id, request, authentication.getName()));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<CourseDto> toggleStatus(@PathVariable Long id, @RequestBody Map<String, Boolean> payload, Authentication authentication) {
        return ResponseEntity.ok(courseService.toggleStatus(id, payload.get("active"), authentication.getName()));
    }
}
