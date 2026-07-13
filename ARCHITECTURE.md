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
- `src/agent/tools/productCompare.js` - trusted multi-product comparisons.
- `src/agent/tools/recommender.js` - preference-based catalogue recommendations.
- `src/agent/tools/sizeGuide.js` - measurement guidance with a fit disclaimer.
- `src/agent/tools/wishlist.js` - conversation-scoped demo favourites.
- `src/agent/tools/orderDraft.js` - safe, non-binding shopping summaries.
- `src/agent/tools/storePolicy.js` - controlled store policy retrieval.
- `src/agent/tools/humanHandoff.js` - safe demo escalation reference.
- `src/agent/tools/calculator.js` - deterministic arithmetic tool.
- `src/agent/tools/webSearch.js` - Tavily wrapper for current information.
- `frontend/src/App.jsx` - browser conversation state and API coordination.

## Why this is an agent

The model is not called directly from the route for a single response. LangChain controls a loop in which the model can inspect context, choose a registered tool, receive the tool observation, and then produce a final answer. `metadata.toolsUsed` provides observable evidence of that decision.

For ordinary messages, OpenAI decides whether a tool is needed. A narrow LangChain middleware guard only makes a tool mandatory when the user explicitly asks for web search or product comparison. This prevents a probabilistic model from refusing an available tool while leaving greetings, clarification, advice, and other tool choices under the normal agent decision flow.

## Likely faculty Q&A

### Why use a singleton checkpointer?

Every request must read and write through the same initialized SQLite checkpointer. Reusing one process-level instance avoids repeatedly opening database connections, keeps setup consistent, and lets every route address conversations through the same persistence layer. The conversation data is still isolated by `thread_id`, not mixed together in the singleton.

### What is a `thread_id`?

It is LangGraph's identifier for one conversation. The API's `conversationId` is validated and mapped directly to `configurable.thread_id`. Supplying the same ID loads the same checkpoint history; using a different ID creates an isolated conversation.

### How does summarization work?

`summarizationMiddleware` estimates the stored conversation length. After `MEMORY_SUMMARY_TRIGGER_TOKENS`, it asks the model to summarize older messages while keeping the configured number of recent messages. The summary prompt preserves user facts such as names, sizes, budgets, colors, and unresolved requests. `GET /chat/:id/memory` exposes `summarized` and an optional `summaryPreview` so this behavior can be demonstrated.

### Why can the agent not simply hallucinate a tool result?

The model may request a registered tool, but application code executes that tool and adds a separate tool-observation message to the LangChain state. Catalogue, inventory, policies, calculations, and order drafts come from deterministic code and trusted local data. The final answer is generated after that observation, and `metadata.toolsUsed` is derived from actual tool calls rather than from the assistant claiming it used one. A model can still phrase an answer imperfectly, which is why the prompt forbids unsupported business claims and tests verify the deterministic tool outputs.

### What happened on restart before and after the SQLite change?

Before this iteration, `MemorySaver` stored checkpoints only in RAM, so stopping Node erased every conversation. Now `SqliteSaver` writes them to `MEMORY_DB_PATH`; restarting the server and reusing the same `conversationId` reloads the previous messages. On Render's free service the filesystem itself is ephemeral, so redeployment can still reset the database; local persistence survives a normal process restart.

### Why is an explicit tool-routing guard used?

LLM tool selection is probabilistic. When a customer explicitly says “search the web” or “compare these products,” refusing the registered tool would be incorrect. The middleware therefore requires the appropriate tool only for those explicit intents. It does not bypass LangChain: the request stays inside the agent loop, the model supplies validated tool arguments, the real tool runs, and the model receives its observation before answering.

### Why is SQLite not ideal for multiple cloud instances?

It is a local file. Multiple instances need shared durable storage and coordinated writes, so a production scale-out deployment should use a PostgreSQL checkpointer.
