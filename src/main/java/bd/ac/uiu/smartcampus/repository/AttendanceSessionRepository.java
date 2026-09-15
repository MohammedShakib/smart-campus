package bd.ac.uiu.smartcampus.repository;

import bd.ac.uiu.smartcampus.model.AttendanceSession;
import bd.ac.uiu.smartcampus.model.TeachingSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceSessionRepository extends JpaRepository<AttendanceSession, Long> {

    Optional<AttendanceSession> findByIdAndTeacherEmail(Long id, String teacherEmail);

    Optional<AttendanceSession> findByToken(String token);

    Optional<AttendanceSession> findByTokenAndActiveTrue(String token);

    boolean existsByTeacherEmail(String teacherEmail);

    boolean existsByTeachingScheduleId(Long scheduleId);

    Optional<AttendanceSession> findByTeachingScheduleAndTeacherEmailAndActiveTrue(
            TeachingSchedule teachingSchedule, String teacherEmail);

    List<AttendanceSession> findByTeacherEmailOrderByStartedAtDesc(String teacherEmail);

    @Query("SELECT s FROM AttendanceSession s " +
           "WHERE s.teachingSchedule.courseCode = :courseCode " +
           "AND s.teachingSchedule.sectionName = :sectionName " +
           "ORDER BY s.startedAt DESC")
    List<AttendanceSession> findSessionsByCourseAndSection(
            @Param("courseCode") String courseCode,
            @Param("sectionName") String sectionName);

    /**
     * Completed (closed) sessions for a teacher in a specific course/section,
     * ordered most-recent first. Used for attendance history and percentage calculation.
     */
    @Query("SELECT s FROM AttendanceSession s " +
           "WHERE s.teacherEmail = :teacherEmail " +
           "AND s.teachingSchedule.courseCode = :courseCode " +
           "AND s.teachingSchedule.sectionName = :sectionName " +
           "AND s.active = false " +
           "AND s.endedAt IS NOT NULL " +
           "AND s.startedAt <= CURRENT_TIMESTAMP " +
           "ORDER BY s.startedAt DESC")
    List<AttendanceSession> findCompletedSessionsByTeacherAndCourse(
            @Param("teacherEmail") String teacherEmail,
            @Param("courseCode") String courseCode,
            @Param("sectionName") String sectionName);

    /**
     * All completed sessions for a teacher regardless of course — for full history view.
     * P2-9: startedAt <= now() excludes defensive future-dated sessions.
     */
    @Query("SELECT s FROM AttendanceSession s " +
           "WHERE s.teacherEmail = :teacherEmail " +
           "AND s.active = false " +
           "AND s.endedAt IS NOT NULL " +
           "AND s.startedAt <= CURRENT_TIMESTAMP " +
           "ORDER BY s.startedAt DESC")
    List<AttendanceSession> findAllCompletedByTeacher(@Param("teacherEmail") String teacherEmail);
}
