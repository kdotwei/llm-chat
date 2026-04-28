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

## [2026-04-28 17:43] Task Record

### 🎯 Task Description
- Improve Browser Server behavior so it can summarize searched information directly inside the chat and provide source web links, instead of only opening a page.
- Create a git commit before starting the new Browser Server work.

### 🛠️ Actions Taken
- Created commit:
  - `02e8204 feat: upgrade chatroom to v2`
- Modified files:
  - `README.md`
  - `docs/system-architecture-diagram.md`
  - `src/App.tsx`
  - `src/lib/mcpTools.ts`
- New behavior implemented:
  - Added `browser_search_web` tool to Browser Server
  - Kept `browser_open_url` for explicit navigation requests
  - Added system-level instruction so the model summarizes tool results in chat and cites URLs as Markdown links
  - Implemented DuckDuckGo Instant Answer JSONP lookup with compact source extraction
- Terminal commands executed:
  - `git status --short`
  - `git diff --stat`
  - `git add ... && git commit -m "feat: upgrade chatroom to v2"`
  - `npm run build`
  - `date '+%Y-%m-%d %H:%M'`

### 🔬 Attempted Methods
- Switched Browser Server from a pure handoff model to a dual-tool model:
  - `browser_search_web` for in-chat search summarization
  - `browser_open_url` for explicit page opening
- Implemented search through DuckDuckGo Instant Answer API using JSONP so the frontend can access the endpoint without depending on backend CORS proxying.
- Failed attempts:
  - The first attempt to commit inside the sandbox failed with `Unable to create '.git/index.lock': Operation not permitted`. The commit succeeded after rerunning with escalated permissions.
  - The first build after adding JSONP failed because TypeScript rejected direct casting of `window` to `Record<string, unknown>`. Fixed by converting through `unknown` first.

### ⚠️ Issues & Blockers
- Production build passes, but the bundle-size warning remains.
- DuckDuckGo Instant Answer is not a full general web search API; it is good for lightweight summaries and source links, but result coverage is narrower than a commercial search API.
- `AGENTS.md` remains untracked and was intentionally left out of the commit because it was not part of this feature change.

### ⏭️ Next Steps
- If broader search coverage is required, replace the Browser Server lookup with a dedicated search provider or a backend proxy.
- Consider adding richer rendering for cited search results, such as a source card list under the final assistant answer.

## [2026-04-28 17:48] Task Record

### 🎯 Task Description
- Fix the Browser Server news-search flow after the user encountered a `400 invalid_request_error` stating that the system message must be at the beginning.

### 🛠️ Actions Taken
- Modified files:
  - `src/App.tsx`
  - `report-codex-gpt-5.5.md`
- Terminal commands executed:
  - `sed -n '1,240p' src/App.tsx`
  - `npm run build`
  - `date '+%Y-%m-%d %H:%M'`
  - `git status --short`

### 🔬 Attempted Methods
- Inspected the request builder and confirmed that the app was prepending multiple `system` messages:
  - base system prompt
  - citation instruction
  - long-term memory context
- Reworked the payload builder so these sections are merged into a single `system` message placed at the beginning of the request.

### ⚠️ Issues & Blockers
- Root cause was backend template strictness: some OpenAI-compatible servers allow only one `system` message at the start of the conversation.
- Build passes after the fix. Bundle-size warning still remains unchanged.

### ⏭️ Next Steps
- Retest the “search today’s news” flow against the target model/server.
- If another compatibility issue appears, inspect whether the backend also has constraints around `tool` role formatting or multimodal message structure.

## [2026-04-28 17:53] Task Record

### 🎯 Task Description
- Improve the user experience after the user reported that Browser Server output looked rough and there was no clear indication that the model had received the request and was working.

### 🛠️ Actions Taken
- Modified files:
  - `src/App.tsx`
  - `src/components/ChatInput.tsx`
  - `src/components/Header.tsx`
  - `src/components/MessageList.tsx`
  - `report-codex-gpt-5.5.md`
- New UX improvements implemented:
  - Added live processing status text during request handling
  - Added animated “working” indicators in the header, chat area, and send button
  - Replaced raw tool JSON blocks with more readable tool cards
  - Improved visibility of web search results and source links in tool output cards
- Terminal commands executed:
  - `sed -n '1,260p' src/components/MessageList.tsx`
  - `sed -n '1,260p' src/components/ChatInput.tsx`
  - `sed -n '1,260p' src/types.ts`
  - `sed -n '1,260p' src/App.tsx`
  - `sed -n '1,220p' src/index.css`
  - `sed -n '240,520p' src/App.tsx`
  - `sed -n '1,240p' src/components/Header.tsx`
  - `npm run build`
  - `date '+%Y-%m-%d %H:%M'`
  - `git status --short`

### 🔬 Attempted Methods
- Added a `processingStatus` state in the app layer and updated it across request lifecycle stages:
  - message received
  - routing
  - waiting for model
  - searching or tool execution
  - finalizing answer
- Used that state in multiple UI surfaces so the system feels responsive even before any assistant text is returned.
- Reworked `MessageList` tool rendering to parse structured JSON and display human-readable cards for:
  - time lookup
  - memory search
  - web search
  - opened URL
- Failed attempt:
  - First build failed because `String.prototype.replaceAll` was unavailable under the current TypeScript target. Fixed by replacing it with `replace(/_/g, ' ')`.

### ⚠️ Issues & Blockers
- Build passes after the UI changes.
- The underlying browser-local search provider is still limited for real-time news, so UX is improved but search coverage is still constrained by the current provider choice.
- Bundle-size warning remains unchanged.

