package bd.ac.uiu.smartcampus.syllabus.networking;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * AOOP Syllabus Requirement: Socket Programming - Server (ServerSocket & Socket)
 * Listens for incoming TCP socket connections from campus bus driver telemetry clients.
 */
@Service
public class BusServerSocketManager {

    private static final Logger logger = LoggerFactory.getLogger(BusServerSocketManager.class);
    private static final int BUS_SOCKET_PORT = 9090;

    private ServerSocket serverSocket;
    private volatile boolean running = true;
    private final ConcurrentMap<String, String> latestBusLocations = new ConcurrentHashMap<>();

    @PostConstruct
    public void startBusServer() {
        // Pre-populate some baseline bus positions
        latestBusLocations.put("BUS-01", "Natun Bazar -> UIU (Near 100 Feet Bridge)");
        latestBusLocations.put("BUS-02", "Kuril Flyover -> UIU (Approaching Campus Gate)");
        latestBusLocations.put("BUS-03", "Badda -> UIU (Departed Natun Bazar)");

        // Start ServerSocket listener in a daemon thread so it doesn't block Spring Boot startup
        Thread serverThread = new Thread(this::listenForBusClients, "Bus-ServerSocket-Listener");
        serverThread.setDaemon(true);
        serverThread.start();
    }

    private void listenForBusClients() {
        try {
            serverSocket = new ServerSocket(BUS_SOCKET_PORT);
            logger.info("AOOP Bus Telemetry ServerSocket listening on TCP port {}", BUS_SOCKET_PORT);

            while (running && !serverSocket.isClosed()) {
                try {
                    Socket clientSocket = serverSocket.accept();
                    // Handle each connected bus in a separate thread
                    new Thread(() -> handleBusClient(clientSocket), "BusClientHandler-" + clientSocket.getPort()).start();
                } catch (Exception e) {
                    if (!running) break;
                    logger.debug("Bus ServerSocket accept interrupted: {}", e.getMessage());
                }
            }
        } catch (Exception e) {
            logger.warn("Could not bind Bus ServerSocket to port {}: {}. (Will use in-memory simulation)", BUS_SOCKET_PORT, e.getMessage());
        }
    }

    private void handleBusClient(Socket socket) {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(socket.getInputStream()));
             PrintWriter writer = new PrintWriter(socket.getOutputStream(), true)) {

            String line;
            while ((line = reader.readLine()) != null) {
                // Protocol: "BUS_ID:LOCATION_STRING" e.g., "BUS-01:Near UIU Main Gate"
                if (line.contains(":")) {
                    String[] parts = line.split(":", 2);
                    latestBusLocations.put(parts[0].trim(), parts[1].trim());
                    writer.println("ACK: Location updated for " + parts[0]);
                } else if ("PING".equalsIgnoreCase(line.trim())) {
                    writer.println("PONG");
                }
            }
        } catch (Exception e) {
            logger.debug("Bus client disconnected: {}", e.getMessage());
        } finally {
            try {
                socket.close();
            } catch (Exception ignored) {}
        }
    }

    public ConcurrentMap<String, String> getLatestBusLocations() {
        return latestBusLocations;
    }

    public int getBusSocketPort() {
        return BUS_SOCKET_PORT;
    }

    @PreDestroy
    public void stopServer() {
        running = false;
        if (serverSocket != null && !serverSocket.isClosed()) {
            try {
                serverSocket.close();
            } catch (Exception ignored) {}
        }
    }
}
