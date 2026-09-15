package bd.ac.uiu.smartcampus.service;

import bd.ac.uiu.smartcampus.dto.BuildingDto;
import bd.ac.uiu.smartcampus.model.AdminActionLog;
import bd.ac.uiu.smartcampus.model.Building;
import bd.ac.uiu.smartcampus.repository.AdminActionLogRepository;
import bd.ac.uiu.smartcampus.repository.BuildingRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class BuildingService {

    private final BuildingRepository buildingRepository;
    private final AdminActionLogRepository actionLogRepository;

    public BuildingService(BuildingRepository buildingRepository, AdminActionLogRepository actionLogRepository) {
        this.buildingRepository = buildingRepository;
        this.actionLogRepository = actionLogRepository;
    }

    public List<BuildingDto> getAllBuildings() {
        return buildingRepository.findAll().stream()
                .map(BuildingDto::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public BuildingDto createBuilding(BuildingDto request, String adminEmail) {
        if (buildingRepository.existsByCode(request.getCode())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Building code already exists.");
        }
        
        Building building = new Building(request.getCode(), request.getName(), request.getNumberOfFloors(), request.getDescription());
        building.setActive(request.isActive());
        
        Building saved = buildingRepository.save(building);
        
        actionLogRepository.save(new AdminActionLog(
            adminEmail,
            "BUILDING_CREATED",
            "Created building: " + saved.getCode()
        ));
        
        return new BuildingDto(saved);
    }

    @Transactional
    public BuildingDto updateBuilding(Long id, BuildingDto request, String adminEmail) {
        Building building = buildingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Building not found"));
                
        if (!building.getCode().equals(request.getCode()) && buildingRepository.existsByCode(request.getCode())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Building code already exists.");
        }
        
        building.setCode(request.getCode());
        building.setName(request.getName());
        building.setNumberOfFloors(request.getNumberOfFloors());
        building.setDescription(request.getDescription());
        building.setActive(request.isActive());
        
        Building saved = buildingRepository.save(building);
        
        actionLogRepository.save(new AdminActionLog(
            adminEmail,
            "BUILDING_UPDATED",
            "Updated building: " + saved.getCode()
        ));
        
        return new BuildingDto(saved);
    }
    
    @Transactional
    public BuildingDto toggleStatus(Long id, boolean active, String adminEmail) {
        Building building = buildingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Building not found"));
                
        building.setActive(active);
        Building saved = buildingRepository.save(building);
        
        actionLogRepository.save(new AdminActionLog(
            adminEmail,
            active ? "BUILDING_ENABLED" : "BUILDING_DISABLED",
            (active ? "Enabled" : "Disabled") + " building: " + saved.getCode()
        ));
        
        return new BuildingDto(saved);
    }
}
