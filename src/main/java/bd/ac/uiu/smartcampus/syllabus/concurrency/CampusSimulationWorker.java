package bd.ac.uiu.smartcampus.syllabus.concurrency;

import bd.ac.uiu.smartcampus.dto.CampusTelemetryDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.time.LocalDateTime;
import java.util.Random;

/**
 * AOOP Syllabus Requirement: Java Concurrency & Threads (Thread / Runnable)
 * Runs a background worker thread that continuously generates simulated Smart Campus sensor telemetry.
 */
@Service
public class CampusSimulationWorker implements Runnable {

    private static final Logger logger = LoggerFactory.getLogger(CampusSimulationWorker.class);

    private volatile boolean running = true;
    private Thread workerThread;
    private final Random random = new Random();

    // In-memory live telemetry snapshot
    private final CampusTelemetryDto currentTelemetry = new CampusTelemetryDto();

    @PostConstruct
    public void startWorker() {
        // Initialize baseline metrics
        currentTelemetry.setActiveStudents(1840);
        currentTelemetry.setFacultyOnCampus(125);
        currentTelemetry.setTotalRooms(60);
        currentTelemetry.setOccupiedRooms(42);
        currentTelemetry.setPowerConsumptionKW(145.8);
        currentTelemetry.setCampusTemperatureC(28.4);
        currentTelemetry.setAirQualityIndex("Good (AQI 45)");
        currentTelemetry.setActiveBuses(6);
        currentTelemetry.setPendingComplaints(3);
        currentTelemetry.setVisitorsToday(48);
        currentTelemetry.setSystemStatus("OPTIMAL");
        currentTelemetry.setTimestamp(LocalDateTime.now());

        // Launch background thread
        workerThread = new Thread(this, "Campus-Digital-Twin-Simulation-Thread");
        workerThread.setDaemon(true);
        workerThread.start();
        logger.info("Smart Campus simulated telemetry worker thread started successfully.");
    }

    @Override
    public void run() {
        while (running) {
            try {
                // Sleep for 3 seconds between sensor updates
                Thread.sleep(3000);

                // Simulate realistic campus fluctuations
                synchronized (currentTelemetry) {
                    int studentDelta = random.nextInt(11) - 5; // -5 to +5
                    currentTelemetry.setActiveStudents(Math.max(1500, Math.min(2500, currentTelemetry.getActiveStudents() + studentDelta)));

                    int roomDelta = random.nextInt(3) - 1; // -1, 0, 1
                    currentTelemetry.setOccupiedRooms(Math.max(20, Math.min(58, currentTelemetry.getOccupiedRooms() + roomDelta)));

                    double powerDelta = (random.nextDouble() * 2.0) - 1.0;
                    currentTelemetry.setPowerConsumptionKW(Math.round((currentTelemetry.getPowerConsumptionKW() + powerDelta) * 10.0) / 10.0);

                    currentTelemetry.setTimestamp(LocalDateTime.now());
                }
            } catch (InterruptedException e) {
                logger.info("Simulation thread interrupted, exiting gracefully.");
                Thread.currentThread().interrupt();
                break;
            }
        }
    }

    public CampusTelemetryDto getLatestTelemetry() {
        synchronized (currentTelemetry) {
            CampusTelemetryDto copy = new CampusTelemetryDto();
            copy.setActiveStudents(currentTelemetry.getActiveStudents());
            copy.setFacultyOnCampus(currentTelemetry.getFacultyOnCampus());
            copy.setTotalRooms(currentTelemetry.getTotalRooms());
            copy.setOccupiedRooms(currentTelemetry.getOccupiedRooms());
            copy.setPowerConsumptionKW(currentTelemetry.getPowerConsumptionKW());
            copy.setCampusTemperatureC(currentTelemetry.getCampusTemperatureC());
            copy.setAirQualityIndex(currentTelemetry.getAirQualityIndex());
            copy.setActiveBuses(currentTelemetry.getActiveBuses());
            copy.setPendingComplaints(currentTelemetry.getPendingComplaints());
            copy.setVisitorsToday(currentTelemetry.getVisitorsToday());
            copy.setSystemStatus(currentTelemetry.getSystemStatus());
            copy.setTimestamp(currentTelemetry.getTimestamp());
            return copy;
        }
    }

    @PreDestroy
    public void stopWorker() {
        running = false;
        if (workerThread != null) {
            workerThread.interrupt();
        }
    }
}
