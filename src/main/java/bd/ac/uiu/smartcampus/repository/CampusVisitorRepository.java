package bd.ac.uiu.smartcampus.repository;

import bd.ac.uiu.smartcampus.model.CampusVisitor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CampusVisitorRepository extends JpaRepository<CampusVisitor, Long> {

    Optional<CampusVisitor> findByPassCode(String passCode);

    List<CampusVisitor> findByStatusOrderByCreatedAtDesc(String status);

    List<CampusVisitor> findByVisitDateOrderByExpectedEntryTimeAsc(LocalDate visitDate);

    List<CampusVisitor> findTop50ByOrderByCreatedAtDesc();

    long countByStatus(String status);

    long countByVisitDate(LocalDate visitDate);

    @Query("""
           SELECT v FROM CampusVisitor v
           WHERE LOWER(v.visitorName) LIKE LOWER(CONCAT('%', :query, '%'))
              OR LOWER(v.phone) LIKE LOWER(CONCAT('%', :query, '%'))
              OR LOWER(v.passCode) LIKE LOWER(CONCAT('%', :query, '%'))
              OR LOWER(v.hostName) LIKE LOWER(CONCAT('%', :query, '%'))
              OR LOWER(v.vehicleNumber) LIKE LOWER(CONCAT('%', :query, '%'))
           ORDER BY v.createdAt DESC
           """)
    List<CampusVisitor> searchVisitors(@Param("query") String query);
}
