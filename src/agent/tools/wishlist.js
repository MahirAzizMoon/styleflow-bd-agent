import { tool } from "langchain";
import { z } from "zod";
import { getActiveConversationId } from "../../utils/requestContext.js";
import { updateWishlist } from "../../services/shoppingState.js";

export const wishlistTool = tool(
  async (input) => JSON.stringify(updateWishlist(getActiveConversationId(), input)),
  {
    name: "wishlist",
    description: "Add, remove, list, or clear products in the current conversation's demo wishlist. Use exact catalogue product IDs.",
    schema: z.object({
      operation: z.enum(["add", "remove", "list", "clear"]),
      productId: z.string().trim().optional(),
    }),
  }
);
