package bd.ac.uiu.smartcampus.dto;

public class AdminStudentEnrollmentRequest {
    private Long scheduleId;

    public AdminStudentEnrollmentRequest() {
    }

    public Long getScheduleId() {
        return scheduleId;
    }

    public void setScheduleId(Long scheduleId) {
        this.scheduleId = scheduleId;
    }
}
