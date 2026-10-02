package bd.ac.uiu.smartcampus;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling
public class SmartCampusApplication {

    private static final String CAMPUS_TIME_ZONE = "Asia/Dhaka";

    public static void main(String[] args) {
        TimeZone.setDefault(TimeZone.getTimeZone(CAMPUS_TIME_ZONE));
        SpringApplication.run(SmartCampusApplication.class, args);
        String port = System.getenv().getOrDefault("PORT", "8085");
        System.out.println("=================================================================");
        System.out.println("  UIU SMART CAMPUS IS NOW ONLINE!                               ");
        System.out.println("  Campus Time Zone: " + CAMPUS_TIME_ZONE);
        System.out.println("  HTTP Port: " + port);
        System.out.println("  Health Check: /health                                         ");
        System.out.println("  Demo Accounts:");
        System.out.println("    - Admin:    admin-demo    / demo-admin-pass                 ");
        System.out.println("    - Teacher:  teacher-demo  / demo-teacher-pass               ");
        System.out.println("    - Student:  student-demo  / demo-student-pass               ");
        System.out.println("    - Security: security-demo / demo-security-pass              ");
        System.out.println("=================================================================");
    }
}
