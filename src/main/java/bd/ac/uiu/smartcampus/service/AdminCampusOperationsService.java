package bd.ac.uiu.smartcampus.service;

import bd.ac.uiu.smartcampus.model.*;
import bd.ac.uiu.smartcampus.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class AdminCampusOperationsService {

    @Autowired
    private BusRepository busRepository;

    @Autowired
    private BusRouteRepository busRouteRepository;

    @Autowired
    private ParkingZoneRepository parkingZoneRepository;

    @Autowired
    private CampusVisitorRepository visitorRepository;

    @Autowired
    private CampusEventRepository eventRepository;

    @Autowired
    private CafeteriaMenuItemRepository menuRepository;

    @Autowired
    private LostFoundItemRepository lostFoundRepository;

    @Autowired
    private ClassroomRepository classroomRepository;

    @Autowired
    private TeachingScheduleRepository teachingScheduleRepository;

    @Autowired
    private RoomReservationRepository roomReservationRepository;

    @Autowired
    private AdminActionLogRepository adminActionLogRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private bd.ac.uiu.smartcampus.repository.UserRepository userRepository;

    @Autowired
    private MaintenanceComplaintRepository complaintRepository;

    // ----- BUS -----
    public List<Bus> getAllBuses() {
        return busRepository.findAll();
    }

    public Bus createBus(Bus bus, String adminEmail) {
        String busCode = required(bus.getBusCode(), "Bus code is required.").toUpperCase(Locale.ROOT);
        String registrationNumber = required(bus.getRegistrationNumber(), "Registration number is required.").toUpperCase(Locale.ROOT);
        if (busRepository.findByBusCode(busCode).isPresent()) {
            throw new IllegalArgumentException("Bus code already exists");
        }
        if (busRepository.findByRegistrationNumber(registrationNumber).isPresent()) {
            throw new IllegalArgumentException("Registration number already exists");
        }
        validateCapacity(bus.getCapacity(), "Bus capacity must be > 0");
        bus.setBusCode(busCode);
        bus.setRegistrationNumber(registrationNumber);
        bus.setOperationalStatus(normalizeBusStatus(bus.getOperationalStatus()));
        Bus saved = busRepository.save(bus);
        logAction(adminEmail, "BUS_CREATED", "Created bus " + bus.getBusCode());
        return saved;
    }

    public Bus updateBus(Long id, Bus updated, String adminEmail) {
        Bus bus = busRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Bus not found"));
        validateCapacity(updated.getCapacity(), "Bus capacity must be > 0");
        bus.setDriverName(updated.getDriverName());
        bus.setDriverPhone(updated.getDriverPhone());
        bus.setCapacity(updated.getCapacity());
        Bus saved = busRepository.save(bus);
        logAction(adminEmail, "BUS_UPDATED", "Updated bus " + bus.getBusCode());
        return saved;
    }

    public Bus updateBusStatus(Long id, String status, boolean active, String adminEmail) {
        Bus bus = busRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Bus not found"));
        if (status != null && !status.isBlank()) {
            bus.setOperationalStatus(normalizeBusStatus(status));
        }
        bus.setActive(active);
        Bus saved = busRepository.save(bus);
        logAction(adminEmail, "BUS_STATUS_CHANGED", "Changed status of bus " + bus.getBusCode());
        return saved;
    }

    // ----- ROUTE -----
    public List<BusRoute> getAllRoutes() {
        return busRouteRepository.findAll();
    }

    public BusRoute createRoute(BusRoute route, String adminEmail) {
        String routeCode = required(route.getRouteCode(), "Route code is required.").toUpperCase(Locale.ROOT);
        required(route.getName(), "Route name is required.");
        required(route.getOrigin(), "Route origin is required.");
        required(route.getDestination(), "Route destination is required.");
        if (busRouteRepository.findByRouteCode(routeCode).isPresent()) {
            throw new IllegalArgumentException("Route code already exists");
        }
        route.setRouteCode(routeCode);
        validateStops(route.getStops());
        if (route.getAssignedBus() != null && route.getAssignedBus().getId() != null) {
            Bus bus = busRepository.findById(route.getAssignedBus().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Assigned bus not found"));
            if (!bus.isActive()) {
                throw new IllegalArgumentException("Cannot assign inactive bus");
            }
            route.setAssignedBus(bus);
        } else {
            route.setAssignedBus(null);
        }
        BusRoute saved = busRouteRepository.save(route);
        logAction(adminEmail, "BUS_ROUTE_CREATED", "Created route " + route.getRouteCode());
        return saved;
    }

    public BusRoute assignBusToRoute(Long routeId, Long busId, String adminEmail) {
        BusRoute route = busRouteRepository.findById(routeId).orElseThrow();
        Bus bus = busId != null ? busRepository.findById(busId).orElse(null) : null;
        if (bus != null && !bus.isActive()) {
            throw new IllegalArgumentException("Cannot assign inactive bus");
        }
        route.setAssignedBus(bus);
        logAction(adminEmail, "BUS_ROUTE_UPDATED", "Assigned bus to route " + route.getRouteCode());
        return busRouteRepository.save(route);
    }

    public BusRoute updateRouteStatus(Long id, boolean active, String adminEmail) {
        BusRoute route = busRouteRepository.findById(id).orElseThrow();
        route.setActive(active);
        logAction(adminEmail, "BUS_ROUTE_STATUS_CHANGED", "Changed status of route " + route.getRouteCode());
        return busRouteRepository.save(route);
    }

    // ----- PARKING -----
    public List<ParkingZone> getAllParkingZones() {
        return parkingZoneRepository.findAll();
    }

    public ParkingZone updateParkingOccupancy(Long id, int occupied, String adminEmail) {
        ParkingZone zone = parkingZoneRepository.findById(id).orElseThrow();
        if (occupied < 0 || occupied > zone.getTotalCapacity()) {
            throw new IllegalArgumentException("Invalid occupancy");
        }
        zone.setCurrentOccupied(occupied);
        logAction(adminEmail, "PARKING_UPDATED", "Updated occupancy for " + zone.getZoneCode());
        return parkingZoneRepository.save(zone);
    }

    public ParkingZone updateParkingCapacity(Long id, int capacity, String adminEmail) {
        ParkingZone zone = parkingZoneRepository.findById(id).orElseThrow();
        if (capacity <= 0 || zone.getCurrentOccupied() > capacity) {
            throw new IllegalArgumentException("Invalid capacity");
        }
        zone.setTotalCapacity(capacity);
        logAction(adminEmail, "PARKING_UPDATED", "Updated capacity for " + zone.getZoneCode());
        return parkingZoneRepository.save(zone);
    }

    public ParkingZone createParkingZone(ParkingZone zone, String adminEmail) {
        String zoneCode = required(zone.getZoneCode(), "Zone code is required.").toUpperCase(Locale.ROOT);
        required(zone.getZoneName(), "Zone name is required.");
        if (parkingZoneRepository.existsByZoneCode(zoneCode)) {
            throw new IllegalArgumentException("Parking zone code already exists");
        }
        validateCapacity(zone.getTotalCapacity(), "Parking capacity must be > 0");
        if (zone.getCurrentOccupied() < 0 || zone.getCurrentOccupied() > zone.getTotalCapacity()) {
            throw new IllegalArgumentException("Invalid occupancy");
        }
        zone.setZoneCode(zoneCode);
        zone.updateStatus();
        ParkingZone saved = parkingZoneRepository.save(zone);
        logAction(adminEmail, "PARKING_CREATED", "Created parking zone " + zone.getZoneCode());
        return saved;
    }

    // ----- COMPLAINTS -----
    public MaintenanceComplaint updateComplaintStatus(Long id, String status, String resolutionNote, String adminEmail) {
        MaintenanceComplaint complaint = complaintRepository.findById(id).orElseThrow();
        complaint.setStatus(status.toUpperCase(Locale.ROOT));
        if (resolutionNote != null && !resolutionNote.isBlank()) {
            complaint.setResolutionNote(resolutionNote);
        }
        if ("RESOLVED".equalsIgnoreCase(status) || "CLOSED".equalsIgnoreCase(status)) {
            if (complaint.getResolvedAt() == null) {
                complaint.setResolvedAt(LocalDateTime.now());
            }
        }
        
        MaintenanceComplaint saved = complaintRepository.save(complaint);
        
        // Notify reporter
        if (complaint.getReporterId() != null) {
            userRepository.findByStudentOrEmpId(complaint.getReporterId()).ifPresent(user -> {
                String message = String.format("Your complaint \"%s\" in %s is now %s.", complaint.getIssueTitle(), complaint.getLocation(), status);
                if (resolutionNote != null && !resolutionNote.isBlank()) {
                    message += " Note: " + resolutionNote;
                }
                notificationService.createNotification(
                        user,
                        NotificationType.COMPLAINT_UPDATE,
                        "Complaint Status Updated",
                        message,
                        "reportIssue",
                        complaint.getId().toString(),
                        "COMPLAINT_UPDATE:" + complaint.getId() + ":" + status
                );
            });
        }
        
        logAction(adminEmail, "COMPLAINT_UPDATED", "Updated complaint " + id + " to " + status);
        return saved;
    }

    // ----- VISITORS -----
    public List<CampusVisitor> getAllVisitors() {
        return visitorRepository.findAll();
    }

    public CampusVisitor approveVisitor(Long id, String adminEmail) {
        CampusVisitor visitor = visitorRepository.findById(id).orElseThrow();
        if (!"PENDING".equals(visitor.getStatus())) {
            throw new IllegalStateException("Visitor is not pending");
        }
        visitor.setStatus("APPROVED");
        visitor.setApprovedBy(adminEmail);
        CampusVisitor saved = visitorRepository.save(visitor);
        
        List<bd.ac.uiu.smartcampus.model.User> hosts = userRepository.searchUsers(visitor.getHostName(), bd.ac.uiu.smartcampus.model.Role.ROLE_TEACHER, true);
        if (!hosts.isEmpty()) {
            notificationService.createNotification(
                hosts.get(0),
                bd.ac.uiu.smartcampus.model.NotificationType.SYSTEM,
                "Visitor Approved",
                "Visitor " + visitor.getVisitorName() + " has been approved.",
                "/teacher/visitors",
                "VISITOR_APPROVED_" + visitor.getId(),
                "VIS_APP_" + visitor.getId()
            );
        }
        logAction(adminEmail, "VISITOR_APPROVED", "Approved visitor " + visitor.getPassCode());
        return saved;
    }

    public CampusVisitor rejectVisitor(Long id, String reason, String adminEmail) {
        CampusVisitor visitor = visitorRepository.findById(id).orElseThrow();
        if (!"PENDING".equals(visitor.getStatus())) {
            throw new IllegalStateException("Visitor is not pending");
        }
        visitor.setStatus("REJECTED");
        visitor.setSecurityRemarks(reason);
        visitor.setApprovedBy(adminEmail);
        CampusVisitor saved = visitorRepository.save(visitor);
        logAction(adminEmail, "VISITOR_REJECTED", "Rejected visitor " + visitor.getPassCode());
        return saved;
    }

    // ----- EVENTS -----
    public List<CampusEvent> getAllEvents() {
        return eventRepository.findAll();
    }

    public CampusEvent createEvent(CampusEvent event, String adminEmail) {
        required(event.getTitle(), "Event title is required.");
        if (event.getEventDate() == null || event.getStartTime() == null || event.getEndTime() == null) {
            throw new IllegalArgumentException("Event date, start time, and end time are required");
        }
        if (event.getEventDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Event date cannot be in the past");
        }
        if (event.getCapacity() != null && event.getCapacity() < 0) {
            throw new IllegalArgumentException("Capacity cannot be negative");
        }
        if (!event.getStartTime().isBefore(event.getEndTime())) {
            throw new IllegalArgumentException("End time must be after start time");
        }
        event.setStatus(normalizeEventStatus(event.getStatus()));
        validateEventRoomConflict(event);
        CampusEvent saved = eventRepository.save(event);
        logAction(adminEmail, "EVENT_CREATED", "Created event " + event.getTitle());
        return saved;
    }
    
    public CampusEvent updateEventStatus(Long id, String status, String adminEmail) {
        CampusEvent event = eventRepository.findById(id).orElseThrow();
        event.setStatus(normalizeEventStatus(status));
        CampusEvent saved = eventRepository.save(event);
        logAction(adminEmail, "EVENT_UPDATED", "Updated event status to " + status);
        return saved;
    }

    // ----- CAFETERIA -----
    public List<CafeteriaMenuItem> getAllMenuItems() {
        return menuRepository.findAll();
    }

    public CafeteriaMenuItem createMenuItem(CafeteriaMenuItem item, String adminEmail) {
        required(item.getName(), "Menu item name is required.");
        required(item.getCategory(), "Menu item category is required.");
        if (item.getPrice() == null) {
            throw new IllegalArgumentException("Price is required");
        }
        if (item.getPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Price cannot be negative");
        }
        CafeteriaMenuItem saved = menuRepository.save(item);
        logAction(adminEmail, "CAFETERIA_ITEM_CREATED", "Created menu item " + item.getName());
        return saved;
    }

    public CafeteriaMenuItem updateMenuItemAvailability(Long id, boolean available, String adminEmail) {
        CafeteriaMenuItem item = menuRepository.findById(id).orElseThrow();
        item.setAvailable(available);
        CafeteriaMenuItem saved = menuRepository.save(item);
        logAction(adminEmail, "CAFETERIA_ITEM_AVAILABILITY_CHANGED", "Changed availability of " + item.getName());
        return saved;
    }

    // ----- LOST & FOUND -----
    public List<LostFoundItem> getAllLostFoundItems() {
        return lostFoundRepository.findAll();
    }

    public LostFoundItem resolveLostFoundItem(Long id, String action, String adminEmail) {
        LostFoundItem item = lostFoundRepository.findById(id).orElseThrow();
        if (item.getStatus() == LostFoundItem.ItemStatus.RESOLVED) {
            throw new IllegalStateException("Lost and found item is already resolved");
        }
        if ("RETURNED".equalsIgnoreCase(action)) {
            item.setStatus(LostFoundItem.ItemStatus.RESOLVED);
            logAction(adminEmail, "LOST_FOUND_RETURNED", "Returned lost item " + id);
        } else if ("CLOSE".equalsIgnoreCase(action)) {
            item.setStatus(LostFoundItem.ItemStatus.RESOLVED);
            logAction(adminEmail, "LOST_FOUND_CLOSED", "Closed lost item " + id);
        } else {
            throw new IllegalArgumentException("Invalid action");
        }
        item.setResolvedAt(LocalDateTime.now());
        return lostFoundRepository.save(item);
    }

    private void logAction(String email, String actionType, String description) {
        AdminActionLog log = new AdminActionLog(email, actionType, description);
        adminActionLogRepository.save(log);
    }

    private String required(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return value.trim();
    }

    private void validateCapacity(int capacity, String message) {
        if (capacity <= 0) {
            throw new IllegalArgumentException(message);
        }
    }

    private String normalizeBusStatus(String value) {
        String status = value == null || value.isBlank() ? "AVAILABLE" : value.trim().toUpperCase(Locale.ROOT);
        if (!Set.of("AVAILABLE", "IN_SERVICE", "ON_ROUTE", "MAINTENANCE", "OUT_OF_SERVICE").contains(status)) {
            throw new IllegalArgumentException("Invalid bus operational status");
        }
        return status;
    }

    private String normalizeEventStatus(String value) {
        String status = value == null || value.isBlank() ? "DRAFT" : value.trim().toUpperCase(Locale.ROOT);
        if (!Set.of("DRAFT", "PUBLISHED", "COMPLETED", "CANCELLED").contains(status)) {
            throw new IllegalArgumentException("Invalid event status");
        }
        return status;
    }

    private void validateStops(List<BusRouteStop> stops) {
        if (stops == null || stops.isEmpty()) {
            return;
        }
        Set<Integer> orders = stops.stream().map(BusRouteStop::getStopOrder).collect(Collectors.toSet());
        if (orders.size() != stops.size()) {
            throw new IllegalArgumentException("Route stop orders must be unique");
        }
        for (BusRouteStop stop : stops) {
            required(stop.getStopName(), "Route stop name is required.");
            if (stop.getStopOrder() <= 0) {
                throw new IllegalArgumentException("Route stop order must be positive");
            }
        }
    }

    private void validateEventRoomConflict(CampusEvent event) {
        if (event.getLocation() == null || event.getLocation().isBlank()) {
            return;
        }
        classroomRepository.findByRoomNumber(event.getLocation().trim()).ifPresent(room -> {
            String dayOfWeek = dayName(event.getEventDate());
            if (teachingScheduleRepository.hasRoomConflict(room.getId(), dayOfWeek, event.getStartTime(), event.getEndTime(), null)) {
                throw new IllegalArgumentException("Event conflicts with a scheduled class in this classroom");
            }
            boolean reservationConflict = !roomReservationRepository.findConflicts(
                    room.getRoomNumber(), event.getEventDate(), event.getStartTime(), event.getEndTime()).isEmpty();
            if (reservationConflict) {
                throw new IllegalArgumentException("Event conflicts with an existing room reservation");
            }
        });
    }

    private String dayName(LocalDate date) {
        String value = date.getDayOfWeek().name().toLowerCase(Locale.ROOT);
        return value.substring(0, 1).toUpperCase(Locale.ROOT) + value.substring(1);
    }
}
