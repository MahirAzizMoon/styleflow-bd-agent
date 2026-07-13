import crypto from "node:crypto";
import { tool } from "langchain";
import { z } from "zod";
import { STORE } from "../../data/store.js";

export function createHandoff({ reason, customerName }) {
  return {
    status: "handoff_requested",
    reference: `SF-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    customerName: customerName || "Not provided",
    reason,
    nextStep: `A human seller is available during ${STORE.contact.hours}. This demo does not send personal details externally.`,
  };
}

export const humanHandoffTool = tool(
  async (input) => JSON.stringify(createHandoff(input)),
  {
    name: "human_handoff",
    description: "Create a safe demo handoff reference when the customer requests a person, reports payment/order/damaged-item problems, or the agent cannot answer confidently.",
    schema: z.object({
      reason: z.string().trim().min(3),
      customerName: z.string().trim().min(1).optional(),
    }),
  }
);
