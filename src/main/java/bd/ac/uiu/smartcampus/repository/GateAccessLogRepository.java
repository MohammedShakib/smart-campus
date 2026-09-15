package bd.ac.uiu.smartcampus.repository;

import bd.ac.uiu.smartcampus.model.GateAccessLog;
import bd.ac.uiu.smartcampus.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface GateAccessLogRepository extends JpaRepository<GateAccessLog, Long> {

    List<GateAccessLog> findByTimestampBetweenOrderByTimestampDesc(LocalDateTime start, LocalDateTime end);

    Optional<GateAccessLog> findFirstByUserOrderByTimestampDesc(User user);
    
    long countByTimestampBetweenAndAccessTypeAndResult(LocalDateTime start, LocalDateTime end, String accessType, String result);

    long countByTimestampBetweenAndResult(LocalDateTime start, LocalDateTime end, String result);
    
    List<GateAccessLog> findTop100ByOrderByTimestampDesc();
}
