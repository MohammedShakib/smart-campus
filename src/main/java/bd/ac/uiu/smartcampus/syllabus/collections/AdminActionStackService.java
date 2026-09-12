package bd.ac.uiu.smartcampus.syllabus.collections;

import bd.ac.uiu.smartcampus.model.AdminActionLog;
import bd.ac.uiu.smartcampus.repository.AdminActionLogRepository;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.List;
import java.util.Stack;

/**
 * AOOP Syllabus Requirement: Stack (LIFO - Last-In, First-Out)
 * Used to track administrative actions and support last-action history and undo operations.
 */
@Service
public class AdminActionStackService {

    private final Stack<AdminActionLog> actionStack = new Stack<>();
    private final AdminActionLogRepository repository;

    public AdminActionStackService(AdminActionLogRepository repository) {
        this.repository = repository;
    }

    @PostConstruct
    public void initStackFromDatabase() {
        List<AdminActionLog> recentLogs = repository.findTop20ByOrderByTimestampDesc();
        // Push in reverse order so latest is on top
        for (int i = recentLogs.size() - 1; i >= 0; i--) {
            actionStack.push(recentLogs.get(i));
        }
    }

    /**
     * Push a new administrative action onto the LIFO stack
     */
    public synchronized AdminActionLog recordAction(String adminEmail, String actionType, String actionDetails) {
        AdminActionLog log = new AdminActionLog(adminEmail, actionType, actionDetails);
        AdminActionLog saved = repository.save(log);
        actionStack.push(saved);
        return saved;
    }

    /**
     * Peek at the most recent action on top of the stack
     */
    public synchronized AdminActionLog peekLatestAction() {
        return actionStack.isEmpty() ? null : actionStack.peek();
    }

    /**
     * Pop the most recent action (undo operation)
     */
    public synchronized AdminActionLog undoLastAction() {
        if (!actionStack.isEmpty()) {
            AdminActionLog popped = actionStack.pop();
            repository.delete(popped);
            return popped;
        }
        return null;
    }

    /**
     * Get recent stack items as a list for display
     */
    public synchronized List<AdminActionLog> getRecentStackHistory() {
        List<AdminActionLog> list = new ArrayList<>();
        // Iterate from top of stack down
        for (int i = actionStack.size() - 1; i >= 0; i--) {
            list.add(actionStack.get(i));
        }
        return list;
    }

    public synchronized int getStackSize() {
        return actionStack.size();
    }
}
