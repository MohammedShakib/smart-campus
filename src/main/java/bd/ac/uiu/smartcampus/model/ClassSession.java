package bd.ac.uiu.smartcampus.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "class_sessions",
        uniqueConstraints = @UniqueConstraint(columnNames = {"teaching_schedule_id", "session_date"})
)
public class ClassSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.EAGER)
    @JoinColumn(name = "teaching_schedule_id", nullable = false)
    private TeachingSchedule teachingSchedule;

    @Column(name = "session_date", nullable = false)
    private LocalDate sessionDate = LocalDate.now();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ClassStatus status = ClassStatus.SCHEDULED;

    @Column
    private LocalDateTime startedAt;

    @Column
    private LocalDateTime endedAt;

    @Column(length = 100)
    private String startedByTeacherId;

    public ClassSession() {
    }

    public ClassSession(TeachingSchedule teachingSchedule, LocalDate sessionDate) {
        this.teachingSchedule = teachingSchedule;
        this.sessionDate = sessionDate;
        this.status = ClassStatus.SCHEDULED;
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

    public LocalDate getSessionDate() {
        return sessionDate;
    }

    public void setSessionDate(LocalDate sessionDate) {
        this.sessionDate = sessionDate;
    }

    public ClassStatus getStatus() {
        return status;
    }

    public void setStatus(ClassStatus status) {
        this.status = status;
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

    public String getStartedByTeacherId() {
        return startedByTeacherId;
    }

    public void setStartedByTeacherId(String startedByTeacherId) {
        this.startedByTeacherId = startedByTeacherId;
    }
}
