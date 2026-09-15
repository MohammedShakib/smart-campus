package bd.ac.uiu.smartcampus.dto;

import bd.ac.uiu.smartcampus.model.User;
import java.time.LocalDateTime;
import java.util.List;

public class AdminStudentDetailDto {
    private Long id;
    private String fullName;
    private String loginIdentifier;
    private String studentId;
    private String department;
    private Integer semester;
    private boolean active;
    private LocalDateTime createdAt;
    
    private List<EnrollmentInfo> enrollments;
    private AttendanceSummary attendanceSummary;

    public AdminStudentDetailDto() {
    }

    public AdminStudentDetailDto(User user, Integer semester, List<EnrollmentInfo> enrollments, AttendanceSummary attendanceSummary) {
        this.id = user.getId();
        this.fullName = user.getFullName();
        this.loginIdentifier = user.getEmail();
        this.studentId = user.getStudentOrEmpId();
        this.department = user.getDepartment();
        this.semester = semester;
        this.active = user.isActive();
        this.createdAt = user.getCreatedAt();
        this.enrollments = enrollments;
        this.attendanceSummary = attendanceSummary;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getLoginIdentifier() { return loginIdentifier; }
    public void setLoginIdentifier(String loginIdentifier) { this.loginIdentifier = loginIdentifier; }
    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public Integer getSemester() { return semester; }
    public void setSemester(Integer semester) { this.semester = semester; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public List<EnrollmentInfo> getEnrollments() { return enrollments; }
    public void setEnrollments(List<EnrollmentInfo> enrollments) { this.enrollments = enrollments; }
    public AttendanceSummary getAttendanceSummary() { return attendanceSummary; }
    public void setAttendanceSummary(AttendanceSummary attendanceSummary) { this.attendanceSummary = attendanceSummary; }

    public static class EnrollmentInfo {
        private String courseCode;
        private String sectionName;
        private String teacherName;

        public EnrollmentInfo(String courseCode, String sectionName, String teacherName) {
            this.courseCode = courseCode;
            this.sectionName = sectionName;
            this.teacherName = teacherName;
        }

        public String getCourseCode() { return courseCode; }
        public void setCourseCode(String courseCode) { this.courseCode = courseCode; }
        public String getSectionName() { return sectionName; }
        public void setSectionName(String sectionName) { this.sectionName = sectionName; }
        public String getTeacherName() { return teacherName; }
        public void setTeacherName(String teacherName) { this.teacherName = teacherName; }
    }

    public static class AttendanceSummary {
        private long presentCount;
        private long lateCount;
        private long absentCount;
        private Double attendancePercentage;

        public AttendanceSummary(long presentCount, long lateCount, long absentCount, Double attendancePercentage) {
            this.presentCount = presentCount;
            this.lateCount = lateCount;
            this.absentCount = absentCount;
            this.attendancePercentage = attendancePercentage;
        }

        public long getPresentCount() { return presentCount; }
        public void setPresentCount(long presentCount) { this.presentCount = presentCount; }
        public long getLateCount() { return lateCount; }
        public void setLateCount(long lateCount) { this.lateCount = lateCount; }
        public long getAbsentCount() { return absentCount; }
        public void setAbsentCount(long absentCount) { this.absentCount = absentCount; }
        public Double getAttendancePercentage() { return attendancePercentage; }
        public void setAttendancePercentage(Double attendancePercentage) { this.attendancePercentage = attendancePercentage; }
    }
}
