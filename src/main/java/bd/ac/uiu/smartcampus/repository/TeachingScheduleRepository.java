package bd.ac.uiu.smartcampus.repository;

import bd.ac.uiu.smartcampus.model.TeachingSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeachingScheduleRepository extends JpaRepository<TeachingSchedule, Long> {
    List<TeachingSchedule> findByTeacherEmailOrderByDayOfWeekAscStartTimeAsc(String teacherEmail);
    boolean existsByTeacherEmailAndCourseCodeAndSectionNameAndDayOfWeek(String teacherEmail, String courseCode, String sectionName, String dayOfWeek);
}
