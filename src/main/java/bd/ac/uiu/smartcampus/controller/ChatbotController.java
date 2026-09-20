package bd.ac.uiu.smartcampus.controller;

import bd.ac.uiu.smartcampus.dto.ApiResponse;
import bd.ac.uiu.smartcampus.dto.ChatRequest;
import bd.ac.uiu.smartcampus.security.CustomUserDetails;
import bd.ac.uiu.smartcampus.service.ChatbotContextService;
import bd.ac.uiu.smartcampus.service.ChatbotService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/chatbot")
public class ChatbotController {

    private static final int MAX_MESSAGE_LENGTH = 4000;

    private final ChatbotService chatbotService;
    private final ChatbotContextService chatbotContextService;

    public ChatbotController(ChatbotService chatbotService, ChatbotContextService chatbotContextService) {
        this.chatbotService = chatbotService;
        this.chatbotContextService = chatbotContextService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, String>>> chat(@RequestBody ChatRequest request,
                                                                 @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (request == null || request.getMessage() == null || request.getMessage().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Message cannot be empty."));
        }

        String message = request.getMessage().trim();
        if (message.length() > MAX_MESSAGE_LENGTH) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Message is too long."));
        }

        String liveContext = chatbotContextService.buildContext(userDetails);
        String reply = chatbotService.chat(message, request.getHistory(), liveContext);
        return ResponseEntity.ok(ApiResponse.ok("Reply generated.", Map.of("reply", reply)));
    }
}
