package bd.ac.uiu.smartcampus.service;

import bd.ac.uiu.smartcampus.dto.DepartmentDto;
import bd.ac.uiu.smartcampus.model.AdminActionLog;
import bd.ac.uiu.smartcampus.model.Department;
import bd.ac.uiu.smartcampus.model.User;
import bd.ac.uiu.smartcampus.repository.AdminActionLogRepository;
import bd.ac.uiu.smartcampus.repository.DepartmentRepository;
import bd.ac.uiu.smartcampus.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final AdminActionLogRepository actionLogRepository;
    private final UserRepository userRepository;

    public DepartmentService(DepartmentRepository departmentRepository,
                             AdminActionLogRepository actionLogRepository,
                             UserRepository userRepository) {
        this.departmentRepository = departmentRepository;
        this.actionLogRepository = actionLogRepository;
        this.userRepository = userRepository;
    }

    public List<DepartmentDto> getAllDepartments() {
        return departmentRepository.findAll().stream()
                .map(DepartmentDto::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public DepartmentDto createDepartment(DepartmentDto request, String adminEmail) {
        String code = require(request.getCode(), "Department code is required.").toUpperCase();
        String name = require(request.getName(), "Department name is required.");
        if (departmentRepository.existsByCode(code)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Department code already exists.");
        }
        departmentRepository.findByName(name).ifPresent(existing -> {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Department name already exists.");
        });
        
        Department dept = new Department(code, name);
        dept.setActive(request.isActive());
        
        Department saved = departmentRepository.save(dept);
        
        actionLogRepository.save(new AdminActionLog(
            adminEmail,
            "DEPARTMENT_CREATED",
            "Created department: " + saved.getCode() + " - " + saved.getName()
        ));
        
        return new DepartmentDto(saved);
    }

    @Transactional
    public DepartmentDto updateDepartment(Long id, DepartmentDto request, String adminEmail) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Department not found"));

        String requestedCode = require(request.getCode(), "Department code is required.").toUpperCase();
        if (!dept.getCode().equalsIgnoreCase(requestedCode)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Department code cannot be changed after creation.");
        }
        String oldName = dept.getName();
        String newName = require(request.getName(), "Department name is required.");
        departmentRepository.findByName(newName)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Department name already exists.");
                });
        
        dept.setName(newName);
        dept.setActive(request.isActive());
        dept.setUpdatedAt(LocalDateTime.now());
        
        Department saved = departmentRepository.save(dept);
        if (!oldName.equals(newName)) {
            List<User> legacyUsers = userRepository.findByDepartment(oldName);
            for (User user : legacyUsers) {
                user.setDepartment(newName);
                user.setDepartmentRef(saved);
            }
            userRepository.saveAll(legacyUsers);
        }
        
        actionLogRepository.save(new AdminActionLog(
            adminEmail,
            "DEPARTMENT_UPDATED",
            "Updated department: " + saved.getCode()
        ));
        
        return new DepartmentDto(saved);
    }
    
    @Transactional
    public DepartmentDto toggleStatus(Long id, boolean active, String adminEmail) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Department not found"));
                
        dept.setActive(active);
        dept.setUpdatedAt(LocalDateTime.now());
        Department saved = departmentRepository.save(dept);
        
        actionLogRepository.save(new AdminActionLog(
            adminEmail,
            active ? "DEPARTMENT_ENABLED" : "DEPARTMENT_DISABLED",
            (active ? "Enabled" : "Disabled") + " department: " + saved.getCode()
        ));
        
        return new DepartmentDto(saved);
    }

    private String require(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        return value.trim();
    }
}
