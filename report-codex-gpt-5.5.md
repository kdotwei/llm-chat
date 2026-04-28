## [2026-04-28 14:22] Task Record

### 🎯 Task Description
- Upgrade the homework 01 chat project into v2.
- Add long-term memory, multimodal support, auto routing between models, tool use, MCP-related functionality, and other useful improvements.
- Prepare two submission materials: a one-page system introduction and a system architecture diagram.

### 🛠️ Actions Taken
- Modified files:
  - `.env.example`
  - `README.md`
  - `package.json`
  - `src/App.tsx`
  - `src/components/ChatInput.tsx`
  - `src/components/Header.tsx`
  - `src/components/MessageList.tsx`
  - `src/components/SettingsPanel.tsx`
  - `src/constants.ts`
  - `src/types.ts`
- Added files:
  - `docs/system-introduction.md`
  - `docs/system-architecture-diagram.md`
  - `src/lib/memory.ts`
  - `src/lib/mcpTools.ts`
  - `src/lib/router.ts`
  - `report-codex-gpt-5.5.md`
- New features implemented:
  - Browser-persistent long-term memory with retrieval
  - Image attachments and multimodal request payloads
  - Heuristic auto routing for general / vision / reasoning models
  - OpenAI-style tool calling loop
  - MCP-style local tool server registry
  - UI support for attachment previews, route badges, tool logs, and memory/tool settings
  - v2 docs and submission artifacts
- Terminal commands executed:
  - `pwd`
  - `rg --files`
  - `rg --files -g 'report-*.md' -g 'docs/reports/*.md'`
  - `ls -la`
  - `git status --short`
  - `sed -n '1,240p' README.md`
  - `sed -n '1,220p' package.json`
  - `sed -n '1,260p' src/App.tsx`
  - `sed -n '1,240p' src/types.ts`
  - `sed -n '1,260p' src/constants.ts`
  - `sed -n '1,260p' src/components/SettingsPanel.tsx`
  - `sed -n '1,260p' src/components/ChatInput.tsx`
  - `sed -n '1,260p' src/components/MessageList.tsx`
  - `sed -n '1,260p' src/components/Header.tsx`
  - `sed -n '1,260p' src/components/ApiKeyModal.tsx`
  - `sed -n '1,120p' .env.example`
  - `sed -n '1,220p' src/components/MarkdownContent.tsx`
  - `sed -n '1,220p' src/index.css`
  - `npm run build`
  - `date '+%Y-%m-%d %H:%M'`

### 🔬 Attempted Methods
- Reworked the frontend into a lightweight client-side orchestrator instead of adding a backend service.
- Kept standard text turns on the SSE streaming path.
- Routed image/tool-enabled turns through a structured JSON completion loop so tool calls and multimodal payloads could be handled safely.
- Implemented long-term memory as local keyword-based retrieval from `localStorage` to keep the project simple and demo-friendly.
- Grouped local tools into MCP-style server definitions to satisfy the modular tool-provider requirement while staying compatible with a frontend-only architecture.
- Failed attempt:
  - The first build after the refactor failed because `src/components/SettingsPanel.tsx` had an unused helper parameter (`label`). This was fixed by removing the unused parameter and updating the call sites.

### ⚠️ Issues & Blockers
- Production build succeeds, but Vite reports a large JS bundle warning (`dist/assets/index-DOX9aVZN.js` over 500 kB after minification).
- The MCP implementation here is educational and browser-local. It is not a full remote MCP transport client/server implementation.
- Long-term memory uses heuristic extraction and keyword retrieval, so recall quality is lightweight rather than embedding-based.

### ⏭️ Next Steps
- If needed for class demo quality, add code-splitting to reduce the main bundle size warning.
- Consider adding a real backend or vector store if the course expects stronger long-term memory behavior.
- If the instructor expects “real MCP,” replace the local registry with an actual MCP transport integration layer.
- Upload `docs/system-introduction.md` and `docs/system-architecture-diagram.md` to E3P.
