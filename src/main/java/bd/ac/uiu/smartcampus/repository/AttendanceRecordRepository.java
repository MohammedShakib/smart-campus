package bd.ac.uiu.smartcampus.repository;

import bd.ac.uiu.smartcampus.model.AttendanceRecord;
import bd.ac.uiu.smartcampus.model.AttendanceSession;
import bd.ac.uiu.smartcampus.model.AttendanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {

    List<AttendanceRecord> findByAttendanceSessionOrderByCheckedInAtAsc(AttendanceSession attendanceSession);

    Optional<AttendanceRecord> findByAttendanceSessionAndStudentId(AttendanceSession attendanceSession, String studentId);

    long countByAttendanceSessionAndStatus(AttendanceSession attendanceSession, AttendanceStatus status);

    /** For per-student stats: all records across multiple sessions. */
    List<AttendanceRecord> findByAttendanceSessionInAndStudentId(
            Collection<AttendanceSession> sessions, String studentId);

    /** Count records by status across multiple sessions (for per-student stats). */
    long countByAttendanceSessionInAndStudentIdAndStatus(
            Collection<AttendanceSession> sessions, String studentId, AttendanceStatus status);

    /** All records for a session — used in history detail view. */
    List<AttendanceRecord> findByAttendanceSessionOrderByStudentIdAsc(AttendanceSession session);
}
