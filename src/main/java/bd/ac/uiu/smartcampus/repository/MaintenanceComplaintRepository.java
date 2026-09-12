package bd.ac.uiu.smartcampus.repository;

import bd.ac.uiu.smartcampus.model.MaintenanceComplaint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaintenanceComplaintRepository extends JpaRepository<MaintenanceComplaint, Long> {
    List<MaintenanceComplaint> findByStatusOrderByReportedAtAsc(String status);
    List<MaintenanceComplaint> findByStudentIdOrderByReportedAtDesc(String studentId);
    long countByStatus(String status);
}
