package bd.ac.uiu.smartcampus.service;

import bd.ac.uiu.smartcampus.dto.DepartmentDto;
import bd.ac.uiu.smartcampus.model.AdminActionLog;
import bd.ac.uiu.smartcampus.model.Department;
import bd.ac.uiu.smartcampus.repository.AdminActionLogRepository;
import bd.ac.uiu.smartcampus.repository.DepartmentRepository;
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

    public DepartmentService(DepartmentRepository departmentRepository, AdminActionLogRepository actionLogRepository) {
        this.departmentRepository = departmentRepository;
        this.actionLogRepository = actionLogRepository;
    }

    public List<DepartmentDto> getAllDepartments() {
        return departmentRepository.findAll().stream()
                .map(DepartmentDto::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public DepartmentDto createDepartment(DepartmentDto request, String adminEmail) {
        if (departmentRepository.existsByCode(request.getCode())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Department code already exists.");
        }
        
        Department dept = new Department(request.getCode(), request.getName());
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
                
        if (!dept.getCode().equals(request.getCode()) && departmentRepository.existsByCode(request.getCode())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Department code already exists.");
        }
        
        dept.setCode(request.getCode());
        dept.setName(request.getName());
        dept.setActive(request.isActive());
        dept.setUpdatedAt(LocalDateTime.now());
        
        Department saved = departmentRepository.save(dept);
        
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
}
