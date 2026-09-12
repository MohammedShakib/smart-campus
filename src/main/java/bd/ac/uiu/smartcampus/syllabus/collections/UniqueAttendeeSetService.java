package bd.ac.uiu.smartcampus.syllabus.collections;

import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

/**
 * AOOP Syllabus Requirement: Set (Unique elements, no duplicates)
 * Used to track unique student check-ins at campus gates, seminars, and classroom sessions.
 */
@Service
public class UniqueAttendeeSetService {

    private final Set<String> checkedInStudentIds = new HashSet<>();

    /**
     * Check in student identifier into the unique Set
     * @return true if first time check-in (added to set), false if duplicate
     */
    public synchronized boolean checkInStudent(String studentId) {
        return checkedInStudentIds.add(studentId.trim().toUpperCase());
    }

    public synchronized boolean isAlreadyCheckedIn(String studentId) {
        return checkedInStudentIds.contains(studentId.trim().toUpperCase());
    }

    public synchronized int getUniqueCount() {
        return checkedInStudentIds.size();
    }

    public synchronized Set<String> getAllUniqueAttendees() {
        return Collections.unmodifiableSet(new HashSet<>(checkedInStudentIds));
    }

    public synchronized void resetAttendance() {
        checkedInStudentIds.clear();
    }
}
