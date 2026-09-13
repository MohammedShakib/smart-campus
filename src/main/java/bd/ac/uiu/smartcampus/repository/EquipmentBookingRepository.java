package bd.ac.uiu.smartcampus.repository;

import bd.ac.uiu.smartcampus.model.EquipmentBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EquipmentBookingRepository extends JpaRepository<EquipmentBooking, Long> {

    List<EquipmentBooking> findByStudentIdOrderByRequestedAtDesc(String studentId);

    List<EquipmentBooking> findAllByOrderByRequestedAtDesc();

    List<EquipmentBooking> findByStatusOrderByRequestedAtDesc(EquipmentBooking.BookingStatus status);

    long countByStudentIdAndStatus(String studentId, EquipmentBooking.BookingStatus status);
}
