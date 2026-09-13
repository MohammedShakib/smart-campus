package bd.ac.uiu.smartcampus.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "attendance_records",
        uniqueConstraints = @UniqueConstraint(columnNames = {"attendance_session_id", "student_id"})
)
public class AttendanceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "attendance_session_id", nullable = false)
    @JsonIgnore
    private AttendanceSession attendanceSession;

    @Column(name = "student_id", nullable = false, length = 30)
    private String studentId;

    @Column(length = 100)
    private String studentName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AttendanceStatus status = AttendanceStatus.PRESENT;

    @Column(nullable = false)
    private LocalDateTime checkedInAt = LocalDateTime.now();

    public AttendanceRecord() {
    }

    public AttendanceRecord(AttendanceSession attendanceSession, String studentId, String studentName, AttendanceStatus status) {
        this.attendanceSession = attendanceSession;
        this.studentId = studentId;
        this.studentName = studentName;
        this.status = status;
        this.checkedInAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public AttendanceSession getAttendanceSession() {
        return attendanceSession;
    }

    public void setAttendanceSession(AttendanceSession attendanceSession) {
        this.attendanceSession = attendanceSession;
    }

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public AttendanceStatus getStatus() {
        return status;
    }

    public void setStatus(AttendanceStatus status) {
        this.status = status;
    }

    public LocalDateTime getCheckedInAt() {
        return checkedInAt;
    }

    public void setCheckedInAt(LocalDateTime checkedInAt) {
        this.checkedInAt = checkedInAt;
    }
}
