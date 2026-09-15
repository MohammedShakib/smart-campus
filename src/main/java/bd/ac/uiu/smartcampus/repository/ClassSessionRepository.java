package bd.ac.uiu.smartcampus.repository;

import bd.ac.uiu.smartcampus.model.ClassSession;
import bd.ac.uiu.smartcampus.model.TeachingSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ClassSessionRepository extends JpaRepository<ClassSession, Long> {
    Optional<ClassSession> findByTeachingScheduleAndSessionDate(TeachingSchedule teachingSchedule, LocalDate sessionDate);
    List<ClassSession> findByTeachingSchedule_TeacherEmailAndSessionDate(String teacherEmail, LocalDate sessionDate);
    
    List<ClassSession> findByStatus(bd.ac.uiu.smartcampus.model.ClassStatus status);
}
