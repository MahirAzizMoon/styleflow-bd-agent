import assert from "node:assert/strict";
import test from "node:test";
import { getRichResponseData, getToolsUsed } from "../src/utils/messageContent.js";
import { getLatestProductMessageId } from "../frontend/src/chatMessages.js";

function toolPayload(payload) {
  return { type: "tool", content: JSON.stringify(payload) };
}

test("rich response data only includes products from the latest user turn", () => {
  const oldProducts = [{ id: "OLD-1" }, { id: "OLD-2" }];
  const newProducts = Array.from({ length: 12 }, (_, index) => ({ id: `NEW-${index + 1}` }));
  const messages = [
    { role: "user", content: "Show the first products" },
    { role: "assistant", tool_calls: [{ name: "old_search" }] },
    toolPayload({ products: oldProducts }),
    { role: "assistant", content: "Here they are" },
    { role: "user", content: "Now show different products" },
    { role: "assistant", tool_calls: [{ name: "catalogue_search" }] },
    toolPayload({ products: newProducts }),
    { role: "assistant", content: "Here are the new products" },
  ];

  assert.deepEqual(getRichResponseData(messages).products, newProducts);
  assert.deepEqual(getToolsUsed(messages), ["catalogue_search"]);
});

test("the frontend selects only the newest product grid for display", () => {
  const messages = [
    { id: "old", products: [{ id: "OLD-1" }] },
    { id: "text-only" },
    { id: "new", products: [{ id: "NEW-1" }] },
  ];

  assert.equal(getLatestProductMessageId(messages), "new");
});
