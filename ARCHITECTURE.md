# StyleFlow BD Architecture and Q&A Guide

## End-to-end request walkthrough

1. **HTTP request** - The React app, Postman, or curl sends `POST /chat` with `message` and optional `conversationId`.
2. **Validation** - `src/routes/chat.js` trims and validates the message, limits it to 4,000 characters, validates a supplied ID through `validateConversationId`, or creates a secure UUID.
3. **Thread configuration** - `createThreadConfig` in `src/agent/memory.js` maps `conversationId` to `configurable.thread_id`.
4. **Checkpoint load** - The singleton `SqliteSaver` opens the latest state for that thread from `MEMORY_DB_PATH`.
5. **Agent reasoning** - `getAgent` in `src/agent/agent.js` returns the shared LangChain `createAgent` instance. The model follows `SYSTEM_PROMPT` from `src/agent/prompts.js` and determines whether to answer, clarify, or call a tool.
6. **Optional tool call** - Business tools read the trusted local catalogue, inventory, and policies; `calculator` performs exact arithmetic; `human_handoff` creates a safe demo escalation; and optional `tavily_search` returns current external observations. The model receives the real tool observation before writing an answer.
7. **Context management** - `summarizationMiddleware` replaces old messages with a marked summary after the configured threshold while retaining recent messages.
8. **Checkpoint save** - LangGraph persists the updated message state to SQLite before `agent.invoke` resolves.
9. **Response parsing** - `src/utils/messageContent.js` extracts text and unique tool names. The route reads memory counts and returns the established structured JSON contract.
10. **Errors and logs** - `src/middleware/errorHandler.js` maps configuration, quota, agent, and unexpected failures to safe JSON. Logs retain request IDs and diagnostic details without intentionally logging secrets.

## Main modules

- `src/index.js` - Express setup, health endpoint, static frontend selection, middleware ordering.
- `src/routes/chat.js` - API validation, invocation, timings, structured responses, memory endpoints.
- `src/agent/agent.js` - provider/model initialization, tool registration, middleware, singleton agent.
- `src/agent/memory.js` - SQLite saver, safe thread IDs, inspection, summary detection, deletion, health status.
- `src/data/store.js` - fictional catalogue, stock, and business policy source of truth.
- `src/agent/tools/catalogue.js` - filtered catalogue discovery.
- `src/agent/tools/inventory.js` - exact product variant and stock checks.
- `src/agent/tools/storePolicy.js` - controlled store policy retrieval.
- `src/agent/tools/humanHandoff.js` - safe demo escalation reference.
- `src/agent/tools/calculator.js` - deterministic arithmetic tool.
- `src/agent/tools/webSearch.js` - Tavily wrapper for current information.
- `frontend/src/App.jsx` - browser conversation state and API coordination.

## Why this is an agent

The model is not called directly from the route for a single response. LangChain controls a loop in which the model can inspect context, choose a registered tool, receive the tool observation, and then produce a final answer. `metadata.toolsUsed` provides observable evidence of that decision.

## Likely Q&A

### Why use a singleton checkpointer?

It gives all requests a consistent persistence service and avoids opening a new SQLite connection for every message. Thread isolation comes from `thread_id`, not from separate saver instances.

### What is a `thread_id`?

It is LangGraph's identifier for one checkpoint history. ChatFlow maps the public `conversationId` directly to it, so the same ID resumes a thread and another ID starts an isolated one.

### How does memory survive restart?

`SqliteSaver` writes checkpoints to `data/memory.db`. A new Node.js process opens the same file and loads the latest checkpoint for the supplied thread ID.

### How does summarization work?

The middleware counts approximate tokens. At the trigger, it asks the model to summarize older context, replaces those messages with a marked summary, and preserves recent messages. The memory endpoint detects the marker and exposes `summarized` plus a preview.

### Why can the tool result not be hallucinated?

The calculator computes deterministically and Tavily performs an external request. LangChain appends the returned observation as a tool message. The system prompt forbids inventing results, and the final answer is generated after the actual observation is present.

### What happens if Tavily is absent?

The server still starts. Only `calculator` is registered and `/health` omits `tavily_search`. The prompt tells the agent to use Tavily only when available.

### What changed from RAM memory?

Previously, restarting Node erased all `MemorySaver` state. Now SQLite persists it on disk. Setting `MEMORY_DB_PATH=:memory:` deliberately restores temporary behavior for isolated tests.

### Why is SQLite not ideal for multiple cloud instances?

It is a local file. Multiple instances need shared durable storage and coordinated writes, so a production scale-out deployment should use a PostgreSQL checkpointer.
