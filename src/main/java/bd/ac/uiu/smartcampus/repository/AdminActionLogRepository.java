package bd.ac.uiu.smartcampus.repository;

import bd.ac.uiu.smartcampus.model.AdminActionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminActionLogRepository extends JpaRepository<AdminActionLog, Long> {
    List<AdminActionLog> findTop20ByOrderByTimestampDesc();
}
