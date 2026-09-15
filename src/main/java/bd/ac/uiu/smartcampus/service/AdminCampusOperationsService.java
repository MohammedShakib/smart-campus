package bd.ac.uiu.smartcampus.service;

import bd.ac.uiu.smartcampus.model.*;
import bd.ac.uiu.smartcampus.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

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
    private AdminActionLogRepository adminActionLogRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private bd.ac.uiu.smartcampus.repository.UserRepository userRepository;

    // ----- BUS -----
    public List<Bus> getAllBuses() {
        return busRepository.findAll();
    }

    public Bus createBus(Bus bus, String adminEmail) {
        if (busRepository.findByBusCode(bus.getBusCode()).isPresent()) {
            throw new IllegalArgumentException("Bus code already exists");
        }
        if (bus.getCapacity() <= 0) {
            throw new IllegalArgumentException("Bus capacity must be > 0");
        }
        Bus saved = busRepository.save(bus);
        logAction(adminEmail, "BUS_CREATED", "Created bus " + bus.getBusCode());
        return saved;
    }

    public Bus updateBus(Long id, Bus updated, String adminEmail) {
        Bus bus = busRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Bus not found"));
        bus.setDriverName(updated.getDriverName());
        bus.setDriverPhone(updated.getDriverPhone());
        bus.setCapacity(updated.getCapacity());
        Bus saved = busRepository.save(bus);
        logAction(adminEmail, "BUS_UPDATED", "Updated bus " + bus.getBusCode());
        return saved;
    }

    public Bus updateBusStatus(Long id, String status, boolean active, String adminEmail) {
        Bus bus = busRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Bus not found"));
        bus.setOperationalStatus(status);
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
        if (busRouteRepository.findByRouteCode(route.getRouteCode()).isPresent()) {
            throw new IllegalArgumentException("Route code already exists");
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
        ParkingZone saved = parkingZoneRepository.save(zone);
        logAction(adminEmail, "PARKING_CREATED", "Created parking zone " + zone.getZoneCode());
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
        if (event.getCapacity() != null && event.getCapacity() < 0) {
            throw new IllegalArgumentException("Capacity cannot be negative");
        }
        if (event.getEndTime().isBefore(event.getStartTime())) {
            throw new IllegalArgumentException("End time must be after start time");
        }
        CampusEvent saved = eventRepository.save(event);
        logAction(adminEmail, "EVENT_CREATED", "Created event " + event.getTitle());
        return saved;
    }
    
    public CampusEvent updateEventStatus(Long id, String status, String adminEmail) {
        CampusEvent event = eventRepository.findById(id).orElseThrow();
        event.setStatus(status);
        CampusEvent saved = eventRepository.save(event);
        logAction(adminEmail, "EVENT_UPDATED", "Updated event status to " + status);
        return saved;
    }

    // ----- CAFETERIA -----
    public List<CafeteriaMenuItem> getAllMenuItems() {
        return menuRepository.findAll();
    }

    public CafeteriaMenuItem createMenuItem(CafeteriaMenuItem item, String adminEmail) {
        if (item.getPrice().doubleValue() < 0) {
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
}
