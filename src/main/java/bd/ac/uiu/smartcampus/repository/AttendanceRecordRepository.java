package bd.ac.uiu.smartcampus.repository;

import bd.ac.uiu.smartcampus.model.AttendanceRecord;
import bd.ac.uiu.smartcampus.model.AttendanceSession;
import bd.ac.uiu.smartcampus.model.AttendanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {
    List<AttendanceRecord> findByAttendanceSessionOrderByCheckedInAtAsc(AttendanceSession attendanceSession);
    Optional<AttendanceRecord> findByAttendanceSessionAndStudentId(AttendanceSession attendanceSession, String studentId);
    long countByAttendanceSessionAndStatus(AttendanceSession attendanceSession, AttendanceStatus status);
}
