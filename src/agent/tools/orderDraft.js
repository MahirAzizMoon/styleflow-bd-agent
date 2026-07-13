import { tool } from "langchain";
import { z } from "zod";
import { getActiveConversationId } from "../../utils/requestContext.js";
import { updateOrderDraft } from "../../services/shoppingState.js";

export const orderDraftTool = tool(
  async (input) => JSON.stringify(updateOrderDraft(getActiveConversationId(), input)),
  {
    name: "order_draft",
    description: "Prepare, view, edit, or clear a non-binding order draft for the current conversation. This never places an order or confirms payment.",
    schema: z.object({
      operation: z.enum(["add", "prepare", "create", "remove", "view", "clear"]),
      productId: z.string().trim().optional(),
      color: z.string().trim().optional(),
      size: z.string().trim().optional(),
      quantity: z.union([z.number().int().nonnegative(), z.string().trim().regex(/^\d+$/)]).optional(),
      deliveryArea: z.enum(["dhaka", "outside_dhaka"]).optional(),
    }),
  }
);
