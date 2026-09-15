package bd.ac.uiu.smartcampus.service;

import bd.ac.uiu.smartcampus.dto.BuildingDto;
import bd.ac.uiu.smartcampus.model.AdminActionLog;
import bd.ac.uiu.smartcampus.model.Building;
import bd.ac.uiu.smartcampus.repository.AdminActionLogRepository;
import bd.ac.uiu.smartcampus.repository.BuildingRepository;
import bd.ac.uiu.smartcampus.repository.ClassroomRepository;
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
    private final ClassroomRepository classroomRepository;

    public BuildingService(BuildingRepository buildingRepository,
                           AdminActionLogRepository actionLogRepository,
                           ClassroomRepository classroomRepository) {
        this.buildingRepository = buildingRepository;
        this.actionLogRepository = actionLogRepository;
        this.classroomRepository = classroomRepository;
    }

    public List<BuildingDto> getAllBuildings() {
        return buildingRepository.findAll().stream()
                .map(BuildingDto::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public BuildingDto createBuilding(BuildingDto request, String adminEmail) {
        String code = require(request.getCode(), "Building code is required.").toUpperCase();
        String name = require(request.getName(), "Building name is required.");
        validateFloors(request.getNumberOfFloors());
        if (buildingRepository.existsByCode(code)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Building code already exists.");
        }
        
        Building building = new Building(code, name, request.getNumberOfFloors(), cleanOptional(request.getDescription()));
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

        String requestedCode = require(request.getCode(), "Building code is required.").toUpperCase();
        if (!building.getCode().equalsIgnoreCase(requestedCode)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Building code cannot be changed after creation.");
        }
        String name = require(request.getName(), "Building name is required.");
        validateFloors(request.getNumberOfFloors());
        if (classroomRepository.existsByBuildingRefAndFloorGreaterThan(building, request.getNumberOfFloors())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Building floors cannot be lower than existing classroom floors.");
        }
        
        building.setName(name);
        building.setNumberOfFloors(request.getNumberOfFloors());
        building.setDescription(cleanOptional(request.getDescription()));
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

    private String require(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        return value.trim();
    }

    private String cleanOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private void validateFloors(int floors) {
        if (floors <= 0 || floors > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Number of floors must be between 1 and 100.");
        }
    }
}
