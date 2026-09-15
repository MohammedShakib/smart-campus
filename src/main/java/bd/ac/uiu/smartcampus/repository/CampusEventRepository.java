package bd.ac.uiu.smartcampus.repository;

import bd.ac.uiu.smartcampus.model.CampusEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CampusEventRepository extends JpaRepository<CampusEvent, Long> {
    List<CampusEvent> findByEventDateGreaterThanEqualOrderByEventDateAsc(LocalDate date);
}
