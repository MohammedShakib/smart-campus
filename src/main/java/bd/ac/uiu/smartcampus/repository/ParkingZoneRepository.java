package bd.ac.uiu.smartcampus.repository;

import bd.ac.uiu.smartcampus.model.ParkingZone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ParkingZoneRepository extends JpaRepository<ParkingZone, Long> {
    Optional<ParkingZone> findByZoneCode(String zoneCode);
    boolean existsByZoneCode(String zoneCode);
}
