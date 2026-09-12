package bd.ac.uiu.smartcampus;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SmartCampusApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmartCampusApplication.class, args);
        System.out.println("=================================================================");
        System.out.println("  UIU SMART CAMPUS IS NOW ONLINE!                               ");
        System.out.println("  Access Web Portal: http://localhost:8085/login                ");
        System.out.println("  Demo Accounts:");
        System.out.println("    - Admin:    admin-demo    / demo-admin-pass                 ");
        System.out.println("    - Teacher:  teacher-demo  / demo-teacher-pass               ");
        System.out.println("    - Student:  student-demo  / demo-student-pass               ");
        System.out.println("    - Security: security-demo / demo-security-pass              ");
        System.out.println("=================================================================");
    }
}
