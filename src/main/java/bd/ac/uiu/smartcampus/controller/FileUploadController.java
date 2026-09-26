package bd.ac.uiu.smartcampus.controller;

import bd.ac.uiu.smartcampus.dto.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class FileUploadController {

    private static final Logger logger = LoggerFactory.getLogger(FileUploadController.class);
    private static final String UPLOAD_DIR = "uploads";
    private static final Map<String, Set<String>> ALLOWED_TYPES = Map.of(
            "jpg", Set.of("image/jpeg"),
            "jpeg", Set.of("image/jpeg"),
            "png", Set.of("image/png"),
            "webp", Set.of("image/webp"),
            "pdf", Set.of("application/pdf")
    );

    public FileUploadController() {
        // Ensure upload directory exists
        try {
            Path path = Paths.get(UPLOAD_DIR);
            if (!Files.exists(path)) {
                Files.createDirectories(path);
            }
        } catch (IOException e) {
            logger.error("Failed to create uploads directory", e);
        }
    }

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<String>> uploadFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Please select a file to upload."));
        }

        try {
            Path uploadPath = Paths.get(UPLOAD_DIR).toAbsolutePath().normalize();
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String extension = getAllowedExtension(file.getOriginalFilename());
            String contentType = file.getContentType() == null
                    ? ""
                    : file.getContentType().trim().toLowerCase(Locale.ROOT);
            if (!ALLOWED_TYPES.get(extension).contains(contentType)) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Unsupported file type."));
            }
            if (!hasExpectedSignature(file, extension)) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Uploaded file content does not match its type."));
            }

            String uniqueFilename = UUID.randomUUID().toString().replace("-", "") + "." + extension;
            Path targetLocation = uploadPath.resolve(uniqueFilename).normalize();
            if (!targetLocation.startsWith(uploadPath)) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Invalid upload path."));
            }

            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = "/uploads/" + uniqueFilename;
            logger.info("Uploaded file saved successfully to: {}", fileUrl);

            return ResponseEntity.ok(ApiResponse.ok("File uploaded successfully", fileUrl));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
        } catch (IOException ex) {
            logger.error("Could not upload file: ", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to store uploaded file."));
        }
    }

    private String getAllowedExtension(String originalFilename) {
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new IllegalArgumentException("Unsupported file type.");
        }
        String safeName = Paths.get(originalFilename).getFileName().toString();
        int dotIndex = safeName.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == safeName.length() - 1) {
            throw new IllegalArgumentException("Unsupported file type.");
        }
        String extension = safeName.substring(dotIndex + 1).toLowerCase(Locale.ROOT);
        if (!ALLOWED_TYPES.containsKey(extension)) {
            throw new IllegalArgumentException("Unsupported file type.");
        }
        return extension;
    }

    private boolean hasExpectedSignature(MultipartFile file, String extension) throws IOException {
        byte[] header = new byte[12];
        int read;
        try (InputStream inputStream = file.getInputStream()) {
            read = inputStream.read(header);
        }
        if (read < 0) {
            read = 0;
        }
        return switch (extension) {
            case "jpg", "jpeg" -> read >= 3
                    && (header[0] & 0xFF) == 0xFF
                    && (header[1] & 0xFF) == 0xD8
                    && (header[2] & 0xFF) == 0xFF;
            case "png" -> read >= 8
                    && (header[0] & 0xFF) == 0x89
                    && header[1] == 0x50
                    && header[2] == 0x4E
                    && header[3] == 0x47
                    && header[4] == 0x0D
                    && header[5] == 0x0A
                    && header[6] == 0x1A
                    && header[7] == 0x0A;
            case "webp" -> read >= 12
                    && header[0] == 0x52
                    && header[1] == 0x49
                    && header[2] == 0x46
                    && header[3] == 0x46
                    && header[8] == 0x57
                    && header[9] == 0x45
                    && header[10] == 0x42
                    && header[11] == 0x50;
            case "pdf" -> read >= 4
                    && header[0] == 0x25
                    && header[1] == 0x50
                    && header[2] == 0x44
                    && header[3] == 0x46;
            default -> false;
        };
    }
}
