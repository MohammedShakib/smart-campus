package bd.ac.uiu.smartcampus.repository;

import bd.ac.uiu.smartcampus.model.AttendanceSession;
import bd.ac.uiu.smartcampus.model.TeachingSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceSessionRepository extends JpaRepository<AttendanceSession, Long> {
    Optional<AttendanceSession> findByIdAndTeacherEmail(Long id, String teacherEmail);
    Optional<AttendanceSession> findByToken(String token);
    Optional<AttendanceSession> findByTokenAndActiveTrue(String token);
    Optional<AttendanceSession> findByTeachingScheduleAndTeacherEmailAndActiveTrue(TeachingSchedule teachingSchedule, String teacherEmail);
    List<AttendanceSession> findByTeacherEmailOrderByStartedAtDesc(String teacherEmail);
}