### ⏭️ Next Steps
- If “today’s news” quality still feels weak, swap Browser Server search to a stronger provider or a backend proxy with better coverage.
- Optionally hide low-value tool steps like time checks unless the user expands a debug/activity view.

## [2026-04-28 17:57] Task Record

### 🎯 Task Description
- Address the user’s concern that the Browser Server did not appear to truly access the internet for live-news queries.

### 🛠️ Actions Taken
- Modified files:
  - `src/lib/mcpTools.ts`
  - `src/components/MessageList.tsx`
  - `src/App.tsx`
  - `report-codex-gpt-5.5.md`
- New search behavior implemented:
  - News-like queries now try a live-news-first path
  - Added Google News RSS based fallback chain before DuckDuckGo Instant Answer
  - Added explicit provider / online / result status fields in browser search tool output
  - Updated UI to distinguish:
    - connected but no results
    - provider/network failure
    - successful result set with links
- Terminal commands executed:
  - `sed -n '1,260p' src/lib/mcpTools.ts`
  - `sed -n '1,260p' src/components/MessageList.tsx`
  - `npm run build`
  - `date '+%Y-%m-%d %H:%M'`
  - `git status --short`

### 🔬 Attempted Methods
- Determined that the prior Browser Server did make a request, but only to DuckDuckGo Instant Answer, which is not suitable as a full live-news search engine.
- Added a search strategy:
  - detect news-oriented queries
  - try Google News RSS via `rss2json`
  - fall back to Google News RSS via `AllOrigins`
  - only then fall back to DuckDuckGo Instant Answer
- Tightened system instructions so the assistant explicitly reports failed or empty web-search results instead of fabricating news summaries.

### ⚠️ Issues & Blockers
- Build passes after the search changes.
- Because the app is still frontend-only, live-news reliability depends on whether the chosen public provider endpoints allow browser access and remain available.
- Bundle-size warning remains unchanged.

### ⏭️ Next Steps
- Retest with a query like “今天世界新聞頭條” or “latest world news today” and confirm whether Google News RSS returns sources in the UI.
- If reliability is still inconsistent, the most robust next step is a small backend proxy or a dedicated news/search API key.

## [2026-04-29 00:07] Task Record

### 🎯 Task Description
- Fix layout breakage caused by long source URLs in the web-search result cards.

### 🛠️ Actions Taken
- Modified files:
  - `src/components/MessageList.tsx`
  - `report-codex-gpt-5.5.md`
- UI changes implemented:
  - Removed raw full-URL display from web-search source cards
  - Kept article title and snippet visible
  - Replaced long URL text with compact hyperlink labels like `來源1`, `來源2`
- Terminal commands executed:
  - `sed -n '1,260p' src/components/MessageList.tsx`
  - `git status --short`
  - `npm run build`
  - `date '+%Y-%m-%d %H:%M'`

### 🔬 Attempted Methods
- Reworked the source-card structure so the card itself is no longer a full-width anchor with the raw URL printed inside.
- Converted the source link into a short inline hyperlink badge to prevent layout overflow and keep the card compact.

### ⚠️ Issues & Blockers
- Build passes after the link-display fix.
- This change improves layout only; it does not affect provider quality or news-search reliability.

### ⏭️ Next Steps
- If desired, apply the same compact-link pattern to `browser_open_url` cards for consistency.

## [2026-04-29 00:17] Task Record

### 🎯 Task Description
- Improve the web-search news cards so the entire news block is clickable instead of only a small source link.

### 🛠️ Actions Taken
- Modified files:
  - `src/components/MessageList.tsx`
  - `report-codex-gpt-5.5.md`
- UI changes implemented:
  - Converted each news result card into a block-level anchor
  - Kept the `來源N` badge as a visual label only
  - Added hover lift and focus ring states for clearer click affordance
- Terminal commands executed:
  - `sed -n '70,170p' src/components/MessageList.tsx`
  - `npm run build`
  - `date '+%Y-%m-%d %H:%M'`
  - `git status --short`

### 🔬 Attempted Methods
- Replaced the inner hyperlink with an outer clickable card to avoid nested anchor issues and make the whole result easier to click.
- Preserved the same information density while improving interaction ergonomics.

### ⚠️ Issues & Blockers
- Build passes after the clickable-card change.
- This is a UI-only improvement and does not change search-provider behavior.

### ⏭️ Next Steps
- Optionally apply the same full-card clickable treatment to other external-link cards for consistency.

## [2026-04-29 00:32] Task Record

### 🎯 Task Description
- Fix the Mermaid diagram in `docs/system-architecture-diagram.md` after the user reported a parser error.

### 🛠️ Actions Taken
- Modified files:
  - `docs/system-architecture-diagram.md`
  - `report-codex-gpt-5.5.md`
- Diagram changes implemented:
  - Replaced HTML `<br/>` labels with plain-text node labels
  - Kept the same architecture structure and edges
- Terminal commands executed:
  - `sed -n '1,220p' docs/system-architecture-diagram.md`
  - `sed -n '1,80p' docs/system-architecture-diagram.md`
  - `date '+%Y-%m-%d %H:%M'`

### 🔬 Attempted Methods
- Treated the issue as a Mermaid renderer compatibility problem rather than an architecture-content problem.
- Simplified the node labels to a more conservative Mermaid syntax that should render correctly on more platforms.

### ⚠️ Issues & Blockers
- The file already contained `flowchart TD`, so the likely issue was renderer incompatibility with the previous label format.

### ⏭️ Next Steps
- Re-open the markdown in the target renderer and confirm the simplified Mermaid diagram now renders correctly.
