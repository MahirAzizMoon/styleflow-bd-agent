import crypto from "node:crypto";
import { Router } from "express";
import { getAgent } from "../agent/agent.js";
import {
  clearConversationMemory,
  createThreadConfig,
  getConversationMemory,
  validateConversationId,
} from "../agent/memory.js";
import { getFinalAnswer, getRichResponseData, getToolsUsed } from "../utils/messageContent.js";
import { runWithConversation } from "../utils/requestContext.js";
import { recordChat, recordFailure } from "../services/analytics.js";
import { clearShoppingState } from "../services/shoppingState.js";

export const chatRouter = Router();

chatRouter.post("/", async (req, res, next) => {
  const requestId = req.requestId || crypto.randomUUID();

  try {
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    if (!message) {
      return res.status(400).json({
        success: false,
        requestId,
        error: {
          code: "INVALID_INPUT",
          message: "The request body must contain a non-empty string field named 'message'.",
        },
      });
    }

    const hasConversationId = Object.prototype.hasOwnProperty.call(
      req.body ?? {},
      "conversationId"
    );
    const conversationId = validateConversationId(
      hasConversationId ? req.body.conversationId : crypto.randomUUID()
    );

    if (message.length > 4000) {
      return res.status(400).json({
        success: false,
        requestId,
        error: {
          code: "MESSAGE_TOO_LONG",
          message: "The message must be 4,000 characters or fewer.",
        },
      });
    }

    const receivedAt = new Date().toISOString();
    const startedAt = Date.now();
    const agent = getAgent();

    console.log(
      JSON.stringify({
        event: "chat_request_received",
        requestId,
        conversationId,
        route: `${req.method} ${req.originalUrl}`,
        startedAt: receivedAt,
        messageLength: message.length,
      })
    );

    const result = await runWithConversation(conversationId, () => agent.invoke(
      { messages: [{ role: "user", content: message }] },
      createThreadConfig(conversationId)
    ));

    const toolsUsed = getToolsUsed(result.messages);
    const content = getFinalAnswer(result.messages);
    const richData = getRichResponseData(result.messages);
    const durationMs = Date.now() - startedAt;
    const completedAt = new Date().toISOString();
    const memory = await getConversationMemory(conversationId);
    recordChat({ toolsUsed, durationMs, products: richData.products });

    console.log(
      JSON.stringify({
        event: "chat_response_created",
        requestId,
        conversationId,
        toolsUsed,
        rememberedMessages: memory.messageCount,
        completedAt,
        durationMs,
      })
    );

    return res.status(200).json({
      success: true,
      requestId,
      conversationId,
      request: {
        role: "user",
        content: message,
      },
      response: {
        role: "assistant",
        content,
      },
      metadata: {
        toolsUsed,
        memory: {
          enabled: true,
          threadId: conversationId,
          rememberedMessages: memory.messageCount,
          conversationTurns: memory.turnCount,
        },
        durationMs,
        receivedAt,
        completedAt,
        ...richData,
      },
    });
  } catch (error) {
    recordFailure();
    error.requestId = requestId;
    next(error);
  }
});

chatRouter.get("/:conversationId/memory", async (req, res, next) => {
  try {
    const memory = await getConversationMemory(req.params.conversationId);

    return res.status(200).json({
      success: true,
      requestId: req.requestId,
      memory,
    });
  } catch (error) {
    error.requestId = req.requestId;
    next(error);
  }
});

chatRouter.delete("/:conversationId/memory", async (req, res, next) => {
  try {
    const result = await clearConversationMemory(req.params.conversationId);
    clearShoppingState(result.conversationId);

    return res.status(200).json({
      success: true,
      requestId: req.requestId,
      memory: result,
    });
  } catch (error) {
    error.requestId = req.requestId;
    next(error);
  }
});
