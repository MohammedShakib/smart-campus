package bd.ac.uiu.smartcampus.repository;

import bd.ac.uiu.smartcampus.model.CampusEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface CampusEventRepository extends JpaRepository<CampusEvent, Long> {
    List<CampusEvent> findByEventDateGreaterThanEqualOrderByEventDateAsc(LocalDate date);

    /**
     * Find events that conflict with the given location/date/time window.
     * Excludes CANCELLED events (they don't block rooms).
     * Excludes the event with the given excludeId (for update self-exclusion; pass null for new events).
     * Overlap condition: existing.start < requestedEnd AND existing.end > requestedStart
     */
    @Query("SELECT e FROM CampusEvent e WHERE e.location = :location " +
           "AND e.eventDate = :date " +
           "AND e.status <> 'CANCELLED' " +
           "AND (:excludeId IS NULL OR e.id <> :excludeId) " +
           "AND e.startTime < :endTime " +
           "AND e.endTime > :startTime")
    List<CampusEvent> findConflictingEvents(
            @Param("location") String location,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("excludeId") Long excludeId);
}

