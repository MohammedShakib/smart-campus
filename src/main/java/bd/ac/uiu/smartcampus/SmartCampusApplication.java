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
        System.out.println("    - Admin:    admin@uiu.ac.bd    / admin123                   ");
        System.out.println("    - Teacher:  teacher@uiu.ac.bd  / teacher123                 ");
        System.out.println("    - Student:  student@uiu.ac.bd  / student123                 ");
        System.out.println("    - Security: security@uiu.ac.bd / security123                ");
        System.out.println("=================================================================");
    }
}
