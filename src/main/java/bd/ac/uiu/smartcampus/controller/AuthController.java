package bd.ac.uiu.smartcampus.controller;

import bd.ac.uiu.smartcampus.dto.RegisterRequest;
import bd.ac.uiu.smartcampus.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/")
    public String rootRedirect(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated()) {
            return "redirect:/dashboard/student";
        }
        return "redirect:/login";
    }

    @GetMapping("/login")
    public String showLoginPage(@RequestParam(value = "error", required = false) String error,
                                @RequestParam(value = "logout", required = false) String logout,
                                @RequestParam(value = "registered", required = false) String registered,
                                Model model,
                                Authentication authentication) {
        // If already logged in, redirect to appropriate role dashboard
        if (authentication != null && authentication.isAuthenticated() && !authentication.getPrincipal().equals("anonymousUser")) {
            return "redirect:/dashboard/student";
        }

        if (error != null) {
            model.addAttribute("errorMessage", "Invalid email/ID or password. Please try again or use Quick Demo Login.");
        }
        if (logout != null) {
            model.addAttribute("successMessage", "You have been logged out securely from Smart Campus.");
        }
        if (registered != null) {
            model.addAttribute("successMessage", "Account created successfully! You can now log in.");
        }

        return "forward:/app/index.html";
    }

    @PostMapping("/register")
    public String processRegistration(@Valid @ModelAttribute("registerRequest") RegisterRequest registerRequest,
                                      BindingResult bindingResult,
                                      Model model) {
        if (bindingResult.hasErrors()) {
            return "redirect:/login?error=true";
        }

        try {
            authService.registerUser(registerRequest);
            return "redirect:/login?registered=true";
        } catch (IllegalArgumentException e) {
            return "redirect:/login?error=true";
        }
    }
}
