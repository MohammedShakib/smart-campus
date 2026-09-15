package bd.ac.uiu.smartcampus.dto;

import bd.ac.uiu.smartcampus.model.ClassStatus;
import bd.ac.uiu.smartcampus.model.TeachingSchedule;
import java.time.LocalTime;

public class TeachingScheduleResponse {

    private Long id;
    private String teacherEmail;
    private String courseCode;
    private String courseTitle;
    private String sectionName;
    private String roomNumber;
    private String dayOfWeek;
    private LocalTime startTime;
    private LocalTime endTime;
    private ClassStatus status;

    private Long courseId;
    private Long classroomId;
    private String teacherName;

    public static TeachingScheduleResponse fromEntity(TeachingSchedule schedule) {
        TeachingScheduleResponse response = new TeachingScheduleResponse();
        response.setId(schedule.getId());
        response.setTeacherEmail(schedule.getTeacherEmail());
        response.setCourseCode(schedule.getCourseCode());
        response.setCourseTitle(schedule.getCourseTitle());
        response.setSectionName(schedule.getSectionName());
        response.setRoomNumber(schedule.getRoomNumber());
        response.setDayOfWeek(schedule.getDayOfWeek());
        response.setStartTime(schedule.getStartTime());
        response.setEndTime(schedule.getEndTime());
        response.setStatus(schedule.getStatus());

        if (schedule.getCourseRef() != null) {
            response.setCourseId(schedule.getCourseRef().getId());
        }
        if (schedule.getClassroomRef() != null) {
            response.setClassroomId(schedule.getClassroomRef().getId());
        }

        return response;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTeacherEmail() {
        return teacherEmail;
    }

    public void setTeacherEmail(String teacherEmail) {
        this.teacherEmail = teacherEmail;
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

    public String getRoomNumber() {
        return roomNumber;
    }

    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
    }

    public String getDayOfWeek() {
        return dayOfWeek;
    }

    public void setDayOfWeek(String dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public ClassStatus getStatus() {
        return status;
    }

    public void setStatus(ClassStatus status) {
        this.status = status;
    }

    public Long getCourseId() {
        return courseId;
    }

    public void setCourseId(Long courseId) {
        this.courseId = courseId;
    }

    public Long getClassroomId() {
        return classroomId;
    }

    public void setClassroomId(Long classroomId) {
        this.classroomId = classroomId;
    }

    public String getTeacherName() {
        return teacherName;
    }

    public void setTeacherName(String teacherName) {
        this.teacherName = teacherName;
    }
}
