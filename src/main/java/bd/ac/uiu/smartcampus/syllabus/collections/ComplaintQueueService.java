package bd.ac.uiu.smartcampus.syllabus.collections;

import bd.ac.uiu.smartcampus.model.MaintenanceComplaint;
import bd.ac.uiu.smartcampus.model.NotificationType;
import bd.ac.uiu.smartcampus.model.User;
import bd.ac.uiu.smartcampus.repository.MaintenanceComplaintRepository;
import bd.ac.uiu.smartcampus.repository.UserRepository;
import bd.ac.uiu.smartcampus.service.NotificationService;
import org.springframework.stereotype.Service;

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
        List<MaintenanceComplaint> pendingList = repository.findByStatusOrderByReportedAtAsc("PENDING");
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
     * Process next complaint in FIFO order (poll from head of queue)
     */
    public synchronized MaintenanceComplaint processNextComplaint() {
        if (!complaintQueue.isEmpty()) {
            MaintenanceComplaint complaint = complaintQueue.poll();
            complaint.setStatus("RESOLVED");
            repository.save(complaint);
            
            if ("ROLE_TEACHER".equals(complaint.getReporterRole())) {
                userRepository.findByStudentOrEmpId(complaint.getReporterId()).ifPresent(teacher -> {
                    String message = String.format("\"%s\" in %s has been resolved.", complaint.getIssueTitle(), complaint.getLocation());
                    notificationService.createNotification(
                            teacher,
                            NotificationType.COMPLAINT_UPDATE,
                            "Maintenance issue resolved",
                            message,
                            "reportIssue",
                            complaint.getId().toString(),
                            null
                    );
                });
            }
            
            return complaint;
        }
        return null;
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
