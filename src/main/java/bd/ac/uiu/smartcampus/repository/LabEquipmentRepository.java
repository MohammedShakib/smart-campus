package bd.ac.uiu.smartcampus.repository;

import bd.ac.uiu.smartcampus.model.LabEquipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LabEquipmentRepository extends JpaRepository<LabEquipment, Long> {

    List<LabEquipment> findByActiveTrueOrderByNameAsc();

    List<LabEquipment> findByCategoryAndActiveTrueOrderByNameAsc(LabEquipment.EquipmentCategory category);

    boolean existsByName(String name);
}
