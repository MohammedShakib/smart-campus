package bd.ac.uiu.smartcampus.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class AttendanceSessionDetailDto {

    private Long sessionId;
    private String courseCode;
    private String courseTitle;
    private String sectionName;
    private LocalDate date;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private boolean active;
    private List<RecordEntry> records;

    public AttendanceSessionDetailDto(Long sessionId, String courseCode, String courseTitle,
                                      String sectionName, LocalDate date,
                                      LocalDateTime startedAt, LocalDateTime endedAt,
                                      boolean active, List<RecordEntry> records) {
        this.sessionId = sessionId;
        this.courseCode = courseCode;
        this.courseTitle = courseTitle;
        this.sectionName = sectionName;
        this.date = date;
        this.startedAt = startedAt;
        this.endedAt = endedAt;
        this.active = active;
        this.records = records;
    }

    public static class RecordEntry {
        private String studentId;
        private String studentName;
        private String status;
        private LocalDateTime checkedInAt;

        public RecordEntry(String studentId, String studentName, String status, LocalDateTime checkedInAt) {
            this.studentId = studentId;
            this.studentName = studentName;
            this.status = status;
            this.checkedInAt = checkedInAt;
        }

        public String getStudentId() { return studentId; }
        public void setStudentId(String studentId) { this.studentId = studentId; }

        public String getStudentName() { return studentName; }
        public void setStudentName(String studentName) { this.studentName = studentName; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public LocalDateTime getCheckedInAt() { return checkedInAt; }
        public void setCheckedInAt(LocalDateTime checkedInAt) { this.checkedInAt = checkedInAt; }
    }

    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }

    public String getCourseCode() { return courseCode; }
    public void setCourseCode(String courseCode) { this.courseCode = courseCode; }

    public String getCourseTitle() { return courseTitle; }
    public void setCourseTitle(String courseTitle) { this.courseTitle = courseTitle; }

    public String getSectionName() { return sectionName; }
    public void setSectionName(String sectionName) { this.sectionName = sectionName; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }

    public LocalDateTime getEndedAt() { return endedAt; }
    public void setEndedAt(LocalDateTime endedAt) { this.endedAt = endedAt; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public List<RecordEntry> getRecords() { return records; }
    public void setRecords(List<RecordEntry> records) { this.records = records; }
}
