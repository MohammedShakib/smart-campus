package bd.ac.uiu.smartcampus.service;

import bd.ac.uiu.smartcampus.dto.CourseDto;
import bd.ac.uiu.smartcampus.model.AdminActionLog;
import bd.ac.uiu.smartcampus.model.Course;
import bd.ac.uiu.smartcampus.model.Department;
import bd.ac.uiu.smartcampus.repository.AdminActionLogRepository;
import bd.ac.uiu.smartcampus.repository.CourseRepository;
import bd.ac.uiu.smartcampus.repository.DepartmentRepository;
import bd.ac.uiu.smartcampus.repository.TeachingScheduleRepository;
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
    private final TeachingScheduleRepository teachingScheduleRepository;

    public CourseService(CourseRepository courseRepository,
                         DepartmentRepository departmentRepository,
                         AdminActionLogRepository actionLogRepository,
                         TeachingScheduleRepository teachingScheduleRepository) {
        this.courseRepository = courseRepository;
        this.departmentRepository = departmentRepository;
        this.actionLogRepository = actionLogRepository;
        this.teachingScheduleRepository = teachingScheduleRepository;
    }

    public List<CourseDto> getAllCourses() {
        return courseRepository.findAll().stream()
                .map(CourseDto::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public CourseDto createCourse(CourseDto request, String adminEmail) {
        String courseCode = require(request.getCourseCode(), "Course code is required.").toUpperCase();
        String courseName = require(request.getCourseName(), "Course name is required.");
        validateCreditHours(request.getCreditHours());
        if (courseRepository.existsByCourseCode(courseCode)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Course code already exists.");
        }
        
        Department dept = null;
        if (request.getDepartmentId() != null) {
            dept = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Department not found"));
        }
        
        Course course = new Course(courseCode, courseName, dept, request.getCreditHours());
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

        String requestedCode = require(request.getCourseCode(), "Course code is required.").toUpperCase();
        if (!course.getCourseCode().equalsIgnoreCase(requestedCode)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Course code cannot be changed after creation.");
        }
        String courseName = require(request.getCourseName(), "Course name is required.");
        validateCreditHours(request.getCreditHours());
        
        Department dept = null;
        if (request.getDepartmentId() != null) {
            dept = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Department not found"));
        }
        
        course.setCourseName(courseName);
        course.setCreditHours(request.getCreditHours());
        course.setDepartment(dept);
        course.setActive(request.isActive());
        course.setUpdatedAt(LocalDateTime.now());
        
        Course saved = courseRepository.save(course);
        teachingScheduleRepository.findByCourseCode(saved.getCourseCode()).forEach(schedule -> {
            schedule.setCourseRef(saved);
            schedule.setCourseTitle(saved.getCourseName());
            teachingScheduleRepository.save(schedule);
        });
        
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

    private String require(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        return value.trim();
    }

    private void validateCreditHours(int creditHours) {
        if (creditHours <= 0 || creditHours > 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Credit hours must be between 1 and 6.");
        }
    }
}
