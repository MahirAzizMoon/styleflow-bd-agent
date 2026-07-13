# LangGraph SQLite Memory Setup

## Memory type

ChatFlow uses a singleton `SqliteSaver` from `@langchain/langgraph-checkpoint-sqlite`. Each API `conversationId` becomes LangGraph's `thread_id`, and checkpoints are stored in a SQLite file.

```text
conversationId → thread_id → SqliteSaver → data/memory.db
```

The default configuration is:

```env
MEMORY_DB_PATH=./data/memory.db
MEMORY_SUMMARY_TRIGGER_TOKENS=6000
MEMORY_RECENT_MESSAGES_TO_KEEP=12
```

Set `MEMORY_DB_PATH=:memory:` only for temporary tests. File-backed SQLite survives Node.js server restarts. The `data/` directory and database are gitignored.

## Why the checkpointer is a singleton

`src/agent/memory.js` creates one shared checkpointer for the process. Every invocation of the agent uses that instance with a validated `thread_id`. A new checkpointer per HTTP request would add needless database connections and could make thread behavior harder to reason about.

## Request flow

1. `POST /chat` accepts a message and optional `conversationId`.
2. `createThreadConfig(conversationId)` maps it to `configurable.thread_id`.
3. LangGraph loads the latest checkpoint for that thread.
4. The agent responds and LangGraph writes the updated checkpoint.
5. A later process can open the same SQLite file and restore the thread.

Different IDs remain isolated. `DELETE /chat/:conversationId/memory` calls `SqliteSaver.deleteThread` and removes only that thread's checkpoint and pending-write rows.

## Inspect memory

```http
GET /chat/:conversationId/memory
```

The response exposes safe user/assistant history, counts, and summarization state:

```json
{
  "success": true,
  "memory": {
    "conversationId": "demo-thread",
    "exists": true,
    "messageCount": 4,
    "turnCount": 2,
    "summarized": false,
    "messages": [
      { "role": "user", "content": "My name is Rashik." },
      { "role": "assistant", "content": "Nice to meet you, Rashik." }
    ]
  }
}
```

Tool observations and system messages are intentionally hidden.

## Demonstrate restart persistence

1. Send `My name is Rashik.` and keep the returned `conversationId`.
2. Stop the server with `Ctrl+C`.
3. Run `npm start` again without deleting `data/memory.db`.
4. Send `What is my name?` with the same ID.
5. The agent answers `Rashik` because the checkpoint was restored from SQLite.

## Demonstrate summarization

Temporarily set:

```env
MEMORY_SUMMARY_TRIGGER_TOKENS=500
MEMORY_RECENT_MESSAGES_TO_KEEP=4
```

Restart the server, state a distinctive fact in the first message, then send approximately 8-10 substantive messages. Inspect the thread:

```http
GET /chat/:conversationId/memory
```

It should report `summarized: true` and a `summaryPreview` of about 200 characters. Ask about the first fact to show that it remains available through the summary. Restore the normal threshold after the demo.

The middleware permanently replaces older messages with a marked summary message while keeping recent messages. `getConversationMemory` detects LangChain's `lc_source: "summarization"` marker defensively, with a summary-prefix fallback.

## Production note

SQLite is appropriate for this single-process local demonstration. A multi-instance production deployment should use a shared checkpointer such as PostgreSQL. Render's free filesystem is ephemeral, so the local+tunnel demo is the reliable way to demonstrate restart persistence.
