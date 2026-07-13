import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test, { after } from "node:test";
import { AIMessage, ToolMessage } from "@langchain/core/messages";
import { END, MessagesValue, START, StateGraph, StateSchema } from "@langchain/langgraph";

const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "chatflow-memory-"));
const databasePath = path.join(temporaryDirectory, "memory.db");
process.env.MEMORY_DB_PATH = databasePath;

const {
  clearConversationMemory,
  createMemoryCheckpointer,
  createThreadConfig,
  getConversationMemory,
  getMemoryCheckpointer,
  validateConversationId,
} = await import("../src/agent/memory.js");

const TestState = new StateSchema({ messages: MessagesValue });
const graph = new StateGraph(TestState)
  .addNode("reply", (state) => ({
    messages: [new AIMessage(`I remember ${state.messages.length} message(s).`)],
  }))
  .addEdge(START, "reply")
  .addEdge("reply", END)
  .compile({ checkpointer: getMemoryCheckpointer() });

const toolNarrationGraph = new StateGraph(TestState)
  .addNode("reply", () => ({
    messages: [
      new AIMessage({
        content: "I will check the trusted catalogue now.",
        tool_calls: [{ name: "catalogue_search", args: {}, id: "audit-tool-call" }],
      }),
      new ToolMessage({
        content: '{"found":1}',
        tool_call_id: "audit-tool-call",
      }),
      new AIMessage("The requested product is in the catalogue."),
    ],
  }))
  .addEdge(START, "reply")
  .addEdge("reply", END)
  .compile({ checkpointer: getMemoryCheckpointer() });

after(() => {
  getMemoryCheckpointer().db?.close?.();
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
});

test("threads accumulate independently and one can be deleted", async () => {
  const a = `memory-a-${crypto.randomUUID()}`;
  const b = `memory-b-${crypto.randomUUID()}`;
  await graph.invoke({ messages: [{ role: "user", content: "First" }] }, createThreadConfig(a));
  await graph.invoke({ messages: [{ role: "user", content: "Second" }] }, createThreadConfig(a));
  await graph.invoke({ messages: [{ role: "user", content: "Separate" }] }, createThreadConfig(b));

  const memoryA = await getConversationMemory(a);
  assert.equal(memoryA.messageCount, 4);
  assert.equal(memoryA.turnCount, 2);
  assert.equal(memoryA.summarized, false);
  assert.equal((await getConversationMemory(b)).messageCount, 2);
  assert.equal((await clearConversationMemory(a)).deletedMessageCount, 4);
  assert.equal((await getConversationMemory(a)).exists, false);
  assert.equal((await getConversationMemory(b)).exists, true);
  await clearConversationMemory(b);
});

test("a second SQLite checkpointer reads messages written before restart", async () => {
  const threadId = `restart-${crypto.randomUUID()}`;
  await graph.invoke(
    { messages: [{ role: "user", content: "Persist this message." }] },
    createThreadConfig(threadId)
  );

  const restartedCheckpointer = createMemoryCheckpointer(databasePath);
  const tuple = await restartedCheckpointer.getTuple(createThreadConfig(threadId));
  const messages = tuple?.checkpoint?.channel_values?.messages;

  assert.equal(Array.isArray(messages), true);
  assert.equal(messages.length, 2);
  assert.equal(messages[0].content, "Persist this message.");
  restartedCheckpointer.db?.close?.();
  await clearConversationMemory(threadId);
});

test("unsafe conversation IDs are rejected", () => {
  assert.equal(validateConversationId("valid-thread_01"), "valid-thread_01");
  assert.throws(() => validateConversationId("invalid thread"), /may contain only/);
  assert.throws(() => validateConversationId("__proto__"), /may contain only/);
  assert.throws(() => validateConversationId(42), /non-empty string/);
});

test("memory inspection hides tool observations and tool-call narration", async () => {
  const threadId = `tool-memory-${crypto.randomUUID()}`;
  await toolNarrationGraph.invoke(
    { messages: [{ role: "user", content: "Check the catalogue." }] },
    createThreadConfig(threadId)
  );

  const memory = await getConversationMemory(threadId);
  assert.equal(memory.messageCount, 2);
  assert.deepEqual(memory.messages, [
    { role: "user", content: "Check the catalogue." },
    { role: "assistant", content: "The requested product is in the catalogue." },
  ]);
  await clearConversationMemory(threadId);
});
