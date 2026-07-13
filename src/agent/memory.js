import fs from "node:fs";
import path from "node:path";
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";
import { contentToText } from "../utils/messageContent.js";

const configuredDatabasePath = process.env.MEMORY_DB_PATH || "./data/memory.db";

export function createMemoryCheckpointer(databasePath = configuredDatabasePath) {
  const connection = databasePath === ":memory:" ? databasePath : path.resolve(databasePath);
  if (connection !== ":memory:") {
    fs.mkdirSync(path.dirname(connection), { recursive: true });
  }
  const checkpointer = SqliteSaver.fromConnString(connection);
  checkpointer.setup();
  return checkpointer;
}

const memoryCheckpointer = createMemoryCheckpointer();

const MAX_CONVERSATION_ID_LENGTH = 128;
const SAFE_CONVERSATION_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const RESERVED_IDS = new Set(["__proto__", "constructor", "prototype"]);

function createMemoryError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  error.code = "INVALID_CONVERSATION_ID";
  error.publicMessage = message;
  return error;
}

/**
 * Validates a client-provided LangGraph thread ID.
 * A conversationId is also the checkpointer's thread_id, so it must be safe,
 * stable, and short enough to work with persistent database savers later.
 */
export function validateConversationId(conversationId) {
  if (typeof conversationId !== "string" || !conversationId.trim()) {
    throw createMemoryError("conversationId must be a non-empty string.");
  }

  const normalized = conversationId.trim();

  if (normalized.length > MAX_CONVERSATION_ID_LENGTH) {
    throw createMemoryError(
      `conversationId must be ${MAX_CONVERSATION_ID_LENGTH} characters or fewer.`
    );
  }

  if (RESERVED_IDS.has(normalized) || !SAFE_CONVERSATION_ID.test(normalized)) {
    throw createMemoryError(
      "conversationId may contain only letters, numbers, periods, underscores, colons, and hyphens."
    );
  }

  return normalized;
}

export function createThreadConfig(conversationId) {
  return {
    configurable: {
      thread_id: validateConversationId(conversationId),
    },
  };
}

/**
 * Singleton checkpointer shared by every request in this Node.js process.
 * Recreating it per request would erase the previous chat history.
 */
export function getMemoryCheckpointer() {
  return memoryCheckpointer;
}

function roleForMessage(message) {
  const type =
    message?.getType?.() ??
    message?._getType?.() ??
    message?.type ??
    message?.role ??
    message?.kwargs?.role;

  if (type === "human" || type === "user") return "user";
  if (type === "ai") return "assistant";
  if (type === "assistant") return "assistant";
  if (type === "tool") return "tool";
  if (type === "system") return "system";
  return "unknown";
}

function hasToolCalls(message) {
  const calls =
    message?.tool_calls ??
    message?.toolCalls ??
    message?.additional_kwargs?.tool_calls ??
    message?.kwargs?.tool_calls ??
    message?.kwargs?.additional_kwargs?.tool_calls;
  return Array.isArray(calls) && calls.length > 0;
}

/**
 * Returns a safe view of remembered user/assistant messages for demo and
 * debugging. Tool observations and system messages are intentionally hidden.
 */
export async function getConversationMemory(conversationId) {
  const config = createThreadConfig(conversationId);
  const checkpoint = await memoryCheckpointer.getTuple(config);
  const storedMessages = checkpoint?.checkpoint?.channel_values?.messages;
  const messages = Array.isArray(storedMessages) ? storedMessages : [];
  const summaryMessage = messages.find((message) => {
    const source =
      message?.additional_kwargs?.lc_source ??
      message?.additionalKwargs?.lc_source ??
      message?.kwargs?.additional_kwargs?.lc_source;
    const text = contentToText(message?.content ?? message?.kwargs?.content).trim();
    return source === "summarization" || text.startsWith("Here is a summary of the conversation to date:");
  });
  const summaryText = contentToText(
    summaryMessage?.content ?? summaryMessage?.kwargs?.content
  ).trim();

  const visibleMessages = messages
    .map((message) => ({
      role: roleForMessage(message),
      content: contentToText(message?.content ?? message?.kwargs?.content).trim(),
      hasToolCalls: hasToolCalls(message),
    }))
    .filter(
      (message) =>
        (message.role === "user" || message.role === "assistant") &&
        message.content &&
        !message.hasToolCalls &&
        !message.content.startsWith("Here is a summary of the conversation to date:")
    )
    .map(({ role, content }) => ({ role, content }));

  return {
    conversationId: config.configurable.thread_id,
    exists: Boolean(checkpoint),
    messageCount: visibleMessages.length,
    turnCount: visibleMessages.filter((message) => message.role === "user").length,
    summarized: Boolean(summaryMessage),
    ...(summaryMessage && { summaryPreview: summaryText.slice(0, 200) }),
    messages: visibleMessages,
  };
}

export async function clearConversationMemory(conversationId) {
  const normalized = validateConversationId(conversationId);
  const before = await getConversationMemory(normalized);
  await memoryCheckpointer.deleteThread(normalized);

  return {
    conversationId: normalized,
    cleared: before.exists,
    deletedMessageCount: before.messageCount,
  };
}

export function getMemoryStatus() {
  return {
    enabled: true,
    type: "persistent thread memory",
    provider: "LangGraph SqliteSaver",
    scope: "conversationId/thread_id",
    survivesServerRestart: configuredDatabasePath !== ":memory:",
    databasePath: configuredDatabasePath,
  };
}
