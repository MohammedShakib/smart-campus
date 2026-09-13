package bd.ac.uiu.smartcampus.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class AttendanceHistoryDto {
    private Long sessionId;
    private String courseCode;
    private String courseTitle;
    private String sectionName;
    private LocalDate date;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private long presentCount;
    private long lateCount;
    private long absentCount;
    private long totalStudents;
    private Double attendanceRate;

    public AttendanceHistoryDto(Long sessionId, String courseCode, String courseTitle,
                                String sectionName, LocalDate date,
                                LocalDateTime startedAt, LocalDateTime endedAt,
                                long presentCount, long lateCount, long absentCount,
                                long totalStudents, Double attendanceRate) {
        this.sessionId = sessionId;
        this.courseCode = courseCode;
        this.courseTitle = courseTitle;
        this.sectionName = sectionName;
        this.date = date;
        this.startedAt = startedAt;
        this.endedAt = endedAt;
        this.presentCount = presentCount;
        this.lateCount = lateCount;
        this.absentCount = absentCount;
        this.totalStudents = totalStudents;
        this.attendanceRate = attendanceRate;
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

    public long getPresentCount() { return presentCount; }
    public void setPresentCount(long presentCount) { this.presentCount = presentCount; }

    public long getLateCount() { return lateCount; }
    public void setLateCount(long lateCount) { this.lateCount = lateCount; }

    public long getAbsentCount() { return absentCount; }
    public void setAbsentCount(long absentCount) { this.absentCount = absentCount; }

    public long getTotalStudents() { return totalStudents; }
    public void setTotalStudents(long totalStudents) { this.totalStudents = totalStudents; }

    public Double getAttendanceRate() { return attendanceRate; }
    public void setAttendanceRate(Double attendanceRate) { this.attendanceRate = attendanceRate; }
}
