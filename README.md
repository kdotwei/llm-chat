# LLM Chatroom

A ChatGPT-like single-page chat interface built with React, TypeScript, and Tailwind CSS. Connects to any OpenAI-compatible API endpoint (e.g. llama.cpp server) with real-time streaming responses.

## Features

- **Streaming responses** — Server-Sent Events (SSE) with typewriter effect
- **User-provided API key** — Key is stored in `localStorage` only; never bundled into the build
- **OpenAI-compatible** — Works with llama.cpp, Ollama, OpenAI, or any `/v1/chat/completions` endpoint
- **Full conversation history** — Every message is sent as context on each request
- **Keyboard shortcuts** — `Enter` to send, `Shift+Enter` for newline
- **Auto-resize textarea** — Input area grows with content

## Tech Stack

- [Vite](https://vitejs.dev/) + [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v3](https://tailwindcss.com/)
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
| `VITE_API_MODEL` | Model ID to pass in the request body |

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

You can update the key at any time via the key icon (🔑) in the top-right corner of the header.

## Project Structure

```
src/
├── App.tsx          # Main component (UI + streaming logic)
├── index.css        # Tailwind directives
├── main.tsx         # React entry point
└── vite-env.d.ts    # Vite env variable type declarations
```
