package bd.ac.uiu.smartcampus.service;

import bd.ac.uiu.smartcampus.model.AbsenceExcuse;
import bd.ac.uiu.smartcampus.repository.AbsenceExcuseRepository;
import bd.ac.uiu.smartcampus.repository.AttendanceRecordRepository;
import bd.ac.uiu.smartcampus.repository.AttendanceSessionRepository;
import bd.ac.uiu.smartcampus.repository.CafeteriaMenuItemRepository;
import bd.ac.uiu.smartcampus.repository.CampusEventRepository;
import bd.ac.uiu.smartcampus.repository.ClassEnrollmentRepository;
import bd.ac.uiu.smartcampus.repository.EmergencyAlertRepository;
import bd.ac.uiu.smartcampus.repository.EquipmentBookingRepository;
import bd.ac.uiu.smartcampus.repository.LabEquipmentRepository;
import bd.ac.uiu.smartcampus.repository.LostFoundItemRepository;
import bd.ac.uiu.smartcampus.repository.TeachingScheduleRepository;
import bd.ac.uiu.smartcampus.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class StudentPortalServiceTest {

    private final AbsenceExcuseRepository absenceExcuseRepository = mock(AbsenceExcuseRepository.class);

    private final StudentPortalService service = new StudentPortalService(
            mock(UserRepository.class),
            mock(ClassEnrollmentRepository.class),
            mock(AttendanceSessionRepository.class),
            mock(AttendanceRecordRepository.class),
            absenceExcuseRepository,
            mock(LostFoundItemRepository.class),
            mock(LabEquipmentRepository.class),
            mock(EquipmentBookingRepository.class),
            mock(NotificationService.class),
            mock(TeachingScheduleRepository.class),
            mock(CampusEventRepository.class),
            mock(CafeteriaMenuItemRepository.class),
            mock(EmergencyAlertRepository.class)
    );

    @Test
    void teacherCanReviewOwnExcuse() {
        AbsenceExcuse excuse = excuse("teacher-a@uiu.ac.bd");
        when(absenceExcuseRepository.findByIdAndTeacherEmail(10L, "teacher-a@uiu.ac.bd"))
                .thenReturn(Optional.of(excuse));
        when(absenceExcuseRepository.save(any(AbsenceExcuse.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        AbsenceExcuse reviewed = service.reviewExcuse(10L, "teacher-a@uiu.ac.bd", "APPROVED", "Ok");

        assertThat(reviewed.getStatus()).isEqualTo(AbsenceExcuse.ExcuseStatus.APPROVED);
        assertThat(reviewed.getTeacherRemarks()).isEqualTo("Ok");
        assertThat(reviewed.getReviewedAt()).isNotNull();
        verify(absenceExcuseRepository).save(excuse);
    }

    @Test
    void otherTeacherCannotReviewExcuseAndDoesNotMutate() {
        when(absenceExcuseRepository.findByIdAndTeacherEmail(10L, "teacher-b@uiu.ac.bd"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.reviewExcuse(10L, "teacher-b@uiu.ac.bd", "APPROVED", "Ok"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Absence excuse not found or access denied.");

        verify(absenceExcuseRepository, never()).save(any());
    }

    @Test
    void invalidReviewStatusIsCleanBusinessError() {
        when(absenceExcuseRepository.findByIdAndTeacherEmail(10L, "teacher-a@uiu.ac.bd"))
                .thenReturn(Optional.of(excuse("teacher-a@uiu.ac.bd")));

        assertThatThrownBy(() -> service.reviewExcuse(10L, "teacher-a@uiu.ac.bd", "MAYBE", "Ok"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Invalid excuse status.");

        verify(absenceExcuseRepository, never()).save(any());
    }

    private AbsenceExcuse excuse(String teacherEmail) {
        AbsenceExcuse excuse = new AbsenceExcuse(
                "011",
                "Student One",
                "s1@uiu.ac.bd",
                "CSE101",
                "Intro",
                "A",
                teacherEmail,
                LocalDate.now(),
                "MEDICAL",
                "Sick",
                null
        );
        excuse.setId(10L);
        return excuse;
    }
}
