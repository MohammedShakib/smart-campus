package bd.ac.uiu.smartcampus.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Collection;

@Component
public class CustomAuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();

        String targetUrl = "/dashboard/student";

        for (GrantedAuthority authority : authorities) {
            String role = authority.getAuthority();
            if (role.equals("ROLE_ADMIN")) {
                targetUrl = "/dashboard/admin";
                break;
            } else if (role.equals("ROLE_TEACHER")) {
                targetUrl = "/dashboard/teacher";
                break;
            } else if (role.equals("ROLE_STUDENT")) {
                targetUrl = "/dashboard/student";
                break;
            } else if (role.equals("ROLE_SECURITY")) {
                targetUrl = "/dashboard/security";
                break;
            }
        }

        response.sendRedirect(targetUrl);
    }
}
