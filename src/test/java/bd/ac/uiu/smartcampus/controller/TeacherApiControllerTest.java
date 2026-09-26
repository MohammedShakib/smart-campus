package bd.ac.uiu.smartcampus.controller;

import bd.ac.uiu.smartcampus.dto.RosterStudentDto;
import bd.ac.uiu.smartcampus.dto.TeacherNoticeRequest;
import bd.ac.uiu.smartcampus.model.CampusNotice;
import bd.ac.uiu.smartcampus.model.NotificationType;
import bd.ac.uiu.smartcampus.model.Role;
import bd.ac.uiu.smartcampus.model.User;
import bd.ac.uiu.smartcampus.repository.CampusNoticeRepository;
import bd.ac.uiu.smartcampus.repository.UserRepository;
import bd.ac.uiu.smartcampus.security.CustomUserDetails;
import bd.ac.uiu.smartcampus.service.FacultyOfficeHourService;
import bd.ac.uiu.smartcampus.service.NotificationService;
import bd.ac.uiu.smartcampus.service.StudentPortalService;
import bd.ac.uiu.smartcampus.service.TeacherDashboardService;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TeacherApiControllerTest {

    private final TeacherDashboardService teacherService = mock(TeacherDashboardService.class);
    private final CampusNoticeRepository noticeRepository = mock(CampusNoticeRepository.class);
    private final StudentPortalService studentPortalService = mock(StudentPortalService.class);
    private final FacultyOfficeHourService officeHourService = mock(FacultyOfficeHourService.class);
    private final NotificationService notificationService = mock(NotificationService.class);
    private final UserRepository userRepository = mock(UserRepository.class);

    private final TeacherApiController controller = new TeacherApiController(
            teacherService,
            noticeRepository,
            studentPortalService,
            officeHourService,
            notificationService,
            userRepository
    );

    @Test
    void publishAnnouncementRequiresCourseAndSection() {
        TeacherNoticeRequest request = new TeacherNoticeRequest();
        request.setTitle("Quiz");
        request.setContent("Quiz tomorrow");
        request.setSectionName("A");

        assertThatThrownBy(() -> controller.publishAnnouncement(request, teacherDetails()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Course code is required.");

        verify(noticeRepository, never()).save(any());
    }

    @Test
    void publishAnnouncementStoresClassTargetAndNotifiesOnlyRosterStudents() {
        TeacherNoticeRequest request = new TeacherNoticeRequest();
        request.setTitle("Quiz");
        request.setContent("Quiz tomorrow");
        request.setCourseCode("CSE101");
        request.setSectionName("A");

        User studentOne = user(11L, "s1@uiu.ac.bd", Role.ROLE_STUDENT);
        User studentTwo = user(12L, "s2@uiu.ac.bd", Role.ROLE_STUDENT);

        when(teacherService.getRosterStudents("teacher@uiu.ac.bd", "CSE101", "A"))
                .thenReturn(List.of(
                        new RosterStudentDto("011", "S1", "s1@uiu.ac.bd", 0, 0, 0, 0, null),
                        new RosterStudentDto("012", "S2", "s2@uiu.ac.bd", 0, 0, 0, 0, null)
                ));
        when(userRepository.findByEmail("s1@uiu.ac.bd")).thenReturn(Optional.of(studentOne));
        when(userRepository.findByEmail("s2@uiu.ac.bd")).thenReturn(Optional.of(studentTwo));
        when(noticeRepository.save(any(CampusNotice.class))).thenAnswer(invocation -> {
            CampusNotice notice = invocation.getArgument(0);
            notice.setId(99L);
            return notice;
        });

        CampusNotice saved = controller.publishAnnouncement(request, teacherDetails()).getData();

        assertThat(saved.getAudience().name()).isEqualTo("STUDENTS");
        assertThat(saved.getTargetCourseCode()).isEqualTo("CSE101");
        assertThat(saved.getTargetSectionName()).isEqualTo("A");
        verify(notificationService).createNotification(
                eq(studentOne), eq(NotificationType.ANNOUNCEMENT), eq("New academic announcement"),
                eq("Quiz"), eq("notices"), eq("99"), eq("TEACHER_ANNOUNCEMENT:99:11"));
        verify(notificationService).createNotification(
                eq(studentTwo), eq(NotificationType.ANNOUNCEMENT), eq("New academic announcement"),
                eq("Quiz"), eq("notices"), eq("99"), eq("TEACHER_ANNOUNCEMENT:99:12"));
    }

    @Test
    void publishAnnouncementRejectsUnownedClassBeforeSaving() {
        TeacherNoticeRequest request = new TeacherNoticeRequest();
        request.setTitle("Quiz");
        request.setContent("Quiz tomorrow");
        request.setCourseCode("CSE101");
        request.setSectionName("B");

        when(teacherService.getRosterStudents("teacher@uiu.ac.bd", "CSE101", "B"))
                .thenThrow(new IllegalArgumentException("You do not have a class matching that course and section."));

        assertThatThrownBy(() -> controller.publishAnnouncement(request, teacherDetails()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("You do not have a class matching that course and section.");

        verify(noticeRepository, never()).save(any());
    }

    private CustomUserDetails teacherDetails() {
        return new CustomUserDetails(user(1L, "teacher@uiu.ac.bd", Role.ROLE_TEACHER));
    }

    private User user(Long id, String email, Role role) {
        User user = new User(email, "{noop}password", "Test User", "ID-" + id, "CSE", role);
        user.setId(id);
        return user;
    }
}
