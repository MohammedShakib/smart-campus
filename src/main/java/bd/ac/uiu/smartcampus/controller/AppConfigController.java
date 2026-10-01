package bd.ac.uiu.smartcampus.controller;

import bd.ac.uiu.smartcampus.dto.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.Inet4Address;
import java.net.NetworkInterface;
import java.util.Enumeration;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/app")
public class AppConfigController {

    @Value("${smart-campus.attendance-base-url:}")
    private String attendanceBaseUrl;

    @Value("${server.port:8085}")
    private int serverPort;

    @GetMapping("/config")
    public ApiResponse<Map<String, Object>> getConfig(HttpServletRequest request) {
        Map<String, Object> config = new LinkedHashMap<>();
        config.put("attendanceBaseUrl", resolveAttendanceBaseUrl(request));
        return ApiResponse.ok("Application config", config);
    }

    private String resolveAttendanceBaseUrl(HttpServletRequest request) {
        if (attendanceBaseUrl != null && !attendanceBaseUrl.isBlank()) {
            return stripTrailingSlash(attendanceBaseUrl);
        }

        String host = request.getServerName();
        if (host != null && !isLoopbackHost(host)) {
            return request.getScheme() + "://" + host + ":" + request.getServerPort();
        }

        String lanIp = findLanIpv4();
        if (lanIp != null) {
            return request.getScheme() + "://" + lanIp + ":" + serverPort;
        }

        return request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort();
    }

    private boolean isLoopbackHost(String host) {
        String normalized = host.toLowerCase();
        return normalized.equals("localhost")
                || normalized.equals("127.0.0.1")
                || normalized.equals("0:0:0:0:0:0:0:1")
                || normalized.equals("::1");
    }

    private String findLanIpv4() {
        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            while (interfaces.hasMoreElements()) {
                NetworkInterface networkInterface = interfaces.nextElement();
                if (!networkInterface.isUp() || networkInterface.isLoopback() || networkInterface.isVirtual()) {
                    continue;
                }
                Enumeration<java.net.InetAddress> addresses = networkInterface.getInetAddresses();
                while (addresses.hasMoreElements()) {
                    java.net.InetAddress address = addresses.nextElement();
                    if (address instanceof Inet4Address && !address.isLoopbackAddress()) {
                        return address.getHostAddress();
                    }
                }
            }
        } catch (Exception ignored) {
            // Best-effort local development convenience.
        }
        return null;
    }

    private String stripTrailingSlash(String value) {
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
