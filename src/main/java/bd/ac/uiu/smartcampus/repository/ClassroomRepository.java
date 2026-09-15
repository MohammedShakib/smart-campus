package bd.ac.uiu.smartcampus.repository;

import bd.ac.uiu.smartcampus.model.Building;
import bd.ac.uiu.smartcampus.model.Classroom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClassroomRepository extends JpaRepository<Classroom, Long> {
    boolean existsByRoomNumber(String roomNumber);
    Optional<Classroom> findByRoomNumber(String roomNumber);
    List<Classroom> findAllByOrderByFloorAscRoomNumberAsc();
    boolean existsByBuildingRefAndFloorGreaterThan(Building buildingRef, int floor);
}
