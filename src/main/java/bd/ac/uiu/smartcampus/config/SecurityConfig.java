package bd.ac.uiu.smartcampus.config;

import bd.ac.uiu.smartcampus.security.CustomAuthenticationSuccessHandler;
import bd.ac.uiu.smartcampus.security.CustomUserDetailsService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;
    private final CustomAuthenticationSuccessHandler successHandler;
    private final boolean h2ConsoleEnabled;

    public SecurityConfig(CustomUserDetailsService userDetailsService,
                          CustomAuthenticationSuccessHandler successHandler,
                          @Value("${spring.h2.console.enabled:false}") boolean h2ConsoleEnabled) {
        this.userDetailsService = userDetailsService;
        this.successHandler = successHandler;
        this.h2ConsoleEnabled = h2ConsoleEnabled;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // Disabled for simple REST & prototype form submissions
            .authorizeHttpRequests(auth -> {
                // Static Assets & Public pages
                auth.requestMatchers("/app/**", "/css/**", "/js/**", "/images/**", "/uploads/**", "/webjars/**", "/favicon.ico").permitAll()
                .requestMatchers("/", "/health", "/login", "/register", "/attendance/checkin", "/api/auth/register", "/api/auth/me").permitAll();

                if (h2ConsoleEnabled) {
                    auth.requestMatchers("/h2-console/**").hasRole("ADMIN");
                }

                // Teacher-specific APIs and protected campus actions
                auth.requestMatchers("/api/teacher/**").hasRole("TEACHER")
                // Student APIs
                .requestMatchers("/api/student/**").hasAnyRole("STUDENT", "ADMIN")
                .requestMatchers("/api/attendance/checkin").hasRole("STUDENT")
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/emergencies/active").authenticated()
                .requestMatchers("/api/security/**").hasAnyRole("SECURITY", "ADMIN")
                .requestMatchers("/api/campus/admin/**", "/api/campus/backup/**", "/api/campus/logs", "/api/campus/complaint/process-next", "/api/campus/bus/transmit").hasRole("ADMIN")
                .requestMatchers("/api/campus/gate/checkin").hasAnyRole("SECURITY", "ADMIN")
                .requestMatchers("/api/campus/complaint/submit").hasAnyRole("STUDENT", "TEACHER", "ADMIN")
                .requestMatchers("/api/upload").hasAnyRole("STUDENT", "TEACHER", "ADMIN", "SECURITY")
                .requestMatchers("/api/campus/telemetry", "/api/campus/bus/locations").authenticated()
                .requestMatchers("/api/chatbot").authenticated()

                // React dashboard data endpoints
                .requestMatchers("/api/dashboard/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/dashboard/teacher/**").hasAnyRole("TEACHER", "ADMIN")
                .requestMatchers("/api/dashboard/student/**").hasAnyRole("STUDENT", "ADMIN")
                .requestMatchers("/api/dashboard/security/**").hasAnyRole("SECURITY", "ADMIN")
                .requestMatchers("/api/dashboard/**").authenticated()
                
                // Role-based Dashboards
                .requestMatchers("/dashboard/admin/**").hasRole("ADMIN")
                .requestMatchers("/dashboard/teacher/**").hasAnyRole("TEACHER", "ADMIN")
                .requestMatchers("/dashboard/student/**").hasAnyRole("STUDENT", "ADMIN")
                .requestMatchers("/dashboard/security/**").hasAnyRole("SECURITY", "ADMIN")
                .requestMatchers("/dashboard/**").authenticated()

                .anyRequest().authenticated();
            })
            .formLogin(form -> form
                .loginPage("/login")
                .loginProcessingUrl("/login")
                .usernameParameter("email")
                .passwordParameter("password")
                .successHandler(successHandler)
                .failureUrl("/login?error=true")
                .permitAll()
            )
            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl("/login?logout=true")
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID")
                .permitAll()
            )
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint((request, response, authException) -> {
                    if (request.getRequestURI().startsWith("/api/")) {
                        response.setStatus(HttpStatus.UNAUTHORIZED.value());
                        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                        response.getWriter().write("{\"success\":false,\"message\":\"SESSION_REQUIRED\"}");
                        return;
                    }
                    response.sendRedirect("/login");
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    if (request.getRequestURI().startsWith("/api/")) {
                        response.setStatus(HttpStatus.FORBIDDEN.value());
                        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                        response.getWriter().write("{\"success\":false,\"message\":\"FORBIDDEN\"}");
                        return;
                    }
                    response.sendRedirect("/login");
                })
            )
            .headers(headers -> {
                if (h2ConsoleEnabled) {
                    headers.frameOptions(frame -> frame.sameOrigin());
                }
            });

        http.authenticationProvider(authenticationProvider());

        return http.build();
    }
}
