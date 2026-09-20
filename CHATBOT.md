# CampusAI Chatbot

CampusAI is a floating chatbot widget available inside the authenticated Smart Campus dashboards. It lets Admin, Teacher, Student, and Security users ask general campus and portal questions from the dashboard UI.

## User Flow

1. A user logs in and opens any dashboard role page.
2. `DashboardPage.jsx` renders `ChatbotWidget`.
3. The floating CampusAI button opens a chat panel.
4. The user sends a message with the send button or Enter.
5. The frontend posts to `POST /api/chatbot`.
6. The Spring backend forwards the prompt and recent conversation history to Gemini.
7. The backend returns an `ApiResponse` containing `{ "reply": "..." }`.
8. The widget displays the assistant response in the chat.

## Frontend

Source files:

- `frontend/src/components/shared/ChatbotWidget.jsx`
- `frontend/src/styles/chatbot.css`

The widget supports:

- floating open/close button
- CampusAI branded panel
- user and assistant message bubbles
- quick prompts
- Enter-to-send
- loading indicator
- simple markdown-style rendering for assistant replies
- lightweight in-memory conversation history

Request shape:

```json
{
  "message": "How do I submit a maintenance ticket?",
  "history": [
    {
      "role": "user",
      "text": "My name is Tanvir for this conversation."
    },
    {
      "role": "assistant",
      "text": "Got it."
    }
  ]
}
```

## Backend

Source files:

- `src/main/java/bd/ac/uiu/smartcampus/dto/ChatRequest.java`
- `src/main/java/bd/ac/uiu/smartcampus/controller/ChatbotController.java`
- `src/main/java/bd/ac/uiu/smartcampus/service/ChatbotService.java`

Endpoint:

```http
POST /api/chatbot
```

Successful response shape:

```json
{
  "success": true,
  "message": "Reply generated.",
  "data": {
    "reply": "CampusAI response text"
  }
}
```

Validation:

- message is required
- blank messages return `400`
- overly long messages return `400`
- history is capped server-side before sending to Gemini

## Security

`SecurityConfig` protects `/api/chatbot` with `authenticated()`.

Authenticated users in these roles can use CampusAI:

- Admin
- Teacher
- Student
- Security

Unauthenticated API requests return the existing JSON session error.

## Gemini Configuration

No API key is stored in source code.

Configuration is environment-based:

```properties
gemini.api.key=${GEMINI_API_KEY:}
gemini.model=${GEMINI_MODEL:gemini-3.6-flash}
gemini.api.base-url=${GEMINI_API_BASE_URL:https://generativelanguage.googleapis.com/v1beta/models}
```

If `GEMINI_API_KEY` is missing, the app still starts normally and chatbot requests return:

```text
CampusAI is not configured. Please set GEMINI_API_KEY before using the assistant.
```

## Limitations

CampusAI is currently a general campus assistant. It does not have live access to student schedules, attendance, bus locations, cafeteria menus, visitor status, or event status unless those details are supplied in the conversation.
