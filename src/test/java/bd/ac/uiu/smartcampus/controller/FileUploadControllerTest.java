package bd.ac.uiu.smartcampus.controller;

import bd.ac.uiu.smartcampus.dto.ApiResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class FileUploadControllerTest {

    private final FileUploadController controller = new FileUploadController();
    private final List<Path> createdFiles = new ArrayList<>();

    @AfterEach
    void cleanup() throws Exception {
        for (Path path : createdFiles) {
            Files.deleteIfExists(path);
        }
    }

    @Test
    void acceptsValidPngWithSafeUuidFilename() {
        byte[] png = new byte[] {
                (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
                0x00, 0x00, 0x00, 0x00
        };
        MockMultipartFile file = new MockMultipartFile("file", "../avatar.PNG", "image/png", png);

        ResponseEntity<ApiResponse<String>> response = controller.uploadFile(file);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        String url = response.getBody().getData();
        assertThat(url).startsWith("/uploads/");
        assertThat(url).endsWith(".png");
        assertThat(url).doesNotContain("..");
        assertThat(url.substring("/uploads/".length())).matches("[a-f0-9]{32}\\.png");

        Path stored = Path.of("uploads", url.substring("/uploads/".length()));
        createdFiles.add(stored);
        assertThat(Files.exists(stored)).isTrue();
    }

    @Test
    void rejectsExecutableExtension() {
        MockMultipartFile file = new MockMultipartFile("file", "malware.exe",
                "application/x-msdownload", new byte[] {0x4D, 0x5A});

        ResponseEntity<ApiResponse<String>> response = controller.uploadFile(file);

        assertThat(response.getStatusCode().is4xxClientError()).isTrue();
        assertThat(response.getBody().getMessage()).isEqualTo("Unsupported file type.");
    }

    @Test
    void rejectsContentThatDoesNotMatchExtensionAndMime() {
        MockMultipartFile file = new MockMultipartFile("file", "fake.jpg",
                "image/jpeg", new byte[] {0x25, 0x50, 0x44, 0x46});

        ResponseEntity<ApiResponse<String>> response = controller.uploadFile(file);

        assertThat(response.getStatusCode().is4xxClientError()).isTrue();
        assertThat(response.getBody().getMessage()).isEqualTo("Uploaded file content does not match its type.");
    }
}
