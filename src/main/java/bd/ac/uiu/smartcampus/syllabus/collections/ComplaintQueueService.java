package bd.ac.uiu.smartcampus.syllabus.collections;

import bd.ac.uiu.smartcampus.model.MaintenanceComplaint;
import bd.ac.uiu.smartcampus.model.NotificationType;
import bd.ac.uiu.smartcampus.model.User;
import bd.ac.uiu.smartcampus.repository.MaintenanceComplaintRepository;
import bd.ac.uiu.smartcampus.repository.UserRepository;
import bd.ac.uiu.smartcampus.service.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;
import java.util.Queue;

/**
 * AOOP Syllabus Requirement: Queue (FIFO - First-In, First-Out)
 * Used to manage incoming campus maintenance complaints and prioritize pending tickets.
 */
@Service
public class ComplaintQueueService {

    private final Queue<MaintenanceComplaint> complaintQueue = new ArrayDeque<>();
    private final MaintenanceComplaintRepository repository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public ComplaintQueueService(MaintenanceComplaintRepository repository,
                                 NotificationService notificationService,
                                 UserRepository userRepository) {
        this.repository = repository;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    @PostConstruct
    public void initQueueFromDatabase() {
        List<MaintenanceComplaint> pendingList = repository.findByStatusOrderByReportedAtAsc("OPEN");
        for (MaintenanceComplaint complaint : pendingList) {
            complaintQueue.offer(complaint);
        }
    }

    /**
     * Enqueue a new complaint (FIFO offer)
     */
    public synchronized MaintenanceComplaint submitComplaint(MaintenanceComplaint complaint) {
        MaintenanceComplaint saved = repository.save(complaint);
        complaintQueue.offer(saved);
        return saved;
    }

    /**
     * Process next complaint in FIFO order (poll from head of queue).
     * Skips stale entries where complaint was already manually changed from OPEN state.
     */
    @Transactional
    public synchronized MaintenanceComplaint processNextComplaint() {
        while (!complaintQueue.isEmpty()) {
            MaintenanceComplaint complaint = complaintQueue.peek();

            // Re-fetch from DB to get authoritative status
            MaintenanceComplaint dbComplaint = repository.findById(complaint.getId()).orElse(null);

            if (dbComplaint == null || !"OPEN".equals(dbComplaint.getStatus())) {
                // Stale queue entry: complaint was deleted or manually progressed — remove and skip
                complaintQueue.poll();
                continue;
            }

            // Valid OPEN complaint — process it
            dbComplaint.setStatus("RESOLVED");
            repository.save(dbComplaint);

            if ("ROLE_TEACHER".equals(dbComplaint.getReporterRole())) {
                userRepository.findByStudentOrEmpId(dbComplaint.getReporterId()).ifPresent(teacher -> {
                    String message = String.format("\"%s\" in %s has been resolved.", dbComplaint.getIssueTitle(), dbComplaint.getLocation());
                    notificationService.createNotification(
                            teacher,
                            NotificationType.COMPLAINT_UPDATE,
                            "Maintenance issue resolved",
                            message,
                            "reportIssue",
                            dbComplaint.getId().toString(),
                            "COMPLAINT_RESOLVED:" + dbComplaint.getId()
                    );
                });
            }

            complaintQueue.poll();
            return dbComplaint;
        }
        return null;
    }

    /**
     * Remove a complaint from the in-memory queue (call when admin manually changes status away from OPEN).
     * Prevents stale entries from blocking the FIFO queue.
     */
    public synchronized void removeFromQueue(Long complaintId) {
        complaintQueue.removeIf(c -> c.getId() != null && c.getId().equals(complaintId));
    }

    /**
     * Peek at the next complaint waiting in queue
     */
    public synchronized MaintenanceComplaint peekNextComplaint() {
        return complaintQueue.peek();
    }

    /**
     * Return list of currently queued complaints for visualization
     */
    public synchronized List<MaintenanceComplaint> getQueuedComplaints() {
        return new ArrayList<>(complaintQueue);
    }

    public synchronized int getQueueSize() {
        return complaintQueue.size();
    }
}

