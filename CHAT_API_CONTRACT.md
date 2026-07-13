# ChatFlow API Contract

All responses are JSON. Successful responses contain `success: true`; errors contain `success: false`, a request ID, and a safe `error` object.

## `GET /health`

Returns HTTP 200 with service status, the selected model provider and model, whether it is configured, registered tools, and the persistent LangGraph SQLite configuration. `tavily_search` appears only when `TAVILY_API_KEY` is set.

## `POST /chat`

Request body:

```json
{ "message": "Calculate 20 percent of 500.", "conversationId": "optional-safe-id" }
```

`message` must be a non-empty string of at most 4,000 characters. `conversationId`, when supplied, must be a non-empty string of at most 128 characters containing only letters, numbers, `.`, `_`, `:`, or `-`. A secure UUID is generated when it is omitted.

HTTP 200 returns the request and assistant response plus `metadata.toolsUsed`, timing data, and memory counts. The conversation ID maps directly to LangGraph's `thread_id`.

HTTP 400 uses `INVALID_INPUT`, `MESSAGE_TOO_LONG`, or `INVALID_CONVERSATION_ID`. HTTP 429 uses `LLM_RATE_LIMITED` when provider quota or rate limits prevent a model call. HTTP 503 uses `LLM_NOT_CONFIGURED` when the selected provider key is absent. Other upstream agent failures return a controlled HTTP 500 `AGENT_ERROR` without secrets or stack traces.

## `GET /chat/:conversationId/memory`

HTTP 200 returns whether the thread exists, user/assistant message count, turn count, `summarized`, optional `summaryPreview`, and safe readable messages. Tool and system messages are not exposed. An invalid ID returns HTTP 400.

## `DELETE /chat/:conversationId/memory`

HTTP 200 deletes only the named thread and returns `cleared` and `deletedMessageCount`. Deleting an absent valid thread is safe and reports `cleared: false`.

## Other routes and malformed JSON

Unknown routes return HTTP 404 `NOT_FOUND`. Unexpected failures return HTTP 500 with a generic message. Memory uses a file-backed `SqliteSaver`: threads are isolated and survive server restarts when `MEMORY_DB_PATH` points to a file.
