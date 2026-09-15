package bd.ac.uiu.smartcampus.repository;

import bd.ac.uiu.smartcampus.model.RoomReservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface RoomReservationRepository extends JpaRepository<RoomReservation, Long> {
    List<RoomReservation> findByTeacherEmailOrderByReservationDateDescStartTimeDesc(String teacherEmail);

    boolean existsByTeacherEmail(String teacherEmail);

    @Query("""
           SELECT r FROM RoomReservation r
           WHERE r.roomNumber = :roomNumber
             AND r.reservationDate = :reservationDate
             AND r.status = 'RESERVED'
             AND :startTime < r.endTime
             AND :endTime > r.startTime
           """)
    List<RoomReservation> findConflicts(@Param("roomNumber") String roomNumber,
                                        @Param("reservationDate") LocalDate reservationDate,
                                        @Param("startTime") LocalTime startTime,
                                        @Param("endTime") LocalTime endTime);
}
