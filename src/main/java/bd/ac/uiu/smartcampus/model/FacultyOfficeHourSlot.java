package bd.ac.uiu.smartcampus.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "faculty_office_hour_slots")
public class FacultyOfficeHourSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "teacher_email", nullable = false, length = 100)
    private String teacherEmail;

    @Column(name = "teacher_name", nullable = false, length = 100)
    private String teacherName;

    @Column(length = 100)
    private String department;

    @Column(name = "room_number", length = 50)
    private String roomNumber; // e.g. "Room 524" or "Faculty Room 418"

    @Column(name = "day_of_week", length = 20)
    private String dayOfWeek;

    @Column(name = "slot_date", nullable = false)
    private LocalDate slotDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SlotStatus status = SlotStatus.AVAILABLE;

    /**
     * Optimistic concurrency control version field.
     * Prevents simultaneous dirty writes during race condition bookings.
     */
    @Version
    private Long version;

    // --- Booked Student Details ---
    @Column(name = "booked_student_id", length = 30)
    private String bookedStudentId;

    @Column(name = "booked_student_name", length = 100)
    private String bookedStudentName;

    @Column(name = "booked_student_email", length = 100)
    private String bookedStudentEmail;

    // --- Mandatory Pre-Submitted Query Details ---
    @Column(name = "query_category", length = 60)
    private String queryCategory; // e.g. "Theory Clarification", "Project Consultation", "Exam Review", "General Advising"

    @Column(name = "query_topic", length = 200)
    private String queryTopic;

    @Column(name = "query_details", columnDefinition = "TEXT")
    private String queryDetails;

    @Column(name = "faculty_feedback", length = 500)
    private String facultyFeedback;

    @Column(name = "booked_at")
    private LocalDateTime bookedAt;

    public enum SlotStatus {
        AVAILABLE,
        BOOKED,
        COMPLETED,
        CANCELLED
    }

    public FacultyOfficeHourSlot() {
    }

    public FacultyOfficeHourSlot(String teacherEmail, String teacherName, String department,
                                 String roomNumber, String dayOfWeek, LocalDate slotDate,
                                 LocalTime startTime, LocalTime endTime) {
        this.teacherEmail = teacherEmail;
        this.teacherName = teacherName;
        this.department = department;
        this.roomNumber = roomNumber;
        this.dayOfWeek = dayOfWeek;
        this.slotDate = slotDate;
        this.startTime = startTime;
        this.endTime = endTime;
        this.status = SlotStatus.AVAILABLE;
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

    public String getTeacherName() {
        return teacherName;
    }

    public void setTeacherName(String teacherName) {
        this.teacherName = teacherName;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
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

    public LocalDate getSlotDate() {
        return slotDate;
    }

    public void setSlotDate(LocalDate slotDate) {
        this.slotDate = slotDate;
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

    public SlotStatus getStatus() {
        return status;
    }

    public void setStatus(SlotStatus status) {
        this.status = status;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }

    public String getBookedStudentId() {
        return bookedStudentId;
    }

    public void setBookedStudentId(String bookedStudentId) {
        this.bookedStudentId = bookedStudentId;
    }

    public String getBookedStudentName() {
        return bookedStudentName;
    }

    public void setBookedStudentName(String bookedStudentName) {
        this.bookedStudentName = bookedStudentName;
    }

    public String getBookedStudentEmail() {
        return bookedStudentEmail;
    }

    public void setBookedStudentEmail(String bookedStudentEmail) {
        this.bookedStudentEmail = bookedStudentEmail;
    }

    public String getQueryCategory() {
        return queryCategory;
    }

    public void setQueryCategory(String queryCategory) {
        this.queryCategory = queryCategory;
    }

    public String getQueryTopic() {
        return queryTopic;
    }

    public void setQueryTopic(String queryTopic) {
        this.queryTopic = queryTopic;
    }

    public String getQueryDetails() {
        return queryDetails;
    }

    public void setQueryDetails(String queryDetails) {
        this.queryDetails = queryDetails;
    }

    public String getFacultyFeedback() {
        return facultyFeedback;
    }

    public void setFacultyFeedback(String facultyFeedback) {
        this.facultyFeedback = facultyFeedback;
    }

    public LocalDateTime getBookedAt() {
        return bookedAt;
    }

    public void setBookedAt(LocalDateTime bookedAt) {
        this.bookedAt = bookedAt;
    }
}
