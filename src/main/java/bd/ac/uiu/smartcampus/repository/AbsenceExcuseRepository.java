package bd.ac.uiu.smartcampus.repository;

import bd.ac.uiu.smartcampus.model.AbsenceExcuse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AbsenceExcuseRepository extends JpaRepository<AbsenceExcuse, Long> {

    List<AbsenceExcuse> findByStudentIdOrderBySubmittedAtDesc(String studentId);

    List<AbsenceExcuse> findByTeacherEmailOrderBySubmittedAtDesc(String teacherEmail);

    List<AbsenceExcuse> findByTeacherEmailAndStatusOrderBySubmittedAtDesc(String teacherEmail, AbsenceExcuse.ExcuseStatus status);

    Optional<AbsenceExcuse> findByStudentIdAndCourseCodeAndAbsenceDate(String studentId, String courseCode, LocalDate absenceDate);

    boolean existsByStudentIdAndCourseCodeAndAbsenceDate(String studentId, String courseCode, LocalDate absenceDate);

    boolean existsByStudentId(String studentId);

    boolean existsByStudentEmail(String studentEmail);

    boolean existsByTeacherEmail(String teacherEmail);
}
