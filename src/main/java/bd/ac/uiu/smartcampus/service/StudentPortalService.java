package bd.ac.uiu.smartcampus.service;

import bd.ac.uiu.smartcampus.dto.*;
import bd.ac.uiu.smartcampus.model.*;
import bd.ac.uiu.smartcampus.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import bd.ac.uiu.smartcampus.service.NotificationService;

@Service
public class StudentPortalService {

    private static final Logger logger = LoggerFactory.getLogger(StudentPortalService.class);

    private final UserRepository userRepository;
    private final ClassEnrollmentRepository enrollmentRepository;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final AbsenceExcuseRepository absenceExcuseRepository;
    private final LostFoundItemRepository lostFoundItemRepository;
    private final LabEquipmentRepository labEquipmentRepository;
    private final EquipmentBookingRepository equipmentBookingRepository;
    private final NotificationService notificationService;
    private final TeachingScheduleRepository teachingScheduleRepository;
    private final CampusEventRepository eventRepository;
    private final CafeteriaMenuItemRepository cafeteriaMenuRepository;
    private final EmergencyAlertRepository emergencyAlertRepository;

    public StudentPortalService(UserRepository userRepository,
                                ClassEnrollmentRepository enrollmentRepository,
                                AttendanceSessionRepository attendanceSessionRepository,
                                AttendanceRecordRepository attendanceRecordRepository,
                                AbsenceExcuseRepository absenceExcuseRepository,
                                LostFoundItemRepository lostFoundItemRepository,
                                LabEquipmentRepository labEquipmentRepository,
                                EquipmentBookingRepository equipmentBookingRepository,
                                NotificationService notificationService,
                                TeachingScheduleRepository teachingScheduleRepository,
                                CampusEventRepository eventRepository,
                                CafeteriaMenuItemRepository cafeteriaMenuRepository,
                                EmergencyAlertRepository emergencyAlertRepository) {
        this.userRepository = userRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.attendanceSessionRepository = attendanceSessionRepository;
        this.attendanceRecordRepository = attendanceRecordRepository;
        this.absenceExcuseRepository = absenceExcuseRepository;
        this.lostFoundItemRepository = lostFoundItemRepository;
        this.labEquipmentRepository = labEquipmentRepository;
        this.equipmentBookingRepository = equipmentBookingRepository;
        this.notificationService = notificationService;
        this.teachingScheduleRepository = teachingScheduleRepository;
        this.eventRepository = eventRepository;
        this.cafeteriaMenuRepository = cafeteriaMenuRepository;
        this.emergencyAlertRepository = emergencyAlertRepository;
    }

    // ─────────────────────────────────────────────────────────
    // 1. ATTENDANCE HISTORY & EXCUSE SUBMISSIONS
    // ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<StudentAttendanceCourseSummaryDto> getStudentAttendanceSummaries(String studentEmail, String studentId) {
        User student = userRepository.findByEmail(studentEmail).orElse(null);
        if (student == null) {
            student = userRepository.findByStudentOrEmpId(studentId).orElse(null);
        }
        if (student == null) {
            return Collections.emptyList();
        }

        List<ClassEnrollment> enrollments = enrollmentRepository.findByStudentAndActiveTrue(student);
        List<AbsenceExcuse> myExcuses = absenceExcuseRepository.findByStudentIdOrderBySubmittedAtDesc(student.getStudentOrEmpId());
        Map<String, AbsenceExcuse> excuseLookup = new HashMap<>();
        for (AbsenceExcuse exc : myExcuses) {
            String key = exc.getCourseCode() + "_" + exc.getAbsenceDate().toString();
            excuseLookup.put(key, exc);
        }

        List<StudentAttendanceCourseSummaryDto> summaries = new ArrayList<>();

