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
}
