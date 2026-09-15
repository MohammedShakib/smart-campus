package bd.ac.uiu.smartcampus.repository;

import bd.ac.uiu.smartcampus.model.Bus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BusRepository extends JpaRepository<Bus, Long> {
    Optional<Bus> findByBusCode(String busCode);
    Optional<Bus> findByRegistrationNumber(String registrationNumber);
}