        for (ClassEnrollment enrollment : enrollments) {
            StudentAttendanceCourseSummaryDto summary = new StudentAttendanceCourseSummaryDto();
            summary.setCourseCode(enrollment.getCourseCode());
            summary.setSectionName(enrollment.getSectionName());
            summary.setTeacherName(enrollment.getTeacher().getFullName());
            summary.setTeacherEmail(enrollment.getTeacher().getEmail());

            // Retrieve all completed / active sessions for this course & section
            List<AttendanceSession> sessions = attendanceSessionRepository
                    .findSessionsByCourseAndSection(enrollment.getCourseCode(), enrollment.getSectionName());

            int presentCount = 0;
            int lateCount = 0;
            int absentCount = 0;
            int excusedCount = 0;
            List<StudentAttendanceSessionDto> sessionDtos = new ArrayList<>();

            for (AttendanceSession sess : sessions) {
                StudentAttendanceSessionDto dto = new StudentAttendanceSessionDto();
                dto.setSessionId(sess.getId());
                dto.setScheduleId(sess.getTeachingSchedule().getId());
                dto.setCourseCode(sess.getTeachingSchedule().getCourseCode());
                dto.setCourseTitle(sess.getTeachingSchedule().getCourseTitle());
                summary.setCourseTitle(sess.getTeachingSchedule().getCourseTitle());
                dto.setSectionName(sess.getTeachingSchedule().getSectionName());
                dto.setTeacherEmail(sess.getTeacherEmail());
                dto.setRoomNumber(sess.getTeachingSchedule().getRoomNumber());
                dto.setSessionDate(sess.getSessionDate());

                Optional<AttendanceRecord> recOpt = attendanceRecordRepository.findByAttendanceSessionAndStudentId(sess, student.getStudentOrEmpId());

                String excuseKey = enrollment.getCourseCode() + "_" + sess.getSessionDate().toString();
                AbsenceExcuse matchingExcuse = excuseLookup.get(excuseKey);
                if (matchingExcuse != null) {
                    dto.setExcuseSubmitted(true);
                    dto.setExcuseStatus(matchingExcuse.getStatus().name());
                }

                if (recOpt.isPresent()) {
                    AttendanceRecord rec = recOpt.get();
                    dto.setCheckedInAt(rec.getCheckedInAt());
                    if (rec.getStatus() == AttendanceStatus.PRESENT) {
                        dto.setStatus("PRESENT");
                        presentCount++;
                    } else if (rec.getStatus() == AttendanceStatus.LATE) {
                        dto.setStatus("LATE");
                        lateCount++;
                    } else {
                        // ABSENT
                        if (matchingExcuse != null && matchingExcuse.getStatus() == AbsenceExcuse.ExcuseStatus.APPROVED) {
                            dto.setStatus("EXCUSED");
                            excusedCount++;
                        } else {
                            dto.setStatus("ABSENT");
                            absentCount++;
                        }
                    }
                } else {
                    // No record recorded yet for this session => ABSENT if session is closed
                    if (matchingExcuse != null && matchingExcuse.getStatus() == AbsenceExcuse.ExcuseStatus.APPROVED) {
                        dto.setStatus("EXCUSED");
                        excusedCount++;
                    } else {
                        dto.setStatus(sess.isActive() ? "PENDING_CHECKIN" : "ABSENT");
                        if (!sess.isActive()) {
                            absentCount++;
                        }
                    }
                }

                sessionDtos.add(dto);
            }

            int totalHeld = presentCount + lateCount + absentCount + excusedCount;
            summary.setTotalClasses(totalHeld);
            summary.setPresentCount(presentCount);
            summary.setLateCount(lateCount);
            summary.setAbsentCount(absentCount);
            summary.setExcusedCount(excusedCount);

            double effectivePresent = presentCount + lateCount + (excusedCount * 1.0);
            double percentage = totalHeld > 0 ? Math.round((effectivePresent / totalHeld) * 100.0 * 10.0) / 10.0 : 100.0;
            summary.setAttendancePercentage(percentage);
            summary.setSessions(sessionDtos);

            summaries.add(summary);
        }

