package bd.ac.uiu.smartcampus.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "absence_excuses")
public class AbsenceExcuse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false, length = 30)
    private String studentId;

    @Column(name = "student_name", nullable = false, length = 100)
    private String studentName;

    @Column(name = "student_email", nullable = false, length = 100)
    private String studentEmail;

    @Column(name = "course_code", nullable = false, length = 30)
    private String courseCode;

    @Column(name = "course_title", length = 150)
    private String courseTitle;

    @Column(name = "section_name", length = 30)
    private String sectionName;

    @Column(name = "teacher_email", nullable = false, length = 100)
    private String teacherEmail;

    @Column(name = "absence_date", nullable = false)
    private LocalDate absenceDate;

    @Column(name = "reason_category", nullable = false, length = 50)
    private String reasonCategory; // e.g. MEDICAL, FAMILY_EMERGENCY, ACADEMIC_EVENT, TRANSPORT, OTHER

    @Column(columnDefinition = "TEXT", nullable = false)
    private String explanation;

    @Column(name = "document_url", columnDefinition = "LONGTEXT")
    private String documentUrl; // File note, slip reference number, or uploaded slip URL

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ExcuseStatus status = ExcuseStatus.PENDING;

    @Column(name = "teacher_remarks", length = 500)
    private String teacherRemarks;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt = LocalDateTime.now();

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    public enum ExcuseStatus {
        PENDING,
        APPROVED,
        REJECTED
    }

    public AbsenceExcuse() {
    }

    public AbsenceExcuse(String studentId, String studentName, String studentEmail,
                         String courseCode, String courseTitle, String sectionName,
                         String teacherEmail, LocalDate absenceDate, String reasonCategory,
                         String explanation, String documentUrl) {
        this.studentId = studentId;
        this.studentName = studentName;
        this.studentEmail = studentEmail;
        this.courseCode = courseCode;
        this.courseTitle = courseTitle;
        this.sectionName = sectionName;
        this.teacherEmail = teacherEmail;
        this.absenceDate = absenceDate;
        this.reasonCategory = reasonCategory;
        this.explanation = explanation;
        this.documentUrl = documentUrl;
        this.status = ExcuseStatus.PENDING;
        this.submittedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getStudentEmail() {
        return studentEmail;
    }

    public void setStudentEmail(String studentEmail) {
        this.studentEmail = studentEmail;
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

    public LocalDate getAbsenceDate() {
        return absenceDate;
    }

    public void setAbsenceDate(LocalDate absenceDate) {
        this.absenceDate = absenceDate;
    }

    public String getReasonCategory() {
        return reasonCategory;
    }

    public void setReasonCategory(String reasonCategory) {
        this.reasonCategory = reasonCategory;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }

    public String getDocumentUrl() {
        return documentUrl;
    }

    public void setDocumentUrl(String documentUrl) {
        this.documentUrl = documentUrl;
    }

    public ExcuseStatus getStatus() {
        return status;
    }

    public void setStatus(ExcuseStatus status) {
        this.status = status;
    }

    public String getTeacherRemarks() {
        return teacherRemarks;
    }

    public void setTeacherRemarks(String teacherRemarks) {
        this.teacherRemarks = teacherRemarks;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public LocalDateTime getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(LocalDateTime reviewedAt) {
        this.reviewedAt = reviewedAt;
    }
}
