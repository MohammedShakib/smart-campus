package bd.ac.uiu.smartcampus.dto;

import java.util.ArrayList;
import java.util.List;

public class StudentAttendanceCourseSummaryDto {

    private String courseCode;
    private String courseTitle;
    private String sectionName;
    private String teacherName;
    private String teacherEmail;
    private int totalClasses;
    private int presentCount;
    private int lateCount;
    private int absentCount;
    private int excusedCount;
    private double attendancePercentage;
    private List<StudentAttendanceSessionDto> sessions = new ArrayList<>();

    public StudentAttendanceCourseSummaryDto() {
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

    public String getTeacherName() {
        return teacherName;
    }

    public void setTeacherName(String teacherName) {
        this.teacherName = teacherName;
    }

    public String getTeacherEmail() {
        return teacherEmail;
    }

    public void setTeacherEmail(String teacherEmail) {
        this.teacherEmail = teacherEmail;
    }

    public int getTotalClasses() {
        return totalClasses;
    }

    public void setTotalClasses(int totalClasses) {
        this.totalClasses = totalClasses;
    }

    public int getPresentCount() {
        return presentCount;
    }

    public void setPresentCount(int presentCount) {
        this.presentCount = presentCount;
    }

    public int getLateCount() {
        return lateCount;
    }

    public void setLateCount(int lateCount) {
        this.lateCount = lateCount;
    }

    public int getAbsentCount() {
        return absentCount;
    }

    public void setAbsentCount(int absentCount) {
        this.absentCount = absentCount;
    }

    public int getExcusedCount() {
        return excusedCount;
    }

    public void setExcusedCount(int excusedCount) {
        this.excusedCount = excusedCount;
    }

    public double getAttendancePercentage() {
        return attendancePercentage;
    }

    public void setAttendancePercentage(double attendancePercentage) {
        this.attendancePercentage = attendancePercentage;
    }

    public List<StudentAttendanceSessionDto> getSessions() {
        return sessions;
    }

    public void setSessions(List<StudentAttendanceSessionDto> sessions) {
        this.sessions = sessions;
    }
}
