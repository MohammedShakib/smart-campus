package bd.ac.uiu.smartcampus.service;

import bd.ac.uiu.smartcampus.dto.CourseDto;
import bd.ac.uiu.smartcampus.model.AdminActionLog;
import bd.ac.uiu.smartcampus.model.Course;
import bd.ac.uiu.smartcampus.model.Department;
import bd.ac.uiu.smartcampus.repository.AdminActionLogRepository;
import bd.ac.uiu.smartcampus.repository.CourseRepository;
import bd.ac.uiu.smartcampus.repository.DepartmentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CourseService {

    private final CourseRepository courseRepository;
    private final DepartmentRepository departmentRepository;
    private final AdminActionLogRepository actionLogRepository;

    public CourseService(CourseRepository courseRepository, DepartmentRepository departmentRepository, AdminActionLogRepository actionLogRepository) {
        this.courseRepository = courseRepository;
        this.departmentRepository = departmentRepository;
        this.actionLogRepository = actionLogRepository;
    }

    public List<CourseDto> getAllCourses() {
        return courseRepository.findAll().stream()
                .map(CourseDto::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public CourseDto createCourse(CourseDto request, String adminEmail) {
        if (courseRepository.existsByCourseCode(request.getCourseCode())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Course code already exists.");
        }
        
        Department dept = null;
        if (request.getDepartmentId() != null) {
            dept = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Department not found"));
        }
        
        Course course = new Course(request.getCourseCode(), request.getCourseName(), dept, request.getCreditHours());
        course.setActive(request.isActive());
        
        Course saved = courseRepository.save(course);
        
        actionLogRepository.save(new AdminActionLog(
            adminEmail,
            "COURSE_CREATED",
            "Created course: " + saved.getCourseCode()
        ));
        
        return new CourseDto(saved);
    }

    @Transactional
    public CourseDto updateCourse(Long id, CourseDto request, String adminEmail) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
                
        if (!course.getCourseCode().equals(request.getCourseCode()) && courseRepository.existsByCourseCode(request.getCourseCode())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Course code already exists.");
        }
        
        Department dept = null;
        if (request.getDepartmentId() != null) {
            dept = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Department not found"));
        }
        
        course.setCourseCode(request.getCourseCode());
        course.setCourseName(request.getCourseName());
        course.setCreditHours(request.getCreditHours());
        course.setDepartment(dept);
        course.setActive(request.isActive());
        course.setUpdatedAt(LocalDateTime.now());
        
        Course saved = courseRepository.save(course);
        
        actionLogRepository.save(new AdminActionLog(
            adminEmail,
            "COURSE_UPDATED",
            "Updated course: " + saved.getCourseCode()
        ));
        
        return new CourseDto(saved);
    }
    
    @Transactional
    public CourseDto toggleStatus(Long id, boolean active, String adminEmail) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
                
        course.setActive(active);
        course.setUpdatedAt(LocalDateTime.now());
        Course saved = courseRepository.save(course);
        
        actionLogRepository.save(new AdminActionLog(
            adminEmail,
            active ? "COURSE_ENABLED" : "COURSE_DISABLED",
            (active ? "Enabled" : "Disabled") + " course: " + saved.getCourseCode()
        ));
        
        return new CourseDto(saved);
    }
}
