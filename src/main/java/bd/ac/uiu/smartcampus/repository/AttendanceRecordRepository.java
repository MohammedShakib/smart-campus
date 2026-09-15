package bd.ac.uiu.smartcampus.repository;

import bd.ac.uiu.smartcampus.model.AttendanceRecord;
import bd.ac.uiu.smartcampus.model.AttendanceSession;
import bd.ac.uiu.smartcampus.model.AttendanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {

    List<AttendanceRecord> findByAttendanceSessionOrderByCheckedInAtAsc(AttendanceSession attendanceSession);

    Optional<AttendanceRecord> findByAttendanceSessionAndStudentId(AttendanceSession attendanceSession, String studentId);

    long countByAttendanceSessionAndStatus(AttendanceSession attendanceSession, AttendanceStatus status);

    boolean existsByStudentId(String studentId);

    /** All records for a session — used in history detail view. */
    List<AttendanceRecord> findByAttendanceSessionOrderByStudentIdAsc(AttendanceSession session);

    /**
     * P2-8: Aggregate counts per (studentId, status) across a set of completed sessions
     * in a single query instead of N×3 per-student/per-status round trips.
     *
     * Returns rows of [studentId (String), status (AttendanceStatus), count (Long)].
     */
    @Query("SELECT r.studentId, r.status, COUNT(r) " +
           "FROM AttendanceRecord r " +
           "WHERE r.attendanceSession IN :sessions " +
           "GROUP BY r.studentId, r.status")
    List<Object[]> countGroupedByStudentAndStatus(
            @Param("sessions") Collection<AttendanceSession> sessions);

    /**
     * P2-8: Aggregate session-level counts (PRESENT, LATE, ABSENT) for the history list.
     * Returns rows of [sessionId (Long), status (AttendanceStatus), count (Long)].
     */
    @Query("SELECT r.attendanceSession.id, r.status, COUNT(r) " +
           "FROM AttendanceRecord r " +
           "WHERE r.attendanceSession IN :sessions " +
           "GROUP BY r.attendanceSession.id, r.status")
    List<Object[]> countGroupedBySessionAndStatus(
            @Param("sessions") Collection<AttendanceSession> sessions);
}
