import { tool } from "langchain";
import { z } from "zod";
import { STORE } from "../../data/store.js";

export function getStorePolicy(topic) {
  const policies = {
    delivery: STORE.delivery,
    payment: STORE.paymentMethods,
    exchange: STORE.exchangePolicy,
    return: STORE.returnPolicy,
    ordering: STORE.orderPolicy,
    contact: STORE.contact,
  };
  return { store: STORE.name, topic, policy: policies[topic] };
}

export const storePolicyTool = tool(
  async ({ topic }) => JSON.stringify(getStorePolicy(topic)),
  {
    name: "store_policy",
    description: "Retrieve trusted StyleFlow BD delivery, payment, exchange, return, ordering, or contact policy. Use it instead of guessing business rules.",
    schema: z.object({
      topic: z.enum(["delivery", "payment", "exchange", "return", "ordering", "contact"]),
    }),
  }
);
