package bd.ac.uiu.smartcampus.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance_sessions")
public class AttendanceSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.EAGER)
    @JoinColumn(name = "teaching_schedule_id", nullable = false)
    private TeachingSchedule teachingSchedule;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "class_session_id")
    private ClassSession classSession;

    @Column(nullable = false, length = 100)
    private String teacherEmail;

    @Column(nullable = false)
    private LocalDate sessionDate = LocalDate.now();

    @Column(nullable = false, unique = true, length = 80)
    private String token;

    @Column(nullable = false)
    private LocalDateTime startedAt = LocalDateTime.now();

    @Column
    private LocalDateTime endedAt;

    @Column(nullable = false)
    private boolean active = true;

    public AttendanceSession() {
    }

    public AttendanceSession(TeachingSchedule teachingSchedule, String teacherEmail, String token) {
        this.teachingSchedule = teachingSchedule;
        this.teacherEmail = teacherEmail;
        this.token = token;
        this.sessionDate = LocalDate.now();
        this.startedAt = LocalDateTime.now();
        this.active = true;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public TeachingSchedule getTeachingSchedule() {
        return teachingSchedule;
    }

    public void setTeachingSchedule(TeachingSchedule teachingSchedule) {
        this.teachingSchedule = teachingSchedule;
    }

    public ClassSession getClassSession() {
        return classSession;
    }

    public void setClassSession(ClassSession classSession) {
        this.classSession = classSession;
    }

    public String getTeacherEmail() {
        return teacherEmail;
    }

    public void setTeacherEmail(String teacherEmail) {
        this.teacherEmail = teacherEmail;
    }

    public LocalDate getSessionDate() {
        return sessionDate;
    }

    public void setSessionDate(LocalDate sessionDate) {
        this.sessionDate = sessionDate;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public LocalDateTime getEndedAt() {
        return endedAt;
    }

    public void setEndedAt(LocalDateTime endedAt) {
        this.endedAt = endedAt;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
