package bd.ac.uiu.smartcampus.service;

import bd.ac.uiu.smartcampus.model.Role;
import bd.ac.uiu.smartcampus.model.User;
import bd.ac.uiu.smartcampus.repository.AttendanceRecordRepository;
import bd.ac.uiu.smartcampus.repository.AttendanceSessionRepository;
import bd.ac.uiu.smartcampus.repository.ClassEnrollmentRepository;
import bd.ac.uiu.smartcampus.repository.FacultyOfficeHourSlotRepository;
import bd.ac.uiu.smartcampus.repository.TeachingScheduleRepository;
import org.springframework.stereotype.Service;

@Service
public class RoleTransitionValidator {

    private final ClassEnrollmentRepository classEnrollmentRepository;
    private final TeachingScheduleRepository teachingScheduleRepository;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final FacultyOfficeHourSlotRepository facultyOfficeHourSlotRepository;

    public RoleTransitionValidator(
            ClassEnrollmentRepository classEnrollmentRepository,
            TeachingScheduleRepository teachingScheduleRepository,
            AttendanceSessionRepository attendanceSessionRepository,
            AttendanceRecordRepository attendanceRecordRepository,
            FacultyOfficeHourSlotRepository facultyOfficeHourSlotRepository) {
        this.classEnrollmentRepository = classEnrollmentRepository;
        this.teachingScheduleRepository = teachingScheduleRepository;
        this.attendanceSessionRepository = attendanceSessionRepository;
        this.attendanceRecordRepository = attendanceRecordRepository;
        this.facultyOfficeHourSlotRepository = facultyOfficeHourSlotRepository;
    }

    public void validateRoleChange(User user, Role newRole) {
        if (user.getRole() == newRole) {
            return;
        }

        if (user.getRole() == Role.ROLE_TEACHER) {
            if (hasTeacherDependencies(user)) {
                throw new IllegalArgumentException("This Teacher has existing academic assignments and cannot change role.");
            }
        } else if (user.getRole() == Role.ROLE_STUDENT) {
            if (hasStudentDependencies(user)) {
                throw new IllegalArgumentException("This Student has existing academic or operational records and cannot change role.");
            }
        }
        
        // Unused accounts and other roles can transition if safe.
    }

    private boolean hasTeacherDependencies(User user) {
        String email = user.getEmail();
        if (teachingScheduleRepository.existsByTeacherEmail(email)) return true;
        if (classEnrollmentRepository.existsByTeacherEmail(email)) return true;
        if (attendanceSessionRepository.existsByTeacherEmail(email)) return true;
        if (facultyOfficeHourSlotRepository.existsByTeacherEmail(email)) return true;
        return false;
    }

    private boolean hasStudentDependencies(User user) {
        if (classEnrollmentRepository.existsByStudent(user)) return true;
        if (user.getStudentOrEmpId() != null) {
            if (attendanceRecordRepository.existsByStudentId(user.getStudentOrEmpId())) return true;
            if (facultyOfficeHourSlotRepository.existsByBookedStudentId(user.getStudentOrEmpId())) return true;
        }
        return false;
    }
}
