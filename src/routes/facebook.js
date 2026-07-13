import crypto from "node:crypto";
import { Router } from "express";
import { getAgent } from "../agent/agent.js";
import { createThreadConfig } from "../agent/memory.js";
import { getFinalAnswer } from "../utils/messageContent.js";
import { runWithConversation } from "../utils/requestContext.js";

export const facebookRouter = Router();

facebookRouter.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && process.env.FACEBOOK_VERIFY_TOKEN && token === process.env.FACEBOOK_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

function validSignature(req) {
  if (!process.env.FACEBOOK_APP_SECRET) return true;
  const signature = req.get("x-hub-signature-256") || "";
  const expected = "sha256=" + crypto.createHmac("sha256", process.env.FACEBOOK_APP_SECRET).update(req.rawBody || Buffer.from(JSON.stringify(req.body))).digest("hex");
  return signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

async function sendFacebookMessage(recipientId, text) {
  if (!process.env.FACEBOOK_PAGE_ACCESS_TOKEN) return;
  const graphVersion = process.env.FACEBOOK_GRAPH_VERSION || "v23.0";
  const response = await fetch(`https://graph.facebook.com/${graphVersion}/me/messages?access_token=${encodeURIComponent(process.env.FACEBOOK_PAGE_ACCESS_TOKEN)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipient: { id: recipientId }, message: { text: text.slice(0, 2000) } }),
  });
  if (!response.ok) throw new Error(`Facebook Send API returned ${response.status}.`);
}

facebookRouter.post("/", (req, res) => {
  if (!validSignature(req)) return res.sendStatus(401);
  res.sendStatus(200);
  if (!process.env.FACEBOOK_PAGE_ACCESS_TOKEN) {
    console.log(JSON.stringify({ event: "facebook_webhook_received", configured: false }));
    return;
  }
  for (const entry of req.body?.entry || []) {
    for (const event of entry.messaging || []) {
      const text = event.message?.text?.trim();
      const senderId = event.sender?.id;
      if (!text || !senderId || event.message?.is_echo) continue;
      const conversationId = `facebook:${senderId}`;
      runWithConversation(conversationId, async () => {
        const result = await getAgent().invoke({ messages: [{ role: "user", content: text }] }, createThreadConfig(conversationId));
        await sendFacebookMessage(senderId, getFinalAnswer(result.messages));
      }).catch((error) => console.error(JSON.stringify({ event: "facebook_message_failed", error: error.message })));
    }
  }
});
