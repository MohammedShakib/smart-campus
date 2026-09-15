package bd.ac.uiu.smartcampus.controller;

import bd.ac.uiu.smartcampus.dto.BuildingDto;
import bd.ac.uiu.smartcampus.service.BuildingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/buildings")
@PreAuthorize("hasRole('ADMIN')")
public class BuildingController {

    private final BuildingService buildingService;

    public BuildingController(BuildingService buildingService) {
        this.buildingService = buildingService;
    }

    @GetMapping
    public ResponseEntity<List<BuildingDto>> getAllBuildings() {
        return ResponseEntity.ok(buildingService.getAllBuildings());
    }

    @PostMapping
    public ResponseEntity<BuildingDto> createBuilding(@RequestBody BuildingDto request, Authentication authentication) {
        return ResponseEntity.ok(buildingService.createBuilding(request, authentication.getName()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BuildingDto> updateBuilding(@PathVariable Long id, @RequestBody BuildingDto request, Authentication authentication) {
        return ResponseEntity.ok(buildingService.updateBuilding(id, request, authentication.getName()));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<BuildingDto> toggleStatus(@PathVariable Long id, @RequestBody Map<String, Boolean> payload, Authentication authentication) {
        Boolean active = payload.get("active");
        if (active == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "active is required.");
        }
        return ResponseEntity.ok(buildingService.toggleStatus(id, active, authentication.getName()));
    }
}
