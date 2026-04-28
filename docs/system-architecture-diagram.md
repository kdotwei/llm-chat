# LLM Chatroom v2: System Architecture Diagram

```mermaid
flowchart TD
    U["User"] --> UI["React UI: ChatInput, MessageList, SettingsPanel"]
    UI --> ORCH["Client Orchestrator: App.tsx"]

    ORCH --> ROUTER["Auto Router: general, vision, reasoning"]
    ORCH --> MEM["Long-Term Memory: localStorage plus retrieval"]
    ORCH --> TOOL["Tool Executor: OpenAI tool_calls loop"]

    MEM --> STORE["Browser Storage: settings, API key, memories"]

    TOOL --> MCP1["MCP-style Utilities Server: time, calculator"]
    TOOL --> MCP2["MCP-style Memory Server: memory_search"]
    TOOL --> MCP3["MCP-style Browser Server: search_web, open_url"]

    ROUTER --> API["OpenAI-compatible API: /v1/chat/completions"]

    UI --> IMG["Image Uploads"]
    IMG --> ORCH
    ORCH --> API

    API --> ORCH
    ORCH --> UI
```

## Component Summary

- `React UI`: receives user text, image uploads, and settings changes
- `Client Orchestrator`: coordinates routing, payload building, streaming, tool loops, and UI state
- `Auto Router`: selects the general, vision, or reasoning model based on the turn
- `Long-Term Memory`: stores and retrieves user facts from browser storage
- `Tool Executor`: handles OpenAI-style function calls and returns tool outputs back to the model
- `MCP-style Servers`: modular groups of local tools for utility, memory, and browser tasks
- `OpenAI-compatible API`: performs generation for both text-only and multimodal requests

## Request Flow

1. User enters text or attaches an image.
2. The client router selects the best model.
3. Relevant long-term memories are retrieved.
4. The request is sent to the chat-completions API.
5. If the model requests tools, the tool executor runs them locally and continues the loop.
6. The final answer is rendered in the chat interface, and new durable memories may be stored.
