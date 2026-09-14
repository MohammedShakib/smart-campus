package bd.ac.uiu.smartcampus.repository;

import bd.ac.uiu.smartcampus.model.SecurityIncident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SecurityIncidentRepository extends JpaRepository<SecurityIncident, Long> {

    List<SecurityIncident> findTop50ByOrderByReportedAtDesc();

    List<SecurityIncident> findByStatusOrderByReportedAtDesc(String status);

    long countByStatus(String status);

    @Query("""
           SELECT i FROM SecurityIncident i
           WHERE LOWER(i.title) LIKE LOWER(CONCAT('%', :query, '%'))
              OR LOWER(i.location) LIKE LOWER(CONCAT('%', :query, '%'))
              OR LOWER(i.incidentType) LIKE LOWER(CONCAT('%', :query, '%'))
              OR LOWER(i.reportedBy) LIKE LOWER(CONCAT('%', :query, '%'))
           ORDER BY i.reportedAt DESC
           """)
    List<SecurityIncident> searchIncidents(@Param("query") String query);
}
