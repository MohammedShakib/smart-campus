package bd.ac.uiu.smartcampus.service;

import bd.ac.uiu.smartcampus.dto.CampusTelemetryDto;
import bd.ac.uiu.smartcampus.dto.StudentAttendanceCourseSummaryDto;
import bd.ac.uiu.smartcampus.dto.TeacherIssueDto;
import bd.ac.uiu.smartcampus.model.AbsenceExcuse;
import bd.ac.uiu.smartcampus.model.CafeteriaMenuItem;
import bd.ac.uiu.smartcampus.model.CampusEvent;
import bd.ac.uiu.smartcampus.model.CampusNotice;
import bd.ac.uiu.smartcampus.model.CampusVisitor;
import bd.ac.uiu.smartcampus.model.Course;
import bd.ac.uiu.smartcampus.model.Department;
import bd.ac.uiu.smartcampus.model.EmergencyAlert;
import bd.ac.uiu.smartcampus.model.EquipmentBooking;
import bd.ac.uiu.smartcampus.model.LabEquipment;
import bd.ac.uiu.smartcampus.model.LostFoundItem;
import bd.ac.uiu.smartcampus.model.MaintenanceComplaint;
import bd.ac.uiu.smartcampus.model.NoticeAudience;
import bd.ac.uiu.smartcampus.model.NoticeStatus;
import bd.ac.uiu.smartcampus.model.ParkingZone;
import bd.ac.uiu.smartcampus.model.Role;
import bd.ac.uiu.smartcampus.model.SecurityIncident;
import bd.ac.uiu.smartcampus.repository.CampusNoticeRepository;
import bd.ac.uiu.smartcampus.repository.CourseRepository;
import bd.ac.uiu.smartcampus.repository.DepartmentRepository;
import bd.ac.uiu.smartcampus.repository.MaintenanceComplaintRepository;
import bd.ac.uiu.smartcampus.repository.UserRepository;
import bd.ac.uiu.smartcampus.security.CustomUserDetails;
import bd.ac.uiu.smartcampus.syllabus.collections.AdminActionStackService;
import bd.ac.uiu.smartcampus.syllabus.collections.ComplaintQueueService;
import bd.ac.uiu.smartcampus.syllabus.collections.UniqueAttendeeSetService;
import bd.ac.uiu.smartcampus.syllabus.concurrency.CampusSimulationWorker;
import bd.ac.uiu.smartcampus.syllabus.networking.BusServerSocketManager;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.StringJoiner;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ChatbotContextService {

    private static final int MAX_CONTEXT_LENGTH = 20000;
    private static final int MAX_WEB_CONTEXT_LENGTH = 6000;
    private static final int MAX_WEB_PAGES = 2;
    private static final Pattern URL_PATTERN = Pattern.compile("https?://[^\\s)\\]}>\"']+");
    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final List<String> RECENT_COLUMN_CANDIDATES = List.of(
            "updated_at", "created_at", "reported_at", "posted_at", "submitted_at", "broadcast_time",
            "last_update", "started_at", "ended_at", "actual_check_in_time", "actual_check_out_time", "visit_date"
    );
    private static final Set<String> PUBLIC_DATABASE_TABLES = Set.of(
            "departments", "courses", "buildings", "classrooms", "campus_notices", "campus_events",
            "cafeteria_menu_items", "lab_equipment", "buses", "bus_routes", "parking_zones"
    );
    private static final Set<String> SECURITY_DATABASE_TABLES = Set.of(
            "campus_visitors", "parking_zones", "security_incidents", "gate_access_logs", "emergency_alerts"
    );

    private final UserRepository userRepository;
    private final CampusNoticeRepository noticeRepository;
    private final MaintenanceComplaintRepository complaintRepository;
    private final DepartmentRepository departmentRepository;
    private final CourseRepository courseRepository;
    private final CampusSimulationWorker simulationWorker;
    private final BusServerSocketManager busServerManager;
    private final AdminActionStackService actionStackService;
    private final ComplaintQueueService complaintQueueService;
    private final UniqueAttendeeSetService attendeeSetService;
    private final TeacherDashboardService teacherDashboardService;
    private final StudentPortalService studentPortalService;
    private final SecurityService securityService;
    private final JdbcTemplate jdbcTemplate;
    private final HttpClient httpClient;

    public ChatbotContextService(UserRepository userRepository,
                                 CampusNoticeRepository noticeRepository,
                                 MaintenanceComplaintRepository complaintRepository,
                                 DepartmentRepository departmentRepository,
                                 CourseRepository courseRepository,
                                 CampusSimulationWorker simulationWorker,
                                 BusServerSocketManager busServerManager,
                                 AdminActionStackService actionStackService,
                                 ComplaintQueueService complaintQueueService,
                                 UniqueAttendeeSetService attendeeSetService,
                                 TeacherDashboardService teacherDashboardService,
                                 StudentPortalService studentPortalService,
                                 SecurityService securityService,
                                 JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.noticeRepository = noticeRepository;
        this.complaintRepository = complaintRepository;
        this.departmentRepository = departmentRepository;
        this.courseRepository = courseRepository;
        this.simulationWorker = simulationWorker;
        this.busServerManager = busServerManager;
        this.actionStackService = actionStackService;
        this.complaintQueueService = complaintQueueService;
        this.attendeeSetService = attendeeSetService;
        this.teacherDashboardService = teacherDashboardService;
        this.studentPortalService = studentPortalService;
        this.securityService = securityService;
        this.jdbcTemplate = jdbcTemplate;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(8))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
    }

    @Transactional(readOnly = true)
    public String buildContext(CustomUserDetails userDetails) {
        StringBuilder context = new StringBuilder();
        context.append("INTERNAL SMART CAMPUS DATA FOR CAMPUSAI\n");
        context.append("Use this data when answering. If a value is not present here, say it is not available in the current system data.\n");
        context.append("When responding to users, use natural language and do not mention internal labels such as telemetry, feed, context, snapshot, payload, database, or repository.\n");
        context.append("Do not reveal passwords, secrets, or raw database internals. Do not claim write actions were performed.\n\n");

        appendUserContext(context, userDetails);
        appendTelemetry(context);
        appendDatabaseContext(context, userDetails);
        appendGeneralCampusContext(context);

        Role role = userDetails != null && userDetails.getUser() != null ? userDetails.getUser().getRole() : null;
        if (role == Role.ROLE_ADMIN) {
            appendAdminContext(context);
        } else if (role == Role.ROLE_TEACHER) {
            appendTeacherContext(context, userDetails);
        } else if (role == Role.ROLE_STUDENT) {
            appendStudentContext(context, userDetails);
        } else if (role == Role.ROLE_SECURITY) {
            appendSecurityContext(context);
        }

        return trimContext(context.toString());
    }

    private void appendUserContext(StringBuilder context, CustomUserDetails userDetails) {
        context.append("AUTHENTICATED USER\n");
        if (userDetails == null) {
            context.append("- No authenticated user details were available.\n\n");
            return;
        }
        context.append("- Name: ").append(nullToDash(userDetails.getFullName())).append('\n');
        context.append("- Email/Login: ").append(nullToDash(userDetails.getUsername())).append('\n');
        context.append("- Role: ").append(nullToDash(userDetails.getRoleName())).append('\n');
        context.append("- Department: ").append(nullToDash(userDetails.getDepartment())).append('\n');
        context.append("- ID: ").append(nullToDash(userDetails.getStudentOrEmpId())).append("\n\n");
    }

    private void appendTelemetry(StringBuilder context) {
        CampusTelemetryDto telemetry = simulationWorker.getLatestTelemetry();
        context.append("CURRENT CAMPUS STATUS\n");
        if (telemetry == null) {
            context.append("- Current campus status unavailable.\n\n");
            return;
        }
        context.append("- Active students: ").append(telemetry.getActiveStudents()).append('\n');
        context.append("- Faculty on campus: ").append(telemetry.getFacultyOnCampus()).append('\n');
        context.append("- Occupied rooms: ").append(telemetry.getOccupiedRooms()).append('/').append(telemetry.getTotalRooms()).append('\n');
        context.append("- Power consumption: ").append(telemetry.getPowerConsumptionKW()).append(" kW\n");
        context.append("- Campus temperature: ").append(telemetry.getCampusTemperatureC()).append(" C\n");
        context.append("- Air quality: ").append(nullToDash(telemetry.getAirQualityIndex())).append('\n');
        context.append("- Active buses: ").append(telemetry.getActiveBuses()).append('\n');
        context.append("- Pending complaints: ").append(telemetry.getPendingComplaints()).append('\n');
        context.append("- Visitors today: ").append(telemetry.getVisitorsToday()).append('\n');
        context.append("- System status: ").append(nullToDash(telemetry.getSystemStatus())).append("\n\n");
    }

    private void appendGeneralCampusContext(StringBuilder context) {
        context.append("GENERAL CAMPUS DATA\n");
        appendAcademicSetupContext(context);
        appendBusLocations(context);
        appendActiveEmergencies(context);
        appendNotices(context, List.of(NoticeAudience.ALL), 4);
        appendEvents(context);
        appendCafeteria(context);
        appendLabEquipment(context);
        context.append('\n');
    }

    private void appendDatabaseContext(StringBuilder context, CustomUserDetails userDetails) {
        Role role = userDetails != null && userDetails.getUser() != null ? userDetails.getUser().getRole() : null;
        List<String> tables = readTableNames();
        if (tables.isEmpty()) {
            return;
        }

        context.append("DATABASE LIVE SNAPSHOT\n");
        context.append("- Scope: ")
                .append(role == null ? "authenticated system user" : role.name().replace("ROLE_", ""))
                .append(" role view; sensitive fields are redacted.\n");
        context.append("Table row counts\n");
        tables.stream()
                .sorted()
                .limit(80)
                .forEach(table -> context
                        .append("- ")
                        .append(table)
                        .append(": ")
                        .append(safeCount(table))
                        .append('\n'));

        appendRecentDatabaseActivity(context, tables, role);
        context.append('\n');
    }

    private void appendRecentDatabaseActivity(StringBuilder context, List<String> tables, Role role) {
        Set<String> allowedTables = allowedRecentTablesForRole(tables, role);
        if (allowedTables.isEmpty()) {
            return;
        }

        context.append("Recent database activity visible to this role\n");
        allowedTables.stream()
                .sorted()
                .limit(role == Role.ROLE_ADMIN ? 24 : 12)
                .forEach(table -> appendRecentRowsForTable(context, table, role == Role.ROLE_ADMIN ? 3 : 2));
    }

    private Set<String> allowedRecentTablesForRole(List<String> tables, Role role) {
        Set<String> existing = new HashSet<>(tables);
        Set<String> allowed = new LinkedHashSet<>();
        if (role == Role.ROLE_ADMIN) {
            allowed.addAll(existing);
        } else {
            allowed.addAll(PUBLIC_DATABASE_TABLES);
            if (role == Role.ROLE_SECURITY) {
                allowed.addAll(SECURITY_DATABASE_TABLES);
            }
            if (role == Role.ROLE_TEACHER) {
                allowed.addAll(List.of("teaching_schedules", "attendance_sessions", "class_enrollments", "room_reservations", "maintenance_complaints", "absence_excuses"));
            }
            if (role == Role.ROLE_STUDENT) {
                allowed.addAll(List.of("lost_found_items", "equipment_bookings", "maintenance_complaints", "absence_excuses", "user_notifications"));
            }
        }
        allowed.removeIf(table -> !existing.contains(table));
        return allowed;
    }

    private List<String> readTableNames() {
        try {
            return jdbcTemplate.execute((Connection connection) -> {
                List<String> tables = new ArrayList<>();
                DatabaseMetaData metaData = connection.getMetaData();
                try (ResultSet resultSet = metaData.getTables(connection.getCatalog(), null, "%", new String[]{"TABLE"})) {
                    while (resultSet.next()) {
                        String tableName = resultSet.getString("TABLE_NAME");
                        if (isApplicationTable(tableName)) {
                            tables.add(tableName);
                        }
                    }
                }
                tables.sort(Comparator.naturalOrder());
                return tables;
            });
        } catch (Exception exception) {
            return List.of();
        }
    }

    private boolean isApplicationTable(String tableName) {
        if (tableName == null || tableName.isBlank()) {
            return false;
        }
        String normalized = tableName.toLowerCase(Locale.ROOT);
        return !normalized.startsWith("information_schema")
                && !normalized.startsWith("performance_schema")
                && !normalized.startsWith("mysql")
                && !normalized.startsWith("sys")
                && !normalized.startsWith("hibernate_");
    }

    private long safeCount(String table) {
        try {
            Long count = jdbcTemplate.queryForObject("select count(*) from " + quoteIdentifier(table), Long.class);
            return count == null ? 0 : count;
        } catch (Exception exception) {
            return -1;
        }
    }

    private void appendRecentRowsForTable(StringBuilder context, String table, int limit) {
        List<String> columns = readColumns(table);
        if (columns.isEmpty()) {
            return;
        }
        String timestampColumn = chooseRecentColumn(columns);
        if (timestampColumn == null) {
            return;
        }

        try {
            String sql = "select * from " + quoteIdentifier(table)
                    + " order by " + quoteIdentifier(timestampColumn) + " desc limit " + Math.max(1, limit);
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
            if (rows.isEmpty()) {
                return;
            }
            context.append(table).append(" recent rows\n");
            rows.forEach(row -> context
                    .append("- ")
                    .append(sanitizeRow(row))
                    .append('\n'));
        } catch (Exception ignored) {
            // Best-effort database context only.
        }
    }

    private List<String> readColumns(String table) {
        try {
            return jdbcTemplate.execute((Connection connection) -> {
                List<String> columns = new ArrayList<>();
                DatabaseMetaData metaData = connection.getMetaData();
                try (ResultSet resultSet = metaData.getColumns(connection.getCatalog(), null, table, "%")) {
                    while (resultSet.next()) {
                        columns.add(resultSet.getString("COLUMN_NAME"));
                    }
                }
                return columns;
            });
        } catch (Exception exception) {
            return List.of();
        }
    }

    private String chooseRecentColumn(List<String> columns) {
        Set<String> normalizedColumns = new HashSet<>();
        columns.forEach(column -> normalizedColumns.add(column.toLowerCase(Locale.ROOT)));
        return RECENT_COLUMN_CANDIDATES.stream()
                .filter(normalizedColumns::contains)
                .findFirst()
                .orElse(null);
    }

    private String sanitizeRow(Map<String, Object> row) {
        StringJoiner joiner = new StringJoiner(", ");
        row.forEach((key, value) -> {
            if (!looksSensitive(key)) {
                joiner.add(key + "=" + sanitizeInline(value));
            }
        });
        return limit(joiner.toString());
    }

    private String quoteIdentifier(String identifier) {
        return "`" + identifier.replace("`", "``") + "`";
    }

    private void appendAdminContext(StringBuilder context) {
        context.append("ADMIN DASHBOARD CONTEXT\n");
        context.append("- Total users: ").append(userRepository.count()).append('\n');
        context.append("- Active users: ").append(userRepository.countByActiveTrue()).append('\n');
        context.append("- Students: ").append(userRepository.countByRole(Role.ROLE_STUDENT)).append('\n');
        context.append("- Teachers: ").append(userRepository.countByRole(Role.ROLE_TEACHER)).append('\n');
        context.append("- Security users: ").append(userRepository.countByRole(Role.ROLE_SECURITY)).append('\n');
        context.append("- Complaint queue size: ").append(complaintQueueService.getQueueSize()).append('\n');
        context.append("- Unique gate pass count: ").append(attendeeSetService.getUniqueCount()).append('\n');
        appendList(context, "Recent admin actions", actionStackService.getRecentStackHistory(), 5);
        appendList(context, "Queued complaints", complaintQueueService.getQueuedComplaints(), 5);
        appendNotices(context, List.of(NoticeAudience.ALL, NoticeAudience.ADMIN), 5, false);
        context.append('\n');
    }

    public String buildWebContext(String message) {
        List<String> urls = extractUrls(message);
        if (urls.isEmpty()) {
            return "";
        }

        StringBuilder context = new StringBuilder();
        context.append("WEB PAGE DATA PROVIDED FOR THIS QUESTION\n");
        context.append("Use this web page text only for the current reply. If a page cannot be read, say that page was unavailable.\n");

        for (String url : urls) {
            appendWebPage(context, url);
            if (context.length() >= MAX_WEB_CONTEXT_LENGTH) {
                break;
            }
        }

        return trimToLength(context.toString(), MAX_WEB_CONTEXT_LENGTH);
    }

    private List<String> extractUrls(String message) {
        if (message == null || message.isBlank()) {
            return List.of();
        }
        List<String> urls = new ArrayList<>();
        Matcher matcher = URL_PATTERN.matcher(message);
        while (matcher.find() && urls.size() < MAX_WEB_PAGES) {
            String url = matcher.group();
            if (!urls.contains(url)) {
                urls.add(url);
            }
        }
        return urls;
    }

    private void appendWebPage(StringBuilder context, String url) {
        context.append("- URL: ").append(url).append('\n');
        try {
            URI uri = URI.create(url);
            if (!isAllowedPublicHttpUrl(uri)) {
                context.append("  Status: blocked because only public http/https web pages are allowed.\n");
                return;
            }

            HttpRequest request = HttpRequest.newBuilder(uri)
                    .timeout(Duration.ofSeconds(12))
                    .header("User-Agent", "CampusAI/1.0 SmartCampus")
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                context.append("  Status: unavailable, HTTP ").append(response.statusCode()).append('\n');
                return;
            }

            String pageText = htmlToText(response.body());
            context.append("  Text: ").append(trimToLength(pageText, 2600)).append("\n");
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            context.append("  Status: unavailable because the request was interrupted.\n");
        } catch (Exception exception) {
            context.append("  Status: unavailable because the page could not be read.\n");
        }
    }

    private boolean isAllowedPublicHttpUrl(URI uri) {
        String scheme = uri.getScheme();
        String host = uri.getHost();
        if (scheme == null || host == null) {
            return false;
        }
        String normalizedScheme = scheme.toLowerCase(Locale.ROOT);
        if (!normalizedScheme.equals("http") && !normalizedScheme.equals("https")) {
            return false;
        }
        String normalizedHost = host.toLowerCase(Locale.ROOT);
        return !normalizedHost.equals("localhost")
                && !normalizedHost.equals("127.0.0.1")
                && !normalizedHost.equals("0.0.0.0")
                && !normalizedHost.equals("::1")
                && !normalizedHost.startsWith("127.")
                && !normalizedHost.startsWith("10.")
                && !normalizedHost.startsWith("192.168.")
                && !isPrivate172Address(normalizedHost);
    }

    private boolean isPrivate172Address(String host) {
        if (!host.startsWith("172.")) {
            return false;
        }
        String[] parts = host.split("\\.");
        if (parts.length < 2) {
            return false;
        }
        try {
            int second = Integer.parseInt(parts[1]);
            return second >= 16 && second <= 31;
        } catch (NumberFormatException exception) {
            return false;
        }
    }

    private String htmlToText(String html) {
        if (html == null || html.isBlank()) {
            return "-";
        }
        return html
                .replaceAll("(?is)<script[^>]*>.*?</script>", " ")
                .replaceAll("(?is)<style[^>]*>.*?</style>", " ")
                .replaceAll("(?is)<[^>]+>", " ")
                .replace("&nbsp;", " ")
                .replace("&amp;", "&")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&quot;", "\"")
                .replace("&#39;", "'")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private void appendAcademicSetupContext(StringBuilder context) {
        List<Course> courses = courseRepository.findAll();
        List<Department> departments = departmentRepository.findAll();
        long activeCourses = courses.stream().filter(Course::isActive).count();
        long cseCourses = courses.stream()
                .filter(course -> course.getCourseCode() != null && course.getCourseCode().startsWith("CSE "))
                .count();

        context.append("ACADEMIC SETUP DATA\n");
        context.append("- Total departments: ").append(departments.size()).append('\n');
        context.append("- Total courses: ").append(courses.size()).append('\n');
        context.append("- Active courses: ").append(activeCourses).append('\n');
        context.append("- CSE courses: ").append(cseCourses).append('\n');
        context.append("- Non-CSE/supporting courses: ").append(courses.size() - cseCourses).append('\n');
        context.append("- Course catalogue source: UIU BSCSE curriculum, effective Summer 2026 onward\n");
        context.append("Course catalogue sample\n");
        courses.stream()
                .sorted((first, second) -> first.getCourseCode().compareToIgnoreCase(second.getCourseCode()))
                .limit(12)
                .forEach(course -> context
                        .append("- ")
                        .append(course.getCourseCode())
                        .append(": ")
                        .append(course.getCourseName())
                        .append(" (")
                        .append(course.getCreditHours())
                        .append(" credits)\n"));
    }

    private void appendTeacherContext(StringBuilder context, CustomUserDetails userDetails) {
        String teacherEmail = userDetails.getUsername();
        context.append("TEACHER DASHBOARD CONTEXT\n");
        teacherDashboardService.getNextClassPayload(teacherEmail)
                .ifPresent(next -> context.append("- Next class: ").append(compact(next)).append('\n'));
        appendList(context, "Schedule", teacherDashboardService.getSchedulePayloads(teacherEmail), 8);
        appendList(context, "Class statuses", teacherDashboardService.getTeacherClasses(teacherEmail), 5);
        appendList(context, "Attendance sessions", teacherDashboardService.getAttendanceSessions(teacherEmail), 5);
        appendList(context, "Room reservations", teacherDashboardService.getReservations(teacherEmail), 5);
        appendList(context, "Reported issues", teacherDashboardService.getTeacherIssues(userDetails), 5);
        appendNotices(context, List.of(NoticeAudience.ALL, NoticeAudience.TEACHERS), 5);
        context.append('\n');
    }

    private void appendStudentContext(StringBuilder context, CustomUserDetails userDetails) {
        String studentEmail = userDetails.getUsername();
        String studentId = userDetails.getStudentOrEmpId();
        context.append("STUDENT DASHBOARD CONTEXT\n");
        appendList(context, "Class schedule", studentPortalService.getStudentSchedule(studentEmail, studentId), 8);
        appendAttendanceSummaries(context, studentPortalService.getStudentAttendanceSummaries(studentEmail, studentId));
        appendList(context, "Absence excuses", studentPortalService.getStudentExcuses(studentId), 5);
        appendList(context, "Equipment bookings", studentPortalService.getStudentBookings(studentId), 5);
        appendList(context, "My support tickets", complaintRepository.findByStudentIdOrderByReportedAtDesc(studentId), 5);
        appendList(context, "Lost and found items", studentPortalService.getLostFoundItems(null, null, "OPEN"), 6);
        appendStudentNotices(context, studentEmail, 5);
        context.append('\n');
    }

    private void appendSecurityContext(StringBuilder context) {
        context.append("SECURITY DASHBOARD CONTEXT\n");
        Map<String, Object> summary = securityService.getDashboardSummary();
        context.append("- Visitors today: ").append(summary.getOrDefault("todayVisitorsCount", "-")).append('\n');
        context.append("- Pending visitors: ").append(summary.getOrDefault("pendingVisitorsCount", "-")).append('\n');
        context.append("- On-campus visitors: ").append(summary.getOrDefault("onCampusVisitorsCount", "-")).append('\n');
        context.append("- Parking occupied/capacity: ")
                .append(summary.getOrDefault("totalParkingOccupied", "-"))
                .append('/')
                .append(summary.getOrDefault("totalParkingCapacity", "-"))
                .append('\n');
        context.append("- Open incidents: ").append(summary.getOrDefault("openIncidentsCount", "-")).append('\n');
        context.append("- Gate entries today: ").append(summary.getOrDefault("gateEntriesToday", "-")).append('\n');
        context.append("- Gate exits today: ").append(summary.getOrDefault("gateExitsToday", "-")).append('\n');
        context.append("- Gate denied today: ").append(summary.getOrDefault("gateDeniedToday", "-")).append('\n');
        appendObject(context, "Parking zones", summary.get("parkingZones"), 5);
        appendObject(context, "Recent visitors", summary.get("recentVisitors"), 5);
        appendObject(context, "Recent incidents", summary.get("recentIncidents"), 5);
        appendNotices(context, List.of(NoticeAudience.ALL, NoticeAudience.SECURITY), 5);
        context.append('\n');
    }

    private void appendBusLocations(StringBuilder context) {
        Map<String, String> locations = busServerManager.getLatestBusLocations();
        if (locations == null || locations.isEmpty()) {
            context.append("- Bus locations: unavailable\n");
            return;
        }
        context.append("- Bus locations: ");
        StringJoiner joiner = new StringJoiner("; ");
        locations.forEach((bus, location) -> joiner.add(bus + " = " + location));
        context.append(joiner).append('\n');
    }

    private void appendActiveEmergencies(StringBuilder context) {
        appendList(context, "Active emergencies", studentPortalService.getActiveEmergencies(), 3);
    }

    private void appendNotices(StringBuilder context, List<NoticeAudience> audiences, int limit) {
        appendNotices(context, audiences, limit, true);
    }

    private void appendNotices(StringBuilder context, List<NoticeAudience> audiences, int limit, boolean filteredForRole) {
        List<CampusNotice> notices = filteredForRole
                ? noticeRepository.findPublishedByAudienceIn(audiences, NoticeStatus.PUBLISHED, LocalDateTime.now())
                : noticeRepository.findByAudienceInOrderByPostedAtDesc(audiences);
        appendList(context, "Notices for " + audiences, notices, limit);
    }

    private void appendStudentNotices(StringBuilder context, String studentEmail, int limit) {
        List<CampusNotice> notices = noticeRepository.findPublishedForStudent(
                List.of(NoticeAudience.ALL, NoticeAudience.STUDENTS),
                NoticeStatus.PUBLISHED,
                LocalDateTime.now(),
                studentEmail);
        appendList(context, "Notices for students", notices, limit);
    }

    private void appendEvents(StringBuilder context) {
        List<CampusEvent> events = studentPortalService.getPublishedEvents();
        appendList(context, "Published campus events", events, 5);
    }

    private void appendCafeteria(StringBuilder context) {
        List<CafeteriaMenuItem> menu = studentPortalService.getCafeteriaMenu();
        appendList(context, "Cafeteria menu", menu, 6);
    }

    private void appendLabEquipment(StringBuilder context) {
        List<LabEquipment> equipment = studentPortalService.getActiveEquipment(null);
        appendList(context, "Available lab equipment", equipment, 6);
    }

    private void appendAttendanceSummaries(StringBuilder context, List<StudentAttendanceCourseSummaryDto> summaries) {
        context.append("Attendance summaries\n");
        if (summaries == null || summaries.isEmpty()) {
            context.append("- None\n");
            return;
        }
        summaries.stream().limit(6).forEach(summary -> context
                .append("- ")
                .append(summary.getCourseCode())
                .append(" ")
                .append(nullToDash(summary.getSectionName()))
                .append(": ")
                .append(summary.getAttendancePercentage())
                .append("%, present=")
                .append(summary.getPresentCount())
                .append(", late=")
                .append(summary.getLateCount())
                .append(", absent=")
                .append(summary.getAbsentCount())
                .append(", excused=")
                .append(summary.getExcusedCount())
                .append('\n'));
    }

    private void appendList(StringBuilder context, String label, List<?> items, int limit) {
        context.append(label).append('\n');
        if (items == null || items.isEmpty()) {
            context.append("- None\n");
            return;
        }
        items.stream()
                .limit(limit)
                .forEach(item -> context.append("- ").append(compact(item)).append('\n'));
    }

    private void appendObject(StringBuilder context, String label, Object value, int limit) {
        if (value instanceof List<?> list) {
            appendList(context, label, list, limit);
            return;
        }
        context.append(label).append('\n');
        context.append("- ").append(compact(value)).append('\n');
    }

    private String compact(Object value) {
        if (value == null) {
            return "-";
        }
        if (value instanceof CampusNotice notice) {
            return limit(String.format("%s [%s/%s, audience=%s, status=%s, posted=%s]: %s",
                    nullToDash(notice.getTitle()),
                    nullToDash(notice.getCategory()),
                    nullToDash(notice.getPriority()),
                    notice.getAudience(),
                    notice.getStatus(),
                    formatDateTime(notice.getPostedAt()),
                    nullToDash(notice.getContent())));
        }
        if (value instanceof CampusEvent event) {
            return limit(String.format("%s on %s %s-%s at %s [%s], organizer=%s",
                    nullToDash(event.getTitle()),
                    event.getEventDate(),
                    event.getStartTime(),
                    event.getEndTime(),
                    nullToDash(event.getLocation()),
                    nullToDash(event.getStatus()),
                    nullToDash(event.getOrganizer())));
        }
        if (value instanceof CafeteriaMenuItem item) {
            return limit(String.format("%s (%s) BDT %s, available=%s, note=%s",
                    nullToDash(item.getName()),
                    nullToDash(item.getCategory()),
                    item.getPrice(),
                    item.isAvailable(),
                    nullToDash(item.getDescription())));
        }
        if (value instanceof LabEquipment equipment) {
            return limit(String.format("%s [%s] at %s, available=%d/%d, active=%s",
                    nullToDash(equipment.getName()),
                    equipment.getCategory(),
                    nullToDash(equipment.getLabLocation()),
                    equipment.getAvailableQuantity(),
                    equipment.getTotalQuantity(),
                    equipment.isActive()));
        }
        if (value instanceof MaintenanceComplaint complaint) {
            return limit(String.format("%s at %s [%s/%s], reporter=%s, reported=%s",
                    nullToDash(complaint.getIssueTitle()),
                    nullToDash(complaint.getLocation()),
                    nullToDash(complaint.getPriority()),
                    nullToDash(complaint.getStatus()),
                    nullToDash(complaint.getReporterName()),
                    formatDateTime(complaint.getReportedAt())));
        }
        if (value instanceof AbsenceExcuse excuse) {
            return limit(String.format("%s %s absence on %s [%s], reason=%s, submitted=%s",
                    nullToDash(excuse.getCourseCode()),
                    nullToDash(excuse.getSectionName()),
                    excuse.getAbsenceDate(),
                    excuse.getStatus(),
                    nullToDash(excuse.getReasonCategory()),
                    formatDateTime(excuse.getSubmittedAt())));
        }
        if (value instanceof EquipmentBooking booking) {
            String equipmentName = booking.getEquipment() != null ? booking.getEquipment().getName() : "-";
            return limit(String.format("%s x%d for %s [%s], borrow=%s, expectedReturn=%s",
                    nullToDash(equipmentName),
                    booking.getQuantity(),
                    nullToDash(booking.getCourseCode()),
                    booking.getStatus(),
                    booking.getBorrowDate(),
                    booking.getExpectedReturnDate()));
        }
        if (value instanceof EmergencyAlert alert) {
            return limit(String.format("%s [%s/%s], active=%s, broadcast=%s: %s",
                    nullToDash(alert.getAlertTitle()),
                    nullToDash(alert.getSeverity()),
                    nullToDash(alert.getCategory()),
                    alert.isActive(),
                    formatDateTime(alert.getBroadcastTime()),
                    nullToDash(alert.getAlertMessage())));
        }
        if (value instanceof ParkingZone zone) {
            return limit(String.format("%s - %s [%s], occupied=%d/%d, status=%s, updated=%s",
                    nullToDash(zone.getZoneCode()),
                    nullToDash(zone.getZoneName()),
                    nullToDash(zone.getType()),
                    zone.getCurrentOccupied(),
                    zone.getTotalCapacity(),
                    nullToDash(zone.getStatus()),
                    formatDateTime(zone.getLastUpdate())));
        }
        if (value instanceof CampusVisitor visitor) {
            return limit(String.format("%s visiting %s/%s on %s at %s [%s], purpose=%s",
                    nullToDash(visitor.getVisitorName()),
                    nullToDash(visitor.getHostName()),
                    nullToDash(visitor.getHostDepartment()),
                    visitor.getVisitDate(),
                    visitor.getExpectedEntryTime(),
                    nullToDash(visitor.getStatus()),
                    nullToDash(visitor.getPurpose())));
        }
        if (value instanceof SecurityIncident incident) {
            return limit(String.format("%s at %s [%s/%s/%s], reported=%s",
                    nullToDash(incident.getTitle()),
                    nullToDash(incident.getLocation()),
                    nullToDash(incident.getIncidentType()),
                    nullToDash(incident.getSeverity()),
                    nullToDash(incident.getStatus()),
                    formatDateTime(incident.getReportedAt())));
        }
        if (value instanceof LostFoundItem item) {
            return limit(String.format("%s [%s/%s/%s] at %s on %s, reporter=%s",
                    nullToDash(item.getTitle()),
                    item.getType(),
                    item.getCategory(),
                    item.getStatus(),
                    nullToDash(item.getLocation()),
                    item.getItemDate(),
                    nullToDash(item.getReporterName())));
        }
        if (value instanceof TeacherIssueDto issue) {
            return limit(String.format("%s at %s [%s/%s], reported=%s",
                    nullToDash(issue.getIssueTitle()),
                    nullToDash(issue.getLocation()),
                    nullToDash(issue.getPriority()),
                    nullToDash(issue.getStatus()),
                    formatDateTime(issue.getReportedAt())));
        }
        if (value instanceof Map<?, ?> map) {
            StringJoiner joiner = new StringJoiner(", ");
            map.forEach((key, mapValue) -> {
                String keyText = String.valueOf(key);
                if (!looksSensitive(keyText)) {
                    joiner.add(keyText + "=" + sanitizeInline(mapValue));
                }
            });
            return limit(joiner.toString());
        }
        String text = String.valueOf(value)
                .replaceAll("\\s+", " ")
                .replace("password=", "password=[redacted]");
        return limit(text);
    }

    private boolean looksSensitive(String key) {
        String normalized = key == null ? "" : key.toLowerCase();
        return normalized.contains("password")
                || normalized.contains("token")
                || normalized.contains("secret")
                || normalized.contains("apikey")
                || normalized.contains("api_key")
                || normalized.contains("nationalid")
                || normalized.contains("passcode");
    }

    private String sanitizeInline(Object value) {
        if (value == null) {
            return "-";
        }
        if (value instanceof Map<?, ?> nested) {
            StringJoiner joiner = new StringJoiner(", ", "{", "}");
            nested.forEach((nestedKey, nestedValue) -> {
                String keyText = String.valueOf(nestedKey);
                if (!looksSensitive(keyText)) {
                    joiner.add(keyText + "=" + sanitizeInline(nestedValue));
                }
            });
            return joiner.toString();
        }
        return String.valueOf(value)
                .replaceAll("\\s+", " ")
                .replace("password=", "password=[redacted]");
    }

    private String formatDateTime(java.time.LocalDateTime dateTime) {
        return dateTime == null ? "-" : DATE_TIME.format(dateTime);
    }

    private String limit(String text) {
        if (text == null || text.isBlank()) {
            return "-";
        }
        return text.length() <= 520 ? text : text.substring(0, 520) + "...";
    }

    private String nullToDash(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }

    private String trimContext(String context) {
        return trimToLength(context, MAX_CONTEXT_LENGTH);
    }

    private String trimToLength(String text, int maxLength) {
        if (text == null || text.length() <= maxLength) {
            return text == null ? "" : text;
        }
        return text.substring(0, maxLength) + "\n[Context truncated]";
    }
}
