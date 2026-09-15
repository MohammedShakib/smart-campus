package bd.ac.uiu.smartcampus.controller;

import bd.ac.uiu.smartcampus.dto.AdminUserCreateRequest;
import bd.ac.uiu.smartcampus.dto.AdminUserDto;
import bd.ac.uiu.smartcampus.dto.AdminUserUpdateRequest;
import bd.ac.uiu.smartcampus.model.Role;
import bd.ac.uiu.smartcampus.service.AdminUserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    public ResponseEntity<List<AdminUserDto>> searchUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) Boolean status) {
        return ResponseEntity.ok(adminUserService.searchUsers(search, role, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminUserDto> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(adminUserService.getUserById(id));
    }

    @PostMapping
    public ResponseEntity<?> createUser(
            @Valid @RequestBody AdminUserCreateRequest request,
            Authentication authentication) {
        AdminUserDto createdUser = adminUserService.createUser(request, authentication.getName());
        return ResponseEntity.ok(Map.of("success", true, "message", "User created successfully", "data", createdUser));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody AdminUserUpdateRequest request,
            Authentication authentication) {
        AdminUserDto updatedUser = adminUserService.updateUser(id, request, authentication.getName());
        return ResponseEntity.ok(Map.of("success", true, "message", "User updated successfully", "data", updatedUser));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> toggleUserStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> request,
            Authentication authentication) {
        if (!request.containsKey("active") || request.get("active") == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Missing 'active' field"));
        }
        adminUserService.toggleUserStatus(id, request.get("active"), authentication.getName());
        return ResponseEntity.ok(Map.of("success", true, "message", "User status updated successfully"));
    }
}
