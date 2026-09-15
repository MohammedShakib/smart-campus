package bd.ac.uiu.smartcampus.repository;

import bd.ac.uiu.smartcampus.model.TeachingSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeachingScheduleRepository extends JpaRepository<TeachingSchedule, Long> {
    List<TeachingSchedule> findByTeacherEmailOrderByDayOfWeekAscStartTimeAsc(String teacherEmail);
    Optional<TeachingSchedule> findByTeacherEmailAndCourseCodeAndSectionNameAndDayOfWeek(String teacherEmail, String courseCode, String sectionName, String dayOfWeek);
    boolean existsByTeacherEmailAndCourseCodeAndSectionNameAndDayOfWeek(String teacherEmail, String courseCode, String sectionName, String dayOfWeek);
    List<TeachingSchedule> findByDayOfWeek(String dayOfWeek);

    boolean existsByTeacherEmail(String teacherEmail);

    @org.springframework.data.jpa.repository.Query("SELECT s.teacherEmail, COUNT(DISTINCT CONCAT(s.courseCode, '-', s.sectionName)) FROM TeachingSchedule s " +
           "WHERE s.teacherEmail IN :teacherEmails " +
           "GROUP BY s.teacherEmail")
    List<Object[]> countDistinctClassesByTeacherEmails(@org.springframework.data.repository.query.Param("teacherEmails") java.util.Collection<String> teacherEmails);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(DISTINCT s.teacherEmail) FROM TeachingSchedule s " +
           "WHERE s.teacherEmail IN :teacherEmails")
    long countTeachersWithClassesByTeacherEmails(@org.springframework.data.repository.query.Param("teacherEmails") java.util.Collection<String> teacherEmails);
}
