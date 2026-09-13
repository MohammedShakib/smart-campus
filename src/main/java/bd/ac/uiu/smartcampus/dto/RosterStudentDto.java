package bd.ac.uiu.smartcampus.dto;

public class RosterStudentDto {
    private String studentId;
    private String name;
    private String email;
    private long present;
    private long late;
    private long absent;
    private long totalSessions;
    private Double attendancePercentage; // null if no completed sessions

    public RosterStudentDto(String studentId, String name, String email,
                            long present, long late, long absent,
                            long totalSessions, Double attendancePercentage) {
        this.studentId = studentId;
        this.name = name;
        this.email = email;
        this.present = present;
        this.late = late;
        this.absent = absent;
        this.totalSessions = totalSessions;
        this.attendancePercentage = attendancePercentage;
    }

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public long getPresent() {
        return present;
    }

    public void setPresent(long present) {
        this.present = present;
    }

    public long getLate() {
        return late;
    }

    public void setLate(long late) {
        this.late = late;
    }

    public long getAbsent() {
        return absent;
    }

    public void setAbsent(long absent) {
        this.absent = absent;
    }

    public long getTotalSessions() {
        return totalSessions;
    }

    public void setTotalSessions(long totalSessions) {
        this.totalSessions = totalSessions;
    }

    public Double getAttendancePercentage() {
        return attendancePercentage;
    }

    public void setAttendancePercentage(Double attendancePercentage) {
        this.attendancePercentage = attendancePercentage;
    }
}