        return summaries;
    }

    @Transactional
    public AbsenceExcuse submitAbsenceExcuse(String studentId, String studentName, String studentEmail,
                                            AbsenceExcuseRequest request) {
        if (request.getCourseCode() == null || request.getCourseCode().isBlank()) {
            throw new IllegalArgumentException("Course code is required.");
        }
        if (request.getAbsenceDate() == null || request.getAbsenceDate().isBlank()) {
            throw new IllegalArgumentException("Absence date is required.");
        }
        if (request.getExplanation() == null || request.getExplanation().isBlank()) {
            throw new IllegalArgumentException("Explanation or medical reason details are required.");
        }

        User student = userRepository.findByStudentOrEmpId(studentId)
                .orElseThrow(() -> new IllegalArgumentException("Student not found."));

        List<ClassEnrollment> enrollments = enrollmentRepository.findByStudentAndActiveTrue(student);
        ClassEnrollment targetEnrollment = enrollments.stream()
                .filter(e -> e.getCourseCode().equalsIgnoreCase(request.getCourseCode()) &&
                             e.getSectionName().equalsIgnoreCase(request.getSectionName()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("You are not enrolled in this course/section."));

        User authoritativeTeacher = targetEnrollment.getTeacher();
        String authoritativeTeacherEmail = authoritativeTeacher.getEmail();

        LocalDate date = LocalDate.parse(request.getAbsenceDate());

        AbsenceExcuse excuse = new AbsenceExcuse(
                studentId,
                studentName,
                studentEmail,
                request.getCourseCode(),
                request.getCourseTitle(),
                request.getSectionName(),
                authoritativeTeacherEmail,
                date,
                request.getReasonCategory() != null ? request.getReasonCategory() : "MEDICAL",
                request.getExplanation().trim(),
                request.getDocumentUrl()
        );

        AbsenceExcuse saved = absenceExcuseRepository.save(excuse);
        
        String message = String.format("A new absence excuse was submitted for %s — Section %s.",
                saved.getCourseCode(), saved.getSectionName());
        notificationService.createNotification(
                authoritativeTeacher,
                NotificationType.ABSENCE_EXCUSE,
                "New absence excuse",
                message,
                "excuses",
                saved.getId().toString(),
                "ABSENCE_EXCUSE:" + saved.getId() + ":" + authoritativeTeacher.getId()
        );
        
        return saved;
    }

    @Transactional(readOnly = true)
    public List<AbsenceExcuse> getStudentExcuses(String studentId) {
        return absenceExcuseRepository.findByStudentIdOrderBySubmittedAtDesc(studentId);
    }

    @Transactional(readOnly = true)
    public List<AbsenceExcuse> getTeacherExcuses(String teacherEmail) {
        return absenceExcuseRepository.findByTeacherEmailOrderBySubmittedAtDesc(teacherEmail);
    }

    @Transactional
    public AbsenceExcuse reviewExcuse(Long excuseId, String teacherEmail, String statusStr, String remarks) {
        AbsenceExcuse excuse = absenceExcuseRepository.findById(excuseId)
                .orElseThrow(() -> new IllegalArgumentException("Absence excuse #" + excuseId + " not found."));

        AbsenceExcuse.ExcuseStatus status = AbsenceExcuse.ExcuseStatus.valueOf(statusStr.toUpperCase());
        excuse.setStatus(status);
        excuse.setTeacherRemarks(remarks);
        excuse.setReviewedAt(LocalDateTime.now());

        return absenceExcuseRepository.save(excuse);
    }

    // ─────────────────────────────────────────────────────────
    // 2. DIGITAL LOST & FOUND BOARD
    // ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<LostFoundItem> getLostFoundItems(String categoryStr, String typeStr, String statusStr) {
        LostFoundItem.ItemCategory category = (categoryStr != null && !categoryStr.isBlank() && !categoryStr.equalsIgnoreCase("ALL"))
                ? LostFoundItem.ItemCategory.valueOf(categoryStr.toUpperCase()) : null;
        LostFoundItem.ItemType type = (typeStr != null && !typeStr.isBlank() && !typeStr.equalsIgnoreCase("ALL"))
                ? LostFoundItem.ItemType.valueOf(typeStr.toUpperCase()) : null;
        LostFoundItem.ItemStatus status = (statusStr != null && !statusStr.isBlank() && !statusStr.equalsIgnoreCase("ALL"))
                ? LostFoundItem.ItemStatus.valueOf(statusStr.toUpperCase()) : null;

        return lostFoundItemRepository.findByFilters(category, type, status);
    }

    @Transactional
    public LostFoundItem reportLostFoundItem(String reporterId, String reporterName, String reporterEmail,
                                            LostFoundItemRequest request) {
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new IllegalArgumentException("Item title is required.");
        }
        if (request.getLocation() == null || request.getLocation().isBlank()) {
            throw new IllegalArgumentException("Location where the item was found or lost is required.");
        }

        LostFoundItem.ItemCategory category = LostFoundItem.ItemCategory.valueOf(
                request.getCategory() != null ? request.getCategory().toUpperCase() : "ELECTRONICS");
        LostFoundItem.ItemType type = LostFoundItem.ItemType.valueOf(
                request.getType() != null ? request.getType().toUpperCase() : "FOUND");

        LocalDate date = request.getItemDate() != null && !request.getItemDate().isBlank()
                ? LocalDate.parse(request.getItemDate()) : LocalDate.now();

        LostFoundItem item = new LostFoundItem(
                request.getTitle().trim(),
                request.getDescription() != null ? request.getDescription().trim() : "",
                category,
                type,
                request.getLocation().trim(),
                date,
                request.getImageUrl(),
                reporterId,
                reporterName,
                reporterEmail,
                request.getContactInfo()
        );

        return lostFoundItemRepository.save(item);
    }

    @Transactional
    public LostFoundItem claimFoundItem(Long itemId, String studentId, String studentName,
                                        LostFoundClaimRequest request) {
        LostFoundItem item = lostFoundItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Item #" + itemId + " not found."));

        if (item.getStatus() == LostFoundItem.ItemStatus.RESOLVED) {
            throw new IllegalStateException("This item has already been claimed and resolved.");
        }

        if (request.getClaimProofDetails() == null || request.getClaimProofDetails().trim().isBlank()) {
            throw new IllegalArgumentException("Verification details/proof of ownership are required to claim this item.");
        }

        item.setStatus(LostFoundItem.ItemStatus.CLAIM_PENDING);
        item.setClaimedByStudentId(studentId);
        item.setClaimedByStudentName(studentName);
        item.setClaimProofDetails(request.getClaimProofDetails().trim());
        item.setClaimContactPhone(request.getContactPhone());

        return lostFoundItemRepository.save(item);
    }

    @Transactional
    public LostFoundItem resolveClaim(Long itemId, boolean approve) {
        LostFoundItem item = lostFoundItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Item #" + itemId + " not found."));

        if (approve) {
            item.setStatus(LostFoundItem.ItemStatus.RESOLVED);
            item.setResolvedAt(LocalDateTime.now());
        } else {
            item.setStatus(LostFoundItem.ItemStatus.OPEN);
            item.setClaimedByStudentId(null);
            item.setClaimedByStudentName(null);
            item.setClaimProofDetails(null);
            item.setClaimContactPhone(null);
        }

        return lostFoundItemRepository.save(item);
    }

    // ─────────────────────────────────────────────────────────
    // 3. HARDWARE & LAB EQUIPMENT BOOKING
    // ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<LabEquipment> getActiveEquipment(String categoryStr) {
        if (categoryStr != null && !categoryStr.isBlank() && !categoryStr.equalsIgnoreCase("ALL")) {
            LabEquipment.EquipmentCategory cat = LabEquipment.EquipmentCategory.valueOf(categoryStr.toUpperCase());
            return labEquipmentRepository.findByCategoryAndActiveTrueOrderByNameAsc(cat);
        }
        return labEquipmentRepository.findByActiveTrueOrderByNameAsc();
    }

    @Transactional
    public synchronized EquipmentBooking requestEquipmentBooking(String studentId, String studentName,
                                                                 String studentEmail, EquipmentBookingRequest request) {
        if (request.getEquipmentId() == null) {
            throw new IllegalArgumentException("Equipment ID is required.");
        }
        if (request.getBorrowDate() == null || request.getExpectedReturnDate() == null) {
            throw new IllegalArgumentException("Borrow date and expected return date are required.");
        }

        LabEquipment equipment = labEquipmentRepository.findById(request.getEquipmentId())
                .orElseThrow(() -> new IllegalArgumentException("Equipment not found."));

        int qty = request.getQuantity() > 0 ? request.getQuantity() : 1;
        if (equipment.getAvailableQuantity() < qty) {
            throw new IllegalStateException("Insufficient equipment stock. Available units: " + equipment.getAvailableQuantity());
        }

        LocalDate borrowDate = LocalDate.parse(request.getBorrowDate());
        LocalDate returnDate = LocalDate.parse(request.getExpectedReturnDate());

        if (returnDate.isBefore(borrowDate)) {
            throw new IllegalArgumentException("Return date cannot be before borrow date.");
        }

        // Deduct available stock immediately upon confirmed request reservation
        equipment.setAvailableQuantity(equipment.getAvailableQuantity() - qty);
        labEquipmentRepository.save(equipment);

        EquipmentBooking booking = new EquipmentBooking(
                equipment,
                studentId,
                studentName,
                studentEmail,
                request.getCourseCode() != null ? request.getCourseCode() : "CSE Project",
                qty,
                borrowDate,
                returnDate,
                request.getPurpose() != null ? request.getPurpose().trim() : "Lab project experimentation"
        );

        return equipmentBookingRepository.save(booking);
    }

    @Transactional(readOnly = true)
    public List<EquipmentBooking> getStudentBookings(String studentId) {
        return equipmentBookingRepository.findByStudentIdOrderByRequestedAtDesc(studentId);
    }

    @Transactional(readOnly = true)
    public List<EquipmentBooking> getAllBookings() {
        return equipmentBookingRepository.findAllByOrderByRequestedAtDesc();
    }

    @Transactional
    public synchronized EquipmentBooking updateBookingStatus(Long bookingId, EquipmentBooking.BookingStatus newStatus, String remarks) {
        EquipmentBooking booking = equipmentBookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found."));

        EquipmentBooking.BookingStatus oldStatus = booking.getStatus();
        booking.setStatus(newStatus);
        if (remarks != null) {
            booking.setAdminRemarks(remarks);
        }

        // If returned or cancelled/rejected from active booking, restore stock
        if ((newStatus == EquipmentBooking.BookingStatus.RETURNED || newStatus == EquipmentBooking.BookingStatus.CANCELLED || newStatus == EquipmentBooking.BookingStatus.REJECTED)
                && (oldStatus == EquipmentBooking.BookingStatus.PENDING || oldStatus == EquipmentBooking.BookingStatus.APPROVED || oldStatus == EquipmentBooking.BookingStatus.CHECKED_OUT)) {
            LabEquipment eq = booking.getEquipment();
            eq.setAvailableQuantity(Math.min(eq.getTotalQuantity(), eq.getAvailableQuantity() + booking.getQuantity()));
            labEquipmentRepository.save(eq);
            if (newStatus == EquipmentBooking.BookingStatus.RETURNED) {
                booking.setActualReturnDate(LocalDate.now());
            }
        }

        return equipmentBookingRepository.save(booking);
    }

    @Transactional
    public synchronized EquipmentBooking cancelStudentBooking(Long bookingId, String studentId) {
        EquipmentBooking booking = equipmentBookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking #" + bookingId + " not found."));

        if (!studentId.equals(booking.getStudentId())) {
            throw new IllegalArgumentException("You are not authorized to cancel this booking.");
        }

        if (booking.getStatus() != EquipmentBooking.BookingStatus.PENDING && booking.getStatus() != EquipmentBooking.BookingStatus.APPROVED) {
            throw new IllegalStateException("Cannot cancel booking with status: " + booking.getStatus());
        }

        return updateBookingStatus(bookingId, EquipmentBooking.BookingStatus.CANCELLED, "Cancelled by student");
    }

    // ─────────────────────────────────────────────────────────
    // 4. STUDENT SCHEDULE, EVENTS, CAFETERIA, EMERGENCIES
    // ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<TeachingSchedule> getStudentSchedule(String studentEmail, String studentId) {
        User student = userRepository.findByEmail(studentEmail).orElse(null);
        if (student == null) {
            student = userRepository.findByStudentOrEmpId(studentId).orElse(null);
        }
        if (student == null) {
            return Collections.emptyList();
        }

        List<ClassEnrollment> enrollments = enrollmentRepository.findByStudentAndActiveTrue(student);
        List<TeachingSchedule> scheduleList = new ArrayList<>();
        for (ClassEnrollment enrollment : enrollments) {
            List<TeachingSchedule> schedules = teachingScheduleRepository.findByCourseCodeAndSectionName(
                    enrollment.getCourseCode(), enrollment.getSectionName());
            scheduleList.addAll(schedules);
        }
        return scheduleList;
    }

    @Transactional(readOnly = true)
    public List<CampusEvent> getPublishedEvents() {
        return eventRepository.findByEventDateGreaterThanEqualOrderByEventDateAsc(LocalDate.now());
    }

    @Transactional(readOnly = true)
    public List<CafeteriaMenuItem> getCafeteriaMenu() {
        return cafeteriaMenuRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<EmergencyAlert> getActiveEmergencies() {
        return emergencyAlertRepository.findByActiveTrueOrderByBroadcastTimeDesc();
    }
}
