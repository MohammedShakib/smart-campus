package bd.ac.uiu.smartcampus.repository;

import bd.ac.uiu.smartcampus.model.EmergencyAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmergencyAlertRepository extends JpaRepository<EmergencyAlert, Long> {
    List<EmergencyAlert> findByActiveTrueOrderByBroadcastTimeDesc();
    List<EmergencyAlert> findTop20ByOrderByBroadcastTimeDesc();
}
