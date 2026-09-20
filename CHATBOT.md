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
- `src/main/java/bd/ac/uiu/smartcampus/service/ChatbotContextService.java`

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

## Live Campus Context

CampusAI now receives a live, read-only Smart Campus context before each AI request. This is not raw database access and it does not allow the model to run SQL or perform writes. The backend gathers a safe summary through existing repositories and services, then appends that summary to the model's system prompt.

The context includes:

- authenticated user name, email/login, role, department, and campus ID
- current campus telemetry and bus locations
- active emergency alerts
- relevant notices
- published events, cafeteria menu items, and lab equipment availability
- role-specific dashboard data

Role-specific data:

- Admin: user counts, complaint queue size, gate pass count, recent admin actions, queued complaints, admin notices
- Teacher: next class, schedule, class statuses, attendance sessions, room reservations, reported issues, teacher notices
- Student: class schedule, attendance summaries, absence excuses, equipment bookings, support tickets, lost-and-found items, student notices
- Security: visitor counts, parking occupancy, gate movement counts, parking zones, recent visitors, recent incidents, security notices

Safety rules:

- context is generated server-side after authentication
- users only receive the context appropriate for their role
- the model is instructed to say when data is not available in the current CampusAI context
- passwords, tokens, API keys, visitor pass codes, and national ID style fields are filtered from generated context
- CampusAI can answer from data, but it must not claim it created, updated, or deleted database records

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

For normal Gemini usage, only the API key is required. The app uses the native Gemini `generateContent` API by default:

```properties
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-3.6-flash
```

For local development, the app also imports a git-ignored `.env` file from the project root. If you are using an OpenAI-compatible demo gateway, add the optional base URL:

```properties
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-3.6-flash
GEMINI_API_BASE_URL=http://127.0.0.1:8081/v1
```

When `GEMINI_API_BASE_URL` points to an OpenAI-compatible `/v1` gateway, CampusAI uses `POST /chat/completions` with a bearer token. If no custom base URL is set, it uses the native Gemini `generateContent` API shape.

If `GEMINI_API_KEY` is missing, the app still starts normally and chatbot requests return:

```text
CampusAI is not configured. Please set GEMINI_API_KEY before using the assistant.
```

## Current Limitations

CampusAI can answer from the live context that the backend provides at request time. It still does not have unrestricted database access, SQL execution, file access, or write permissions. If a feature needs action-taking later, add a dedicated backend API/tool with authorization, validation, and audit logging instead of exposing direct database control to the model.
