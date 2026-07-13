import { AsyncLocalStorage } from "node:async_hooks";

const conversationContext = new AsyncLocalStorage();

export function runWithConversation(conversationId, callback) {
  return conversationContext.run({ conversationId }, callback);
}

export function getActiveConversationId() {
  return conversationContext.getStore()?.conversationId || "anonymous-demo";
}
