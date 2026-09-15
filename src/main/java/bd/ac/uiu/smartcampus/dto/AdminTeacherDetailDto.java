package bd.ac.uiu.smartcampus.dto;

import bd.ac.uiu.smartcampus.model.User;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public class AdminTeacherDetailDto extends AdminTeacherDto {
    private List<TeachingAssignmentInfo> teachingAssignments;
    private List<ScheduleInfo> schedules;
    private AttendanceSummary attendanceSummary;
    private OfficeHourSummary officeHourSummary;

    public AdminTeacherDetailDto(User teacher, String designation, String officeRoom,
                                 List<TeachingAssignmentInfo> teachingAssignments,
                                 List<ScheduleInfo> schedules,
                                 AttendanceSummary attendanceSummary,
                                 OfficeHourSummary officeHourSummary,
                                 long uniqueStudentCount) {
        super(teacher, designation, officeRoom, teachingAssignments.size(), uniqueStudentCount);
        this.teachingAssignments = teachingAssignments;
        this.schedules = schedules;
        this.attendanceSummary = attendanceSummary;
        this.officeHourSummary = officeHourSummary;
    }

    public List<TeachingAssignmentInfo> getTeachingAssignments() {
        return teachingAssignments;
    }

    public void setTeachingAssignments(List<TeachingAssignmentInfo> teachingAssignments) {
        this.teachingAssignments = teachingAssignments;
    }

    public List<ScheduleInfo> getSchedules() {
        return schedules;
    }

    public void setSchedules(List<ScheduleInfo> schedules) {
        this.schedules = schedules;
    }

    public AttendanceSummary getAttendanceSummary() {
        return attendanceSummary;
    }

    public void setAttendanceSummary(AttendanceSummary attendanceSummary) {
        this.attendanceSummary = attendanceSummary;
    }

    public OfficeHourSummary getOfficeHourSummary() {
        return officeHourSummary;
    }

    public void setOfficeHourSummary(OfficeHourSummary officeHourSummary) {
        this.officeHourSummary = officeHourSummary;
    }

    public static class TeachingAssignmentInfo {
        private String courseCode;
        private String courseTitle;
        private String sectionName;

        public TeachingAssignmentInfo(String courseCode, String courseTitle, String sectionName) {
            this.courseCode = courseCode;
            this.courseTitle = courseTitle;
            this.sectionName = sectionName;
        }

        public String getCourseCode() {
            return courseCode;
        }

        public String getCourseTitle() {
            return courseTitle;
        }

        public String getSectionName() {
            return sectionName;
        }
    }

    public static class ScheduleInfo {
        private String dayOfWeek;
        private LocalTime startTime;
        private LocalTime endTime;
        private String roomNumber;
        private String courseCode;

        public ScheduleInfo(String dayOfWeek, LocalTime startTime, LocalTime endTime, String roomNumber, String courseCode) {
            this.dayOfWeek = dayOfWeek;
            this.startTime = startTime;
            this.endTime = endTime;
            this.roomNumber = roomNumber;
            this.courseCode = courseCode;
        }

        public String getDayOfWeek() {
            return dayOfWeek;
        }

        public LocalTime getStartTime() {
            return startTime;
        }

        public LocalTime getEndTime() {
            return endTime;
        }

        public String getRoomNumber() {
            return roomNumber;
        }

        public String getCourseCode() {
            return courseCode;
        }
    }

    public static class AttendanceSummary {
        private long sessionsConducted;
        private long completedSessions;

        public AttendanceSummary(long sessionsConducted, long completedSessions) {
            this.sessionsConducted = sessionsConducted;
            this.completedSessions = completedSessions;
        }

        public long getSessionsConducted() {
            return sessionsConducted;
        }

        public long getCompletedSessions() {
            return completedSessions;
        }
    }

    public static class OfficeHourSummary {
        private long upcomingSlotCount;
        private List<OfficeHourSlotInfo> nextSlots;

        public OfficeHourSummary(long upcomingSlotCount, List<OfficeHourSlotInfo> nextSlots) {
            this.upcomingSlotCount = upcomingSlotCount;
            this.nextSlots = nextSlots;
        }

        public long getUpcomingSlotCount() {
            return upcomingSlotCount;
        }

        public List<OfficeHourSlotInfo> getNextSlots() {
            return nextSlots;
        }
    }

    public static class OfficeHourSlotInfo {
        private LocalDate date;
        private LocalTime start;
        private LocalTime end;
        private String location;
        private String bookingStatus;

        public OfficeHourSlotInfo(LocalDate date, LocalTime start, LocalTime end, String location, String bookingStatus) {
            this.date = date;
            this.start = start;
            this.end = end;
            this.location = location;
            this.bookingStatus = bookingStatus;
        }

        public LocalDate getDate() {
            return date;
        }

        public LocalTime getStart() {
            return start;
        }

        public LocalTime getEnd() {
            return end;
        }

        public String getLocation() {
            return location;
        }

        public String getBookingStatus() {
            return bookingStatus;
        }
    }
}
