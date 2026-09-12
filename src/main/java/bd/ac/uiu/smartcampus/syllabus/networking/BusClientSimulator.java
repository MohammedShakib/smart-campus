package bd.ac.uiu.smartcampus.syllabus.networking;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.Socket;

/**
 * AOOP Syllabus Requirement: Socket Programming - Client (Socket)
 * Simulates a bus GPS beacon device connecting to the Campus ServerSocket over TCP.
 */
@Service
public class BusClientSimulator {

    private static final Logger logger = LoggerFactory.getLogger(BusClientSimulator.class);

    /**
     * Connects via Socket to localhost:port and transmits location update packet
     */
    public String sendBusLocationUpdate(String busId, String location) {
        try (Socket socket = new Socket("localhost", 9090);
             PrintWriter writer = new PrintWriter(socket.getOutputStream(), true);
             BufferedReader reader = new BufferedReader(new InputStreamReader(socket.getInputStream()))) {

            // Transmit packet
            String packet = busId + ":" + location;
            writer.println(packet);

            // Read response acknowledgement
            String response = reader.readLine();
            logger.info("Bus Socket Client sent: [{}], Server responded: [{}]", packet, response);
            return response != null ? response : "Packet sent";

        } catch (Exception e) {
            logger.debug("Bus Socket Client could not connect: {}", e.getMessage());
            return "Local simulation updated (Socket offline: " + e.getMessage() + ")";
        }
    }
}
