# LLM Chatroom

A ChatGPT-like single-page chat interface built with React, TypeScript, and Tailwind CSS. Connects to any OpenAI-compatible API endpoint (e.g. llama.cpp server) with real-time streaming responses.

## Features

- **Streaming responses** — Server-Sent Events (SSE) with typewriter effect
- **Markdown rendering** — Full GFM support with syntax-highlighted code blocks
- **User-provided API key** — Stored in `localStorage` only; never bundled into the build
- **Model selector** — Auto-fetches available models from `/v1/models`; falls back to manual text input
- **Customizable system prompt** — Edit at any time via the Settings panel
- **API parameter controls** — Temperature, Top-P, Max Tokens, all adjustable in real time
- **Memory window** — Limit context to the last N conversation turns to manage token usage
- **OpenAI-compatible** — Works with llama.cpp, Ollama, OpenAI, or any `/v1/chat/completions` endpoint
- **Keyboard shortcuts** — `Enter` to send, `Shift+Enter` for newline
- **Auto-resize textarea** — Input area grows with content
- **Persistent settings** — All settings survive page refresh via `localStorage`

## Tech Stack

- [Vite](https://vitejs.dev/) + [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v3](https://tailwindcss.com/)
- [react-markdown](https://github.com/remarkjs/react-markdown) + [remark-gfm](https://github.com/remarkjs/remark-gfm)
- [react-syntax-highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter) (Prism / One Dark theme)
- Native `fetch` API with `ReadableStream` for SSE parsing

## Getting Started

### Prerequisites

- Node.js ≥ 18
- An OpenAI-compatible API server (e.g. [llama.cpp server](https://github.com/ggml-org/llama.cpp))

### Installation

```bash
git clone https://github.com/kdotwei/llm-chat.git
cd llm-chat
npm install
```

### Configuration

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
VITE_API_URL=https://your-llama-server/v1/chat/completions
VITE_API_MODEL=qwen35-4b
```

| Variable | Description |
|---|---|
| `VITE_API_URL` | Full URL to the `/v1/chat/completions` endpoint |
| `VITE_API_MODEL` | Default model ID (overridable from the Settings panel at runtime) |

> **Note:** These variables are embedded in the client bundle at build time. Do **not** put secret API keys here — use the in-app key modal instead (see below).

### Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
npm run preview
```

## API Key

On first launch, a modal will prompt you to enter your API key. The key is:

- Stored in **`localStorage`** in your browser only
- Sent as `Authorization: Bearer <key>` on every request
- Never committed to the repository or included in the build output

You can update the key at any time via the **key icon** (🔑) in the top-right corner of the header.

## Settings Panel

Click the **gear icon** (⚙️) in the header to open the Settings side panel.

| Setting | Description |
|---|---|
| **Model** | Dropdown populated from `/v1/models`; falls back to a free-text field if the endpoint is unavailable |
| **System Prompt** | The system-role message prepended to every request |
| **Temperature** | Slider from 0 (deterministic) to 2 (creative); default `0.7` |
| **Top-P** | Nucleus sampling threshold; slider from 0 to 1; default `0.95` |
| **Max Tokens** | Maximum tokens to generate; `-1` = server default (no explicit limit) |
| **Memory Window** | Number of recent conversation turns to include as context; `0` = full history |

All settings are persisted to `localStorage` and restored on next visit.

## Project Structure

```
src/
├── App.tsx          # Main component — UI, streaming logic, settings
├── index.css        # Tailwind directives
├── main.tsx         # React entry point
└── vite-env.d.ts    # Vite env variable type declarations
```
