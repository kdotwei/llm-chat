# LLM Chatroom v2: One-Page System Introduction

## Overview

LLM Chatroom v2 is an upgraded browser-based AI chat system built on top of the homework 01 single-page chat client. The original version focused on a clean OpenAI-compatible chat interface with streaming responses, settings management, and short-term conversation memory. Version 2 expands that baseline into a more capable agent-style system by adding long-term memory, multimodal interaction, automatic model routing, and tool use through an MCP-style registry.

## Design Goal

The main design goal of v2 is to keep the architecture lightweight enough to run as a frontend-only project while still demonstrating modern LLM system behaviors. Instead of introducing a heavyweight backend orchestration layer, the browser becomes the coordinator. It stores user settings, manages local memory, chooses the most suitable model for each turn, and executes safe local tools when the model issues function calls.

## Main Functions

### 1. Long-Term Memory

The system extracts durable user facts and preferences from conversation turns, such as identity, preferences, and explicitly remembered notes. These memories are stored in browser `localStorage`. Before sending a new request, the app retrieves the most relevant memory snippets using simple keyword overlap and injects them into the prompt as supplemental system context. This allows the assistant to preserve personalization beyond the short visible history window.

### 2. Multimodal Interaction

Users can attach image files directly in the chat input. The browser converts them into data URLs and includes them in OpenAI-compatible multimodal message payloads. If an image is detected, the system routes the request to the configured vision model automatically.

### 3. Auto Routing Between Models

Version 2 supports three model roles:

- General model for everyday chat
- Vision model for image understanding
- Reasoning model for analytical or coding-heavy prompts

The routing module applies lightweight heuristics before each request. This improves capability matching without requiring the user to manually switch models for every turn.

### 4. Tool Use and MCP-Style Registry

The system supports OpenAI-style function calling. When tool use is enabled, the selected model can request local tools such as:

- Current time lookup
- Arithmetic calculation
- Long-term memory search
- Browser URL handoff

These tools are grouped into local MCP-style servers so the system architecture reflects the idea of modular tool providers. In this project, MCP is implemented as a browser-local educational registry rather than a full remote transport implementation.

## Why This Version Is Useful

Compared with homework 01, v2 demonstrates a more complete LLM application stack:

- It remembers important user context over time
- It accepts both text and images
- It selects the right model automatically
- It performs actions through tools
- It exposes a modular system architecture that can be extended later

## Future Extension Ideas

- Replace heuristic memory extraction with model-generated summaries
- Add real backend-based vector retrieval
- Connect to full remote MCP servers
- Add audio input/output and document parsing
- Support conversation export and evaluation logging
