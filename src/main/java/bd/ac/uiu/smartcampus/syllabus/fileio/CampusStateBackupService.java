package bd.ac.uiu.smartcampus.syllabus.fileio;

import bd.ac.uiu.smartcampus.model.CampusState;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.*;

/**
 * AOOP Syllabus Requirement: Object Serialization (ObjectOutputStream / ObjectInputStream)
 * Demonstrates saving and restoring complete in-memory Smart Campus state to binary disk backup.
 */
@Service
public class CampusStateBackupService {

    private static final Logger logger = LoggerFactory.getLogger(CampusStateBackupService.class);
    private static final String BACKUP_FILE = "campus_state_snapshot.dat";

    /**
     * Serializes CampusState object to disk using ObjectOutputStream
     */
    public synchronized boolean backupCampusState(CampusState state) {
        try (FileOutputStream fos = new FileOutputStream(BACKUP_FILE);
             ObjectOutputStream oos = new ObjectOutputStream(fos)) {
            oos.writeObject(state);
            oos.flush();
            logger.info("Successfully serialized campus state backup to {}", BACKUP_FILE);
            return true;
        } catch (IOException e) {
            logger.error("Failed to backup campus state: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Deserializes CampusState object from disk using ObjectInputStream
     */
    public synchronized CampusState restoreCampusState() {
        File file = new File(BACKUP_FILE);
        if (!file.exists()) {
            logger.warn("No existing campus state backup found at {}", BACKUP_FILE);
            return null;
        }

        try (FileInputStream fis = new FileInputStream(file);
             ObjectInputStream ois = new ObjectInputStream(fis)) {
            CampusState state = (CampusState) ois.readObject();
            logger.info("Successfully restored campus state: {}", state);
            return state;
        } catch (IOException | ClassNotFoundException e) {
            logger.error("Failed to restore campus state: {}", e.getMessage());
            return null;
        }
    }
}
