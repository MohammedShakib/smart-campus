package bd.ac.uiu.smartcampus.repository;

import bd.ac.uiu.smartcampus.model.FacultyOfficeHourSlot;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface FacultyOfficeHourSlotRepository extends JpaRepository<FacultyOfficeHourSlot, Long> {

    /**
     * Dual concurrency safeguard: Pessimistic write lock ensuring that concurrent transactions
     * block and serialize while acquiring and checking slot status.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM FacultyOfficeHourSlot s WHERE s.id = :id")
    Optional<FacultyOfficeHourSlot> findSlotWithLockById(@Param("id") Long id);

    List<FacultyOfficeHourSlot> findByStatusOrderBySlotDateAscStartTimeAsc(FacultyOfficeHourSlot.SlotStatus status);

    List<FacultyOfficeHourSlot> findByTeacherEmailOrderBySlotDateAscStartTimeAsc(String teacherEmail);

    List<FacultyOfficeHourSlot> findByBookedStudentIdOrderBySlotDateDescStartTimeDesc(String bookedStudentId);

    List<FacultyOfficeHourSlot> findByTeacherEmailAndSlotDateGreaterThanEqualOrderBySlotDateAscStartTimeAsc(
            String teacherEmail, LocalDate minDate);

    boolean existsByTeacherEmailAndSlotDateAndStartTime(String teacherEmail, LocalDate slotDate, java.time.LocalTime startTime);

    boolean existsByTeacherEmail(String teacherEmail);

    boolean existsByBookedStudentId(String bookedStudentId);
}
