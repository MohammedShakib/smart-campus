package bd.ac.uiu.smartcampus.controller;

import bd.ac.uiu.smartcampus.dto.*;
import bd.ac.uiu.smartcampus.model.*;
import bd.ac.uiu.smartcampus.security.CustomUserDetails;
import bd.ac.uiu.smartcampus.service.FacultyOfficeHourService;
import bd.ac.uiu.smartcampus.service.StudentPortalService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student")
public class StudentApiController {

    private final StudentPortalService studentPortalService;
    private final FacultyOfficeHourService officeHourService;

    public StudentApiController(StudentPortalService studentPortalService,
                                FacultyOfficeHourService officeHourService) {
        this.studentPortalService = studentPortalService;
        this.officeHourService = officeHourService;
    }

    // ─────────────────────────────────────────────────────────
    // 1. ATTENDANCE HISTORY & ABSENCE EXCUSE SUBMISSION
    // ─────────────────────────────────────────────────────────

    @GetMapping("/attendance/summary")
    public ApiResponse<List<StudentAttendanceCourseSummaryDto>> getAttendanceSummary(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String studentEmail = userDetails != null ? userDetails.getUsername() : "student-demo";
        String studentId = userDetails != null ? userDetails.getStudentOrEmpId() : "011211001";
        return ApiResponse.ok("Attendance breakdown",
                studentPortalService.getStudentAttendanceSummaries(studentEmail, studentId));
    }

    @PostMapping("/attendance/excuses")
    public ApiResponse<AbsenceExcuse> submitExcuse(
            @RequestBody AbsenceExcuseRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String studentEmail = userDetails != null ? userDetails.getUsername() : "student-demo";
        String studentId = userDetails != null ? userDetails.getStudentOrEmpId() : "011211001";
        String studentName = userDetails != null ? userDetails.getFullName() : "Rahat Hossain";

        AbsenceExcuse saved = studentPortalService.submitAbsenceExcuse(studentId, studentName, studentEmail, request);
        return ApiResponse.ok("Absence excuse submitted successfully", saved);
    }

    @GetMapping("/attendance/excuses")
    public ApiResponse<List<AbsenceExcuse>> getMyExcuses(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String studentId = userDetails != null ? userDetails.getStudentOrEmpId() : "011211001";
        return ApiResponse.ok("Submitted absence excuses", studentPortalService.getStudentExcuses(studentId));
    }

    // ─────────────────────────────────────────────────────────
    // 2. DIGITAL LOST & FOUND BOARD
    // ─────────────────────────────────────────────────────────

    @GetMapping("/lost-found")
    public ApiResponse<List<LostFoundItem>> getLostFoundItems(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status) {
        return ApiResponse.ok("Lost and Found items",
                studentPortalService.getLostFoundItems(category, type, status));
    }

    @PostMapping("/lost-found")
    public ApiResponse<LostFoundItem> reportLostFoundItem(
            @RequestBody LostFoundItemRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String reporterEmail = userDetails != null ? userDetails.getUsername() : "student-demo";
        String reporterId = userDetails != null ? userDetails.getStudentOrEmpId() : "011211001";
        String reporterName = userDetails != null ? userDetails.getFullName() : "Rahat Hossain";

        LostFoundItem item = studentPortalService.reportLostFoundItem(reporterId, reporterName, reporterEmail, request);
        return ApiResponse.ok("Item posted to Lost & Found board", item);
    }

    @PostMapping("/lost-found/{id}/claim")
    public ApiResponse<LostFoundItem> claimFoundItem(
            @PathVariable Long id,
            @RequestBody LostFoundClaimRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String studentId = userDetails != null ? userDetails.getStudentOrEmpId() : "011211001";
        String studentName = userDetails != null ? userDetails.getFullName() : "Rahat Hossain";

        LostFoundItem updated = studentPortalService.claimFoundItem(id, studentId, studentName, request);
        return ApiResponse.ok("Verification claim submitted for item #" + id, updated);
    }

    // ─────────────────────────────────────────────────────────
    // 3. HARDWARE & LAB EQUIPMENT BOOKING
    // ─────────────────────────────────────────────────────────

    @GetMapping("/equipment")
    public ApiResponse<List<LabEquipment>> getLabEquipment(
            @RequestParam(required = false) String category) {
        return ApiResponse.ok("Lab equipment inventory", studentPortalService.getActiveEquipment(category));
    }

    @PostMapping("/equipment/book")
    public ApiResponse<EquipmentBooking> bookEquipment(
            @RequestBody EquipmentBookingRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String studentEmail = userDetails != null ? userDetails.getUsername() : "student-demo";
        String studentId = userDetails != null ? userDetails.getStudentOrEmpId() : "011211001";
        String studentName = userDetails != null ? userDetails.getFullName() : "Rahat Hossain";

        EquipmentBooking booking = studentPortalService.requestEquipmentBooking(studentId, studentName, studentEmail, request);
        return ApiResponse.ok("Equipment checkout requested successfully", booking);
    }

    @GetMapping("/equipment/my-bookings")
    public ApiResponse<List<EquipmentBooking>> getMyEquipmentBookings(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String studentId = userDetails != null ? userDetails.getStudentOrEmpId() : "011211001";
        return ApiResponse.ok("My equipment bookings", studentPortalService.getStudentBookings(studentId));
    }

    @PostMapping("/equipment/bookings/{id}/cancel")
    public ApiResponse<EquipmentBooking> cancelEquipmentBooking(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String studentId = userDetails != null ? userDetails.getStudentOrEmpId() : "011211001";
        return ApiResponse.ok("Equipment booking cancelled", studentPortalService.cancelStudentBooking(id, studentId));
    }

    // ─────────────────────────────────────────────────────────
    // 4. FACULTY OFFICE HOURS & CONCURRENCY-SAFE BOOKING
    // ─────────────────────────────────────────────────────────

    @GetMapping("/office-hours/slots")
    public ApiResponse<List<FacultyOfficeHourSlot>> getAvailableConsultationSlots() {
        return ApiResponse.ok("Available consultation slots", officeHourService.getAvailableSlots());
    }

    @PostMapping("/office-hours/book")
    public ApiResponse<FacultyOfficeHourSlot> bookConsultationSlot(
            @RequestBody OfficeHourBookingRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String studentEmail = userDetails != null ? userDetails.getUsername() : "student-demo";
        String studentId = userDetails != null ? userDetails.getStudentOrEmpId() : "011211001";
        String studentName = userDetails != null ? userDetails.getFullName() : "Rahat Hossain";

        FacultyOfficeHourSlot booked = officeHourService.bookAppointment(
                request.getSlotId(), studentId, studentName, studentEmail, request);
        return ApiResponse.ok("Faculty consultation booked successfully with pre-submitted query", booked);
    }

    @GetMapping("/office-hours/my-appointments")
    public ApiResponse<List<FacultyOfficeHourSlot>> getMyAppointments(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String studentId = userDetails != null ? userDetails.getStudentOrEmpId() : "011211001";
        return ApiResponse.ok("My booked office hours", officeHourService.getStudentAppointments(studentId));
    }

    @PostMapping("/office-hours/appointments/{id}/cancel")
    public ApiResponse<FacultyOfficeHourSlot> cancelAppointment(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String studentId = userDetails != null ? userDetails.getStudentOrEmpId() : "011211001";
        return ApiResponse.ok("Appointment cancelled", officeHourService.cancelAppointment(id, studentId));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiResponse<Void>> handleConflict(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(ex.getMessage()));
    }
}
