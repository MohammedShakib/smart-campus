package bd.ac.uiu.smartcampus.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class StudentAttendanceSessionDto {

    private Long sessionId;
    private Long scheduleId;
    private String courseCode;
    private String courseTitle;
    private String sectionName;
    private String teacherEmail;
    private String roomNumber;
    private LocalDate sessionDate;
    private LocalDateTime checkedInAt;
    private String status; // PRESENT, ABSENT, LATE, EXCUSED
    private boolean excuseSubmitted;
    private String excuseStatus; // PENDING, APPROVED, REJECTED, or null

    public StudentAttendanceSessionDto() {
    }

    public Long getSessionId() {
        return sessionId;
    }

    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
    }

    public Long getScheduleId() {
        return scheduleId;
    }

    public void setScheduleId(Long scheduleId) {
        this.scheduleId = scheduleId;
    }

    public String getCourseCode() {
        return courseCode;
    }

    public void setCourseCode(String courseCode) {
        this.courseCode = courseCode;
    }

    public String getCourseTitle() {
        return courseTitle;
    }

    public void setCourseTitle(String courseTitle) {
        this.courseTitle = courseTitle;
    }

    public String getSectionName() {
        return sectionName;
    }

    public void setSectionName(String sectionName) {
        this.sectionName = sectionName;
    }

    public String getTeacherEmail() {
        return teacherEmail;
    }

    public void setTeacherEmail(String teacherEmail) {
        this.teacherEmail = teacherEmail;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
    }

    public LocalDate getSessionDate() {
        return sessionDate;
    }

    public void setSessionDate(LocalDate sessionDate) {
        this.sessionDate = sessionDate;
    }

    public LocalDateTime getCheckedInAt() {
        return checkedInAt;
    }

    public void setCheckedInAt(LocalDateTime checkedInAt) {
        this.checkedInAt = checkedInAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public boolean isExcuseSubmitted() {
        return excuseSubmitted;
    }

    public void setExcuseSubmitted(boolean excuseSubmitted) {
        this.excuseSubmitted = excuseSubmitted;
    }

    public String getExcuseStatus() {
        return excuseStatus;
    }

    public void setExcuseStatus(String excuseStatus) {
        this.excuseStatus = excuseStatus;
    }
}
