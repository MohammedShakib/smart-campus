package bd.ac.uiu.smartcampus.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bus_routes")
public class BusRoute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String routeCode; // e.g. "R-01"

    @Column(nullable = false, length = 100)
    private String name; // e.g. "Natun Bazar to UIU"

    @Column(nullable = false, length = 100)
    private String origin;

    @Column(nullable = false, length = 100)
    private String destination;

    @Column(nullable = false)
    private boolean active = true;

    @OneToMany(mappedBy = "route", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("stopOrder ASC")
    private List<BusRouteStop> stops = new ArrayList<>();

    // Optionally assign a bus
    @ManyToOne
    @JoinColumn(name = "assigned_bus_id")
    private Bus assignedBus;

    public BusRoute() {
    }

    public BusRoute(String routeCode, String name, String origin, String destination) {
        this.routeCode = routeCode;
        this.name = name;
        this.origin = origin;
        this.destination = destination;
        this.active = true;
    }

    public void addStop(BusRouteStop stop) {
        stops.add(stop);
        stop.setRoute(this);
    }

    public void removeStop(BusRouteStop stop) {
        stops.remove(stop);
        stop.setRoute(null);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRouteCode() {
        return routeCode;
    }

    public void setRouteCode(String routeCode) {
        this.routeCode = routeCode;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getOrigin() {
        return origin;
    }

    public void setOrigin(String origin) {
        this.origin = origin;
    }

    public String getDestination() {
        return destination;
    }

    public void setDestination(String destination) {
        this.destination = destination;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public List<BusRouteStop> getStops() {
        return stops;
    }

    public void setStops(List<BusRouteStop> stops) {
        this.stops.clear();
        if (stops != null) {
            stops.forEach(this::addStop);
        }
    }

    public Bus getAssignedBus() {
        return assignedBus;
    }

    public void setAssignedBus(Bus assignedBus) {
        this.assignedBus = assignedBus;
    }
}
