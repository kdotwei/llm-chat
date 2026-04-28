# LLM Chatroom v2

Homework 02 upgrade of the original chat client from homework 01. This version keeps the same React + TypeScript single-page structure, but adds a more agent-like interaction layer on top of an OpenAI-compatible chat endpoint.

## What's New in v2

- Long-term memory stored in `localStorage` with retrieval-augmented prompt injection
- Multimodal chat with image upload and vision-model routing
- Automatic model routing between general, vision, and reasoning models
- Tool use through OpenAI-style function calling
- MCP-style local server registry for utilities, browser handoff, and memory search
- Visible routed-model badges and tool execution logs in the chat UI

## Core Features

- Streaming text chat for normal single-model turns
- Structured non-streaming workflow for image/tool turns
- Markdown rendering with syntax-highlighted code blocks
- API key modal with browser-only storage
- Adjustable system prompt, temperature, top-p, max tokens, and history window
- Theme toggle and persistent settings

## Tech Stack

- Vite + React 19 + TypeScript
- Tailwind CSS
- `react-markdown` + `remark-gfm`
- `react-syntax-highlighter`
- Native `fetch` for SSE and JSON chat-completions requests

## Environment

Copy `.env.example` to `.env` and fill in the model IDs that match your provider.

```env
VITE_API_URL=https://your-server/v1/chat/completions
VITE_API_MODEL=qwen35-397b
VITE_API_VISION_MODEL=qwen-vl-max
VITE_API_REASONING_MODEL=deepseek-r1
```

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
```

## Architecture Notes

- The app still talks directly to an OpenAI-compatible `/v1/chat/completions` endpoint.
- Auto routing happens in the browser before each request.
- Long-term memory is lightweight and local-first: extracted user facts are stored in `localStorage`, then retrieved by keyword overlap.
- Tool use uses OpenAI-style `tools` / `tool_calls` with browser-local executors.
- The included MCP portion is an educational, client-side MCP-style registry rather than a full remote MCP transport layer.

## Deliverables

- One-page introduction: [docs/system-introduction.md](docs/system-introduction.md)
- Architecture diagram: [docs/system-architecture-diagram.md](docs/system-architecture-diagram.md)

## Project Structure

```text
src/
├── App.tsx
├── components/
├── hooks/
├── lib/
├── constants.ts
└── types.ts
```
