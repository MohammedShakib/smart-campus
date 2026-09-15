package bd.ac.uiu.smartcampus.service;

import bd.ac.uiu.smartcampus.dto.ClassroomDto;
import bd.ac.uiu.smartcampus.model.AdminActionLog;
import bd.ac.uiu.smartcampus.model.Building;
import bd.ac.uiu.smartcampus.model.Classroom;
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
public class ClassroomAdminService {

    private final ClassroomRepository classroomRepository;
    private final BuildingRepository buildingRepository;
    private final AdminActionLogRepository actionLogRepository;

    public ClassroomAdminService(ClassroomRepository classroomRepository, BuildingRepository buildingRepository, AdminActionLogRepository actionLogRepository) {
        this.classroomRepository = classroomRepository;
        this.buildingRepository = buildingRepository;
        this.actionLogRepository = actionLogRepository;
    }

    public List<ClassroomDto> getAllClassrooms() {
        return classroomRepository.findAll().stream()
                .map(ClassroomDto::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public ClassroomDto createClassroom(ClassroomDto request, String adminEmail) {
        String roomNumber = require(request.getRoomNumber(), "Room number is required.");
        validateCapacity(request.getCapacity());
        validateFloor(request.getFloor());
        validatePower(request.getPowerKW());
        if (classroomRepository.existsByRoomNumber(roomNumber)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Room number already exists.");
        }
        
        Building buildingRef = null;
        if (request.getBuildingId() != null) {
            buildingRef = buildingRepository.findById(request.getBuildingId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Building not found"));
            validateRoomInsideBuilding(buildingRef, request.getFloor());
        }
        
        Classroom room = new Classroom(roomNumber, request.getCapacity(), request.getFloor(), request.isOccupied(),
                request.getPowerKW(), resolveBuildingLabel(request.getBuilding(), buildingRef), cleanOptional(request.getRoomType()));
        room.setBuildingRef(buildingRef);
        room.setActive(request.isActive());
        
        Classroom saved = classroomRepository.save(room);
        
        actionLogRepository.save(new AdminActionLog(
            adminEmail,
            "CLASSROOM_CREATED",
            "Created classroom: " + saved.getRoomNumber()
        ));
        
        return new ClassroomDto(saved);
    }

    @Transactional
    public ClassroomDto updateClassroom(Long id, ClassroomDto request, String adminEmail) {
        Classroom room = classroomRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Classroom not found"));

        String roomNumber = require(request.getRoomNumber(), "Room number is required.");
        validateCapacity(request.getCapacity());
        validateFloor(request.getFloor());
        validatePower(request.getPowerKW());
        if (!room.getRoomNumber().equalsIgnoreCase(roomNumber) && classroomRepository.existsByRoomNumber(roomNumber)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Room number already exists.");
        }
        
        Building buildingRef = null;
        if (request.getBuildingId() != null) {
            buildingRef = buildingRepository.findById(request.getBuildingId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Building not found"));
            validateRoomInsideBuilding(buildingRef, request.getFloor());
        }
        
        room.setRoomNumber(roomNumber);
        room.setCapacity(request.getCapacity());
        room.setFloor(request.getFloor());
        room.setOccupied(request.isOccupied());
        room.setPowerKW(request.getPowerKW());
        room.setRoomType(cleanOptional(request.getRoomType()));
        room.setActive(request.isActive());
        room.setBuilding(resolveBuildingLabel(request.getBuilding(), buildingRef));
        room.setBuildingRef(buildingRef);
        
        Classroom saved = classroomRepository.save(room);
        
        actionLogRepository.save(new AdminActionLog(
            adminEmail,
            "CLASSROOM_UPDATED",
            "Updated classroom: " + saved.getRoomNumber()
        ));
        
        return new ClassroomDto(saved);
    }

    @Transactional
    public ClassroomDto toggleStatus(Long id, boolean active, String adminEmail) {
        Classroom room = classroomRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Classroom not found"));

        room.setActive(active);
        Classroom saved = classroomRepository.save(room);

        actionLogRepository.save(new AdminActionLog(
            adminEmail,
            active ? "CLASSROOM_ENABLED" : "CLASSROOM_DISABLED",
            (active ? "Enabled" : "Disabled") + " classroom: " + saved.getRoomNumber()
        ));

        return new ClassroomDto(saved);
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

    private String resolveBuildingLabel(String legacyBuilding, Building buildingRef) {
        if (buildingRef != null) {
            return buildingRef.getName();
        }
        return cleanOptional(legacyBuilding);
    }

    private void validateCapacity(int capacity) {
        if (capacity <= 0 || capacity > 1000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Classroom capacity must be between 1 and 1000.");
        }
    }

    private void validateFloor(int floor) {
        if (floor < 0 || floor > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Classroom floor must be between 0 and 100.");
        }
    }

    private void validatePower(double powerKW) {
        if (powerKW < 0 || powerKW > 250) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Power load must be between 0 and 250 kW.");
        }
    }

    private void validateRoomInsideBuilding(Building building, int floor) {
        if (floor > building.getNumberOfFloors()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Classroom floor cannot exceed the selected building floor count.");
        }
    }
}
