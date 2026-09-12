package bd.ac.uiu.smartcampus.syllabus.collections;

import bd.ac.uiu.smartcampus.model.MaintenanceComplaint;
import bd.ac.uiu.smartcampus.repository.MaintenanceComplaintRepository;
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

    public ComplaintQueueService(MaintenanceComplaintRepository repository) {
        this.repository = repository;
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
