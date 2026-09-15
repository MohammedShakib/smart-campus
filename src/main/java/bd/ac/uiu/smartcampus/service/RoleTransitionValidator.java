package bd.ac.uiu.smartcampus.service;

import bd.ac.uiu.smartcampus.model.Role;
import bd.ac.uiu.smartcampus.model.User;
import bd.ac.uiu.smartcampus.repository.AttendanceRecordRepository;
import bd.ac.uiu.smartcampus.repository.AttendanceSessionRepository;
import bd.ac.uiu.smartcampus.repository.ClassEnrollmentRepository;
import bd.ac.uiu.smartcampus.repository.FacultyOfficeHourSlotRepository;
import bd.ac.uiu.smartcampus.repository.AbsenceExcuseRepository;
import bd.ac.uiu.smartcampus.repository.LostFoundItemRepository;
import bd.ac.uiu.smartcampus.repository.MaintenanceComplaintRepository;
import bd.ac.uiu.smartcampus.repository.RoomReservationRepository;
import bd.ac.uiu.smartcampus.repository.TeachingScheduleRepository;
import bd.ac.uiu.smartcampus.repository.UserNotificationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RoleTransitionValidator {

    private final ClassEnrollmentRepository classEnrollmentRepository;
    private final TeachingScheduleRepository teachingScheduleRepository;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final FacultyOfficeHourSlotRepository facultyOfficeHourSlotRepository;
    private final AbsenceExcuseRepository absenceExcuseRepository;
    private final RoomReservationRepository roomReservationRepository;
    private final MaintenanceComplaintRepository maintenanceComplaintRepository;
    private final LostFoundItemRepository lostFoundItemRepository;
    private final UserNotificationRepository userNotificationRepository;

    public RoleTransitionValidator(
            ClassEnrollmentRepository classEnrollmentRepository,
            TeachingScheduleRepository teachingScheduleRepository,
            AttendanceSessionRepository attendanceSessionRepository,
            AttendanceRecordRepository attendanceRecordRepository,
            FacultyOfficeHourSlotRepository facultyOfficeHourSlotRepository,
            AbsenceExcuseRepository absenceExcuseRepository,
            RoomReservationRepository roomReservationRepository,
            MaintenanceComplaintRepository maintenanceComplaintRepository,
            LostFoundItemRepository lostFoundItemRepository,
            UserNotificationRepository userNotificationRepository) {
        this.classEnrollmentRepository = classEnrollmentRepository;
        this.teachingScheduleRepository = teachingScheduleRepository;
        this.attendanceSessionRepository = attendanceSessionRepository;
        this.attendanceRecordRepository = attendanceRecordRepository;
        this.facultyOfficeHourSlotRepository = facultyOfficeHourSlotRepository;
        this.absenceExcuseRepository = absenceExcuseRepository;
        this.roomReservationRepository = roomReservationRepository;
        this.maintenanceComplaintRepository = maintenanceComplaintRepository;
        this.lostFoundItemRepository = lostFoundItemRepository;
        this.userNotificationRepository = userNotificationRepository;
    }

    public void validateRoleChange(User user, Role newRole) {
        if (user.getRole() == newRole) {
            return;
        }

        if (user.getRole() == Role.ROLE_TEACHER) {
            if (hasTeacherDependencies(user)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "This Teacher has existing academic or operational records and cannot change role.");
            }
        } else if (user.getRole() == Role.ROLE_STUDENT) {
            if (hasStudentDependencies(user)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "This Student has existing academic or operational records and cannot change role.");
            }
        }
        
        // Unused accounts and other roles can transition if safe.
    }

    private boolean hasTeacherDependencies(User user) {
        String email = user.getEmail();
        if (teachingScheduleRepository.existsByTeacherEmail(email)) return true;
        if (classEnrollmentRepository.existsByTeacherEmail(email)) return true;
        if (attendanceSessionRepository.existsByTeacherEmail(email)) return true;
        if (absenceExcuseRepository.existsByTeacherEmail(email)) return true;
        if (facultyOfficeHourSlotRepository.existsByTeacherEmail(email)) return true;
        if (roomReservationRepository.existsByTeacherEmail(email)) return true;
        if (userNotificationRepository.existsByRecipient(user)) return true;
        String employeeId = user.getStudentOrEmpId();
        if (employeeId != null) {
            if (maintenanceComplaintRepository.existsByReporterIdAndReporterRole(employeeId, Role.ROLE_TEACHER.name())) return true;
        }
        return false;
    }

    private boolean hasStudentDependencies(User user) {
        if (classEnrollmentRepository.existsByStudent(user)) return true;
        if (absenceExcuseRepository.existsByStudentEmail(user.getEmail())) return true;
        if (lostFoundItemRepository.existsByReporterEmail(user.getEmail())) return true;
        if (userNotificationRepository.existsByRecipient(user)) return true;
        if (user.getStudentOrEmpId() != null) {
            if (attendanceRecordRepository.existsByStudentId(user.getStudentOrEmpId())) return true;
            if (absenceExcuseRepository.existsByStudentId(user.getStudentOrEmpId())) return true;
            if (facultyOfficeHourSlotRepository.existsByBookedStudentId(user.getStudentOrEmpId())) return true;
            if (maintenanceComplaintRepository.existsByStudentId(user.getStudentOrEmpId())) return true;
            if (maintenanceComplaintRepository.existsByReporterId(user.getStudentOrEmpId())) return true;
            if (lostFoundItemRepository.existsByReporterId(user.getStudentOrEmpId())) return true;
            if (lostFoundItemRepository.existsByClaimedByStudentId(user.getStudentOrEmpId())) return true;
        }
        return false;
    }
}
