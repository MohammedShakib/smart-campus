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
        if (classroomRepository.existsByRoomNumber(request.getRoomNumber())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Room number already exists.");
        }
        
        Building buildingRef = null;
        if (request.getBuildingId() != null) {
            buildingRef = buildingRepository.findById(request.getBuildingId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Building not found"));
        }
        
        Classroom room = new Classroom(request.getRoomNumber(), request.getCapacity(), request.getFloor(), request.isOccupied(), request.getPowerKW(), request.getBuilding(), request.getRoomType());
        room.setBuildingRef(buildingRef);
        
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
                
        if (!room.getRoomNumber().equals(request.getRoomNumber()) && classroomRepository.existsByRoomNumber(request.getRoomNumber())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Room number already exists.");
        }
        
        Building buildingRef = null;
        if (request.getBuildingId() != null) {
            buildingRef = buildingRepository.findById(request.getBuildingId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Building not found"));
        }
        
        room.setRoomNumber(request.getRoomNumber());
        room.setCapacity(request.getCapacity());
        room.setFloor(request.getFloor());
        room.setOccupied(request.isOccupied());
        room.setPowerKW(request.getPowerKW());
        room.setRoomType(request.getRoomType());
        room.setBuilding(request.getBuilding()); // Legacy String
        room.setBuildingRef(buildingRef);
        
        Classroom saved = classroomRepository.save(room);
        
        actionLogRepository.save(new AdminActionLog(
            adminEmail,
            "CLASSROOM_UPDATED",
            "Updated classroom: " + saved.getRoomNumber()
        ));
        
        return new ClassroomDto(saved);
    }
}
