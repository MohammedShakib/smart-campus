package bd.ac.uiu.smartcampus.repository;

import bd.ac.uiu.smartcampus.model.ClassEnrollment;
import bd.ac.uiu.smartcampus.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClassEnrollmentRepository extends JpaRepository<ClassEnrollment, Long> {

    /**
     * All active enrollments for a student.
     */
    List<ClassEnrollment> findByStudentAndActiveTrue(User student);

    /**
     * All active enrollments for a teacher in a specific course/section.
     */
    List<ClassEnrollment> findByTeacherEmailAndCourseCodeAndSectionNameAndActiveTrue(
            String teacherEmail, String courseCode, String sectionName);

    /**
     * Check if a student is actively enrolled in a given teacher's course/section.
     */
    boolean existsByTeacherEmailAndStudentEmailAndCourseCodeAndSectionNameAndActiveTrue(
            String teacherEmail, String studentEmail, String courseCode, String sectionName);

    /**
     * Check enrollment by student's studentOrEmpId (used for QR check-in validation).
     */
    @Query("SELECT COUNT(e) > 0 FROM ClassEnrollment e " +
           "WHERE e.teacher.email = :teacherEmail " +
           "AND e.student.studentOrEmpId = :studentId " +
           "AND e.courseCode = :courseCode " +
           "AND e.sectionName = :sectionName " +
           "AND e.active = true")
    boolean existsByTeacherEmailAndStudentIdAndCourseCodeAndSectionName(
            @Param("teacherEmail") String teacherEmail,
            @Param("studentId") String studentId,
            @Param("courseCode") String courseCode,
            @Param("sectionName") String sectionName);

    /**
     * Check duplicate before seeding — by teacher + student User objects + course + section.
     */
    boolean existsByTeacherAndStudentAndCourseCodeAndSectionName(
            User teacher, User student, String courseCode, String sectionName);

    /**
     * Distinct course/section pairs owned by a teacher (for roster class list).
     */
    @Query("SELECT DISTINCT e.courseCode, e.sectionName FROM ClassEnrollment e " +
           "WHERE e.teacher.email = :teacherEmail AND e.active = true")
    List<Object[]> findDistinctCoursesByTeacherEmail(@Param("teacherEmail") String teacherEmail);
}
