package bd.ac.uiu.smartcampus.controller;

import bd.ac.uiu.smartcampus.dto.ApiResponse;
import bd.ac.uiu.smartcampus.dto.PasswordChangeRequest;
import bd.ac.uiu.smartcampus.dto.ProfileUpdateRequest;
import bd.ac.uiu.smartcampus.dto.RegisterRequest;
import bd.ac.uiu.smartcampus.model.Role;
import bd.ac.uiu.smartcampus.model.User;
import bd.ac.uiu.smartcampus.security.CustomUserDetails;
import bd.ac.uiu.smartcampus.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthApiController {

    private final AuthService authService;

    public AuthApiController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/me")
    public ApiResponse<Map<String, Object>> currentUser(@AuthenticationPrincipal CustomUserDetails userDetails,
                                                        Authentication authentication) {
        Map<String, Object> payload = new LinkedHashMap<>();
        boolean authenticated = authentication != null
                && authentication.isAuthenticated()
                && !"anonymousUser".equals(authentication.getPrincipal());

        payload.put("authenticated", authenticated);
        payload.put("roles", roleOptions());

        if (authenticated && userDetails != null) {
            payload.put("fullName", userDetails.getFullName());
            payload.put("email", userDetails.getUsername());
            payload.put("role", userDetails.getRoleName());
            payload.put("department", userDetails.getDepartment());
            payload.put("studentOrEmpId", userDetails.getStudentOrEmpId());
            payload.put("profileImageUrl", userDetails.getUser().getProfileImageUrl());
            payload.put("dashboardPath", dashboardPath(userDetails.getRoleName()));
        }

        return ApiResponse.ok("Current Smart Campus session", payload);
    }

    @PostMapping("/profile")
    public ApiResponse<Map<String, Object>> updateProfile(@Valid @RequestBody ProfileUpdateRequest request,
                                                          BindingResult bindingResult,
                                                          @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (bindingResult.hasErrors()) {
            return ApiResponse.error(bindingResult.getAllErrors().get(0).getDefaultMessage());
        }
        if (userDetails == null) {
            return ApiResponse.error("Please sign in to update your profile.");
        }

        User user = authService.updateProfileImage(userDetails.getUsername(), request.getProfileImageUrl());
        return ApiResponse.ok("Profile photo updated.", userPayload(user));
    }

    @PostMapping("/password")
    public ApiResponse<Map<String, Object>> changePassword(@Valid @RequestBody PasswordChangeRequest request,
                                                           BindingResult bindingResult,
                                                           @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (bindingResult.hasErrors()) {
            return ApiResponse.error(bindingResult.getAllErrors().get(0).getDefaultMessage());
        }
        if (userDetails == null) {
            return ApiResponse.error("Please sign in to change your password.");
        }

        try {
            authService.changePassword(userDetails.getUsername(), request.getCurrentPassword(), request.getNewPassword());
            return ApiResponse.ok("Password changed successfully.", Map.of("changed", true));
        } catch (IllegalArgumentException ex) {
            return ApiResponse.error(ex.getMessage());
        }
    }

    @PostMapping("/register")
    public ApiResponse<Map<String, Object>> register(@Valid @RequestBody RegisterRequest request,
                                                     BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            return ApiResponse.error(bindingResult.getAllErrors().get(0).getDefaultMessage());
        }

        try {
            User user = authService.registerUser(request);
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("email", user.getEmail());
            payload.put("fullName", user.getFullName());
            payload.put("role", user.getRole().name());
            return ApiResponse.ok("Account created successfully. You can now sign in.", payload);
        } catch (IllegalArgumentException ex) {
            return ApiResponse.error(ex.getMessage());
        }
    }

    private List<Map<String, String>> roleOptions() {
        return Arrays.stream(Role.values())
                .map(role -> Map.of(
                        "value", role.name(),
                        "label", role.getDisplayName()
                ))
                .toList();
    }

    private String dashboardPath(String roleName) {
        return switch (roleName) {
            case "ROLE_ADMIN" -> "/dashboard/admin";
            case "ROLE_TEACHER" -> "/dashboard/teacher";
            case "ROLE_SECURITY" -> "/dashboard/security";
            default -> "/dashboard/student";
        };
    }

    private Map<String, Object> userPayload(User user) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("fullName", user.getFullName());
        payload.put("email", user.getEmail());
        payload.put("role", user.getRole().name());
        payload.put("department", user.getDepartment());
        payload.put("studentOrEmpId", user.getStudentOrEmpId());
        payload.put("profileImageUrl", user.getProfileImageUrl());
        payload.put("dashboardPath", dashboardPath(user.getRole().name()));
        return payload;
    }
}
