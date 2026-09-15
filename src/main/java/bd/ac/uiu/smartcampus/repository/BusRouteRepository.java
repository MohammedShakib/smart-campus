package bd.ac.uiu.smartcampus.repository;

import bd.ac.uiu.smartcampus.model.BusRoute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BusRouteRepository extends JpaRepository<BusRoute, Long> {
    Optional<BusRoute> findByRouteCode(String routeCode);
}
