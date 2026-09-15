package bd.ac.uiu.smartcampus.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(
        name = "bus_route_stops",
        uniqueConstraints = @UniqueConstraint(columnNames = {"route_id", "stop_order"})
)
public class BusRouteStop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "route_id", nullable = false)
    @JsonIgnore
    private BusRoute route;

    @Column(nullable = false, length = 100)
    private String stopName;

    @Column(nullable = false)
    private int stopOrder;

    @Column
    private Integer estimatedOffsetMinutes;

    public BusRouteStop() {
    }

    public BusRouteStop(String stopName, int stopOrder, Integer estimatedOffsetMinutes) {
        this.stopName = stopName;
        this.stopOrder = stopOrder;
        this.estimatedOffsetMinutes = estimatedOffsetMinutes;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public BusRoute getRoute() {
        return route;
    }

    public void setRoute(BusRoute route) {
        this.route = route;
    }

    public String getStopName() {
        return stopName;
    }

    public void setStopName(String stopName) {
        this.stopName = stopName;
    }

    public int getStopOrder() {
        return stopOrder;
    }

    public void setStopOrder(int stopOrder) {
        this.stopOrder = stopOrder;
    }

    public Integer getEstimatedOffsetMinutes() {
        return estimatedOffsetMinutes;
    }

    public void setEstimatedOffsetMinutes(Integer estimatedOffsetMinutes) {
        this.estimatedOffsetMinutes = estimatedOffsetMinutes;
    }
}
