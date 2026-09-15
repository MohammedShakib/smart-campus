package bd.ac.uiu.smartcampus.repository;

import bd.ac.uiu.smartcampus.model.Building;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BuildingRepository extends JpaRepository<Building, Long> {
    Optional<Building> findByCode(String code);
    boolean existsByCode(String code);
}
