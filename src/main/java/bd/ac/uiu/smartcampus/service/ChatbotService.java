package bd.ac.uiu.smartcampus.service;

import bd.ac.uiu.smartcampus.dto.ChatRequest;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class ChatbotService {

    private static final Logger log = LoggerFactory.getLogger(ChatbotService.class);

    private static final int MAX_HISTORY_TURNS = 20;
    private static final int MAX_HISTORY_TEXT_LENGTH = 2000;

    private static final String SYSTEM_PROMPT = """
            You are CampusAI, the Smart Campus virtual assistant for UIU (United International University).

            Your responsibilities:
            - Answer questions about campus facilities, departments, and common campus services.
            - Help students, teachers, staff, and security users understand Smart Campus portal features.
            - Be friendly, concise, and helpful. Use markdown formatting when it improves readability.
            - If you do not know something specific, say so honestly and suggest who on campus might help.
            - Keep responses focused and campus-relevant, while still helping with general academic questions.
            - Do not make up live data such as schedules, attendance, bus location, cafeteria items, visitor status, room numbers, or phone numbers unless the user provides it in the conversation.

            You are embedded inside the Smart Campus dashboard. The user is already authenticated.
            """;

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.api.base-url:https://generativelanguage.googleapis.com/v1beta/models}")
    private String apiBaseUrl;

    @Value("${gemini.model:gemini-3.6-flash}")
    private String model;

    public ChatbotService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .build();
    }

    public String chat(String userMessage, List<ChatRequest.ChatTurn> history) {
        if (apiKey == null || apiKey.isBlank()) {
            return "CampusAI is not configured. Please set GEMINI_API_KEY before using the assistant.";
        }

        try {
            boolean openAiCompatibleGateway = isOpenAiCompatibleGateway();
            String requestBody = openAiCompatibleGateway
                    ? buildOpenAiRequestBody(userMessage, history)
                    : buildGeminiRequestBody(userMessage, history);

            HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                    .uri(openAiCompatibleGateway ? buildOpenAiChatCompletionsUri() : buildGeminiUri())
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .timeout(Duration.ofSeconds(30))
                    ;

            if (openAiCompatibleGateway) {
                requestBuilder.header("Authorization", "Bearer " + apiKey.trim());
            }

            HttpRequest request = requestBuilder.build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.warn("Gemini API returned non-success status {}", response.statusCode());
                return "CampusAI could not reach the AI service. Please try again.";
            }

            return openAiCompatibleGateway
                    ? extractOpenAiReply(response.body())
                    : extractGeminiReply(response.body());
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            log.warn("CampusAI request was interrupted");
            return "CampusAI was interrupted while generating a reply. Please try again.";
        } catch (Exception exception) {
            log.warn("CampusAI request failed: {}", exception.getMessage());
            return "CampusAI encountered an error. Please try again in a moment.";
        }
    }

    private boolean isOpenAiCompatibleGateway() {
        String normalizedBaseUrl = normalizeBaseUrl();
        return apiKey.trim().startsWith("sk-") || normalizedBaseUrl.endsWith("/v1");
    }

    private URI buildOpenAiChatCompletionsUri() {
        return URI.create(normalizeBaseUrl() + "/chat/completions");
    }

    private URI buildGeminiUri() {
        String encodedKey = URLEncoder.encode(apiKey.trim(), StandardCharsets.UTF_8);
        String normalizedBaseUrl = normalizeBaseUrl();
        return URI.create(normalizedBaseUrl + "/" + model + ":generateContent?key=" + encodedKey);
    }

    private String normalizeBaseUrl() {
        String trimmed = apiBaseUrl == null ? "" : apiBaseUrl.trim();
        return trimmed.endsWith("/") ? trimmed.substring(0, trimmed.length() - 1) : trimmed;
    }

    private String buildGeminiRequestBody(String userMessage, List<ChatRequest.ChatTurn> history) throws JsonProcessingException {
        List<Map<String, Object>> contents = new ArrayList<>();
        for (ChatRequest.ChatTurn turn : normalizeGeminiHistory(history)) {
            contents.add(content(turn.getRole(), turn.getText()));
        }
        contents.add(content("user", userMessage));

        Map<String, Object> payload = Map.of(
                "systemInstruction", Map.of("parts", List.of(Map.of("text", SYSTEM_PROMPT))),
                "contents", contents,
                "generationConfig", Map.of(
                        "temperature", 0.4,
                        "maxOutputTokens", 1024
                )
        );
        return objectMapper.writeValueAsString(payload);
    }

    private String buildOpenAiRequestBody(String userMessage, List<ChatRequest.ChatTurn> history) throws JsonProcessingException {
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", SYSTEM_PROMPT));

        for (ChatRequest.ChatTurn turn : normalizeOpenAiHistory(history)) {
            messages.add(Map.of("role", turn.getRole(), "content", turn.getText()));
        }

        messages.add(Map.of("role", "user", "content", userMessage));

        Map<String, Object> payload = Map.of(
                "model", model,
                "messages", messages,
                "temperature", 0.4,
                "max_tokens", 1024
        );
        return objectMapper.writeValueAsString(payload);
    }

    private List<ChatRequest.ChatTurn> normalizeGeminiHistory(List<ChatRequest.ChatTurn> history) {
        return normalizeHistory(history, true);
    }

    private List<ChatRequest.ChatTurn> normalizeOpenAiHistory(List<ChatRequest.ChatTurn> history) {
        return normalizeHistory(history, false);
    }

    private List<ChatRequest.ChatTurn> normalizeHistory(List<ChatRequest.ChatTurn> history, boolean geminiRoles) {
        if (history == null || history.isEmpty()) {
            return List.of();
        }

        int fromIndex = Math.max(0, history.size() - MAX_HISTORY_TURNS);
        List<ChatRequest.ChatTurn> normalized = new ArrayList<>();
        for (ChatRequest.ChatTurn turn : history.subList(fromIndex, history.size())) {
            if (turn == null || turn.getText() == null || turn.getText().isBlank()) {
                continue;
            }

            ChatRequest.ChatTurn normalizedTurn = new ChatRequest.ChatTurn();
            normalizedTurn.setRole(geminiRoles ? toGeminiRole(turn.getRole()) : toOpenAiRole(turn.getRole()));
            normalizedTurn.setText(trimToLimit(turn.getText().trim(), MAX_HISTORY_TEXT_LENGTH));
            normalized.add(normalizedTurn);
        }
        return normalized;
    }

    private Map<String, Object> content(String role, String text) {
        return Map.of(
                "role", role,
                "parts", List.of(Map.of("text", text))
        );
    }

    private String toGeminiRole(String role) {
        if ("user".equalsIgnoreCase(role)) {
            return "user";
        }
        return "model";
    }

    private String toOpenAiRole(String role) {
        if ("user".equalsIgnoreCase(role)) {
            return "user";
        }
        return "assistant";
    }

    private String trimToLimit(String text, int limit) {
        return text.length() <= limit ? text : text.substring(0, limit);
    }

    private String extractGeminiReply(String responseJson) throws JsonProcessingException {
        JsonNode root = objectMapper.readTree(responseJson);
        JsonNode parts = root.path("candidates").path(0).path("content").path("parts");
        if (!parts.isArray() || parts.isEmpty()) {
            log.warn("Gemini response did not contain candidate content");
            return "CampusAI received an unexpected response. Please try again.";
        }

        StringBuilder reply = new StringBuilder();
        for (JsonNode part : parts) {
            String text = part.path("text").asText("");
            if (!text.isBlank()) {
                if (!reply.isEmpty()) {
                    reply.append("\n");
                }
                reply.append(text.trim());
            }
        }

        String result = reply.toString().trim();
        return result.isEmpty()
                ? "CampusAI did not generate a response. Please try again."
                : result;
    }

    private String extractOpenAiReply(String responseJson) throws JsonProcessingException {
        JsonNode root = objectMapper.readTree(responseJson);
        String reply = root.path("choices").path(0).path("message").path("content").asText("").trim();
        if (reply.isBlank()) {
            log.warn("OpenAI-compatible Gemini response did not contain message content");
            return "CampusAI received an unexpected response. Please try again.";
        }
        return reply;
    }
}
