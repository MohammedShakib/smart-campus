package bd.ac.uiu.smartcampus.controller;

import bd.ac.uiu.smartcampus.dto.ClassroomDto;
import bd.ac.uiu.smartcampus.service.ClassroomAdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/classrooms")
@PreAuthorize("hasRole('ADMIN')")
public class ClassroomAdminController {

    private final ClassroomAdminService classroomAdminService;

    public ClassroomAdminController(ClassroomAdminService classroomAdminService) {
        this.classroomAdminService = classroomAdminService;
    }

    @GetMapping
    public ResponseEntity<List<ClassroomDto>> getAllClassrooms() {
        return ResponseEntity.ok(classroomAdminService.getAllClassrooms());
    }

    @PostMapping
    public ResponseEntity<ClassroomDto> createClassroom(@RequestBody ClassroomDto request, Authentication authentication) {
        return ResponseEntity.ok(classroomAdminService.createClassroom(request, authentication.getName()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClassroomDto> updateClassroom(@PathVariable Long id, @RequestBody ClassroomDto request, Authentication authentication) {
        return ResponseEntity.ok(classroomAdminService.updateClassroom(id, request, authentication.getName()));
    }
}
