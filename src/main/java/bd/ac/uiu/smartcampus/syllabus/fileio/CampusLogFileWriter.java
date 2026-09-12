package bd.ac.uiu.smartcampus.syllabus.fileio;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * AOOP Syllabus Requirement: Text File I/O (FileWriter / FileReader)
 * Demonstrates persistent logging and retrieval of campus telemetry and audit events.
 */
@Service
public class CampusLogFileWriter {

    private static final Logger logger = LoggerFactory.getLogger(CampusLogFileWriter.class);
    private static final String LOG_FILE_PATH = "campus_activity_audit.log";

    /**
     * Write an audit log entry to the disk using FileWriter
     */
    public synchronized void appendAuditLog(String category, String message) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        String entry = String.format("[%s] [%s] %s%n", timestamp, category, message);

        try (FileWriter writer = new FileWriter(LOG_FILE_PATH, true)) {
            writer.write(entry);
            writer.flush();
        } catch (IOException e) {
            logger.error("Failed to write to audit log file: {}", e.getMessage());
        }
    }

    /**
     * Read the last N log entries using FileReader and BufferedReader
     */
    public synchronized List<String> readRecentAuditLogs(int maxLines) {
        List<String> lines = new ArrayList<>();
        File file = new File(LOG_FILE_PATH);
        if (!file.exists()) {
            return lines;
        }

        try (FileReader fr = new FileReader(file);
             BufferedReader reader = new BufferedReader(fr)) {
            String line;
            while ((line = reader.readLine()) != null) {
                lines.add(line);
            }
        } catch (IOException e) {
            logger.error("Failed to read audit log file: {}", e.getMessage());
        }

        if (lines.size() > maxLines) {
            return lines.subList(lines.size() - maxLines, lines.size());
        }
        return lines;
    }
}
