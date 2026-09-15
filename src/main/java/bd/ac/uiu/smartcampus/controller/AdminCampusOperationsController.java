package bd.ac.uiu.smartcampus.controller;

import bd.ac.uiu.smartcampus.dto.ApiResponse;
import bd.ac.uiu.smartcampus.model.*;
import bd.ac.uiu.smartcampus.service.AdminCampusOperationsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/campus-operations")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCampusOperationsController {

    @Autowired
    private AdminCampusOperationsService service;

    private String getAdminEmail(Authentication authentication) {
        return authentication.getName();
    }

    // ----- BUS -----
    @GetMapping("/buses")
    public ApiResponse<List<Bus>> getAllBuses() {
        return ApiResponse.ok("Fetched buses", service.getAllBuses());
    }

    @PostMapping("/buses")
    public ApiResponse<Bus> createBus(@RequestBody Bus bus, Authentication authentication) {
        return ApiResponse.ok("Created bus", service.createBus(bus, getAdminEmail(authentication)));
    }

    @PutMapping("/buses/{id}")
    public ApiResponse<Bus> updateBus(@PathVariable Long id, @RequestBody Bus bus, Authentication authentication) {
        return ApiResponse.ok("Updated bus", service.updateBus(id, bus, getAdminEmail(authentication)));
    }

    @PatchMapping("/buses/{id}/status")
    public ApiResponse<Bus> updateBusStatus(@PathVariable Long id, @RequestBody Map<String, Object> payload, Authentication authentication) {
        String status = (String) payload.get("status");
        boolean active = (Boolean) payload.get("active");
        return ApiResponse.ok("Updated bus status", service.updateBusStatus(id, status, active, getAdminEmail(authentication)));
    }

    // ----- ROUTE -----
    @GetMapping("/routes")
    public ApiResponse<List<BusRoute>> getAllRoutes() {
        return ApiResponse.ok("Fetched routes", service.getAllRoutes());
    }

    @PostMapping("/routes")
    public ApiResponse<BusRoute> createRoute(@RequestBody BusRoute route, Authentication authentication) {
        return ApiResponse.ok("Created route", service.createRoute(route, getAdminEmail(authentication)));
    }

    @PatchMapping("/routes/{id}/assign")
    public ApiResponse<BusRoute> assignBus(@PathVariable Long id, @RequestBody Map<String, Long> payload, Authentication authentication) {
        Long busId = payload.get("busId");
        return ApiResponse.ok("Assigned bus", service.assignBusToRoute(id, busId, getAdminEmail(authentication)));
    }

    @PatchMapping("/routes/{id}/status")
    public ApiResponse<BusRoute> updateRouteStatus(@PathVariable Long id, @RequestBody Map<String, Boolean> payload, Authentication authentication) {
        Boolean active = payload.get("active");
        return ApiResponse.ok("Updated route status", service.updateRouteStatus(id, active, getAdminEmail(authentication)));
    }

    // ----- PARKING -----
    @GetMapping("/parking")
    public ApiResponse<List<ParkingZone>> getAllParkingZones() {
        return ApiResponse.ok("Fetched parking zones", service.getAllParkingZones());
    }

    @PostMapping("/parking")
    public ApiResponse<ParkingZone> createParkingZone(@RequestBody ParkingZone zone, Authentication authentication) {
        return ApiResponse.ok("Created parking zone", service.createParkingZone(zone, getAdminEmail(authentication)));
    }

    @PatchMapping("/parking/{id}/occupancy")
    public ApiResponse<ParkingZone> updateParkingOccupancy(@PathVariable Long id, @RequestBody Map<String, Integer> payload, Authentication authentication) {
        Integer occupied = payload.get("occupied");
        return ApiResponse.ok("Updated parking occupancy", service.updateParkingOccupancy(id, occupied, getAdminEmail(authentication)));
    }
    
    @PatchMapping("/parking/{id}/capacity")
    public ApiResponse<ParkingZone> updateParkingCapacity(@PathVariable Long id, @RequestBody Map<String, Integer> payload, Authentication authentication) {
        Integer capacity = payload.get("capacity");
        return ApiResponse.ok("Updated parking capacity", service.updateParkingCapacity(id, capacity, getAdminEmail(authentication)));
    }

    // ----- VISITORS -----
    @GetMapping("/visitors")
    public ApiResponse<List<CampusVisitor>> getAllVisitors() {
        return ApiResponse.ok("Fetched visitors", service.getAllVisitors());
    }

    @PostMapping("/visitors/{id}/approve")
    public ApiResponse<CampusVisitor> approveVisitor(@PathVariable Long id, Authentication authentication) {
        return ApiResponse.ok("Approved visitor", service.approveVisitor(id, getAdminEmail(authentication)));
    }

    @PostMapping("/visitors/{id}/reject")
    public ApiResponse<CampusVisitor> rejectVisitor(@PathVariable Long id, @RequestBody Map<String, String> payload, Authentication authentication) {
        String reason = payload.get("reason");
        return ApiResponse.ok("Rejected visitor", service.rejectVisitor(id, reason, getAdminEmail(authentication)));
    }

    // ----- EVENTS -----
    @GetMapping("/events")
    public ApiResponse<List<CampusEvent>> getAllEvents() {
        return ApiResponse.ok("Fetched events", service.getAllEvents());
    }

    @PostMapping("/events")
    public ApiResponse<CampusEvent> createEvent(@RequestBody CampusEvent event, Authentication authentication) {
        return ApiResponse.ok("Created event", service.createEvent(event, getAdminEmail(authentication)));
    }
    
    @PatchMapping("/events/{id}/status")
    public ApiResponse<CampusEvent> updateEventStatus(@PathVariable Long id, @RequestBody Map<String, String> payload, Authentication authentication) {
        String status = payload.get("status");
        return ApiResponse.ok("Updated event status", service.updateEventStatus(id, status, getAdminEmail(authentication)));
    }

    // ----- CAFETERIA -----
    @GetMapping("/cafeteria")
    public ApiResponse<List<CafeteriaMenuItem>> getMenuItems() {
        return ApiResponse.ok("Fetched menu items", service.getAllMenuItems());
    }

    @PostMapping("/cafeteria")
    public ApiResponse<CafeteriaMenuItem> createMenuItem(@RequestBody CafeteriaMenuItem item, Authentication authentication) {
        return ApiResponse.ok("Created menu item", service.createMenuItem(item, getAdminEmail(authentication)));
    }

    @PatchMapping("/cafeteria/{id}/availability")
    public ApiResponse<CafeteriaMenuItem> updateMenuAvailability(@PathVariable Long id, @RequestBody Map<String, Boolean> payload, Authentication authentication) {
        Boolean available = payload.get("available");
        return ApiResponse.ok("Updated menu availability", service.updateMenuItemAvailability(id, available, getAdminEmail(authentication)));
    }

    // ----- LOST & FOUND -----
    @GetMapping("/lost-found")
    public ApiResponse<List<LostFoundItem>> getAllLostFoundItems() {
        return ApiResponse.ok("Fetched lost and found items", service.getAllLostFoundItems());
    }

    @PostMapping("/lost-found/{id}/resolve")
    public ApiResponse<LostFoundItem> resolveLostFoundItem(@PathVariable Long id, @RequestBody Map<String, String> payload, Authentication authentication) {
        String action = payload.get("action"); // RETURNED or CLOSE
        return ApiResponse.ok("Resolved lost item", service.resolveLostFoundItem(id, action, getAdminEmail(authentication)));
    }
}
