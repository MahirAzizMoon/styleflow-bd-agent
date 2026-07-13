import assert from "node:assert/strict";
import test from "node:test";
import { requiredToolForLatestTurn } from "../src/agent/agent.js";

function aiToolCall(name) {
  return { role: "assistant", content: "", tool_calls: [{ name, args: {}, id: `call-${name}` }] };
}

test("explicit Tavily and web-search requests require tavily_search", () => {
  assert.equal(
    requiredToolForLatestTurn(
      [{ role: "user", content: "Use the tavily_search tool for recent AI agent news." }],
      { tavilyAvailable: true }
    ),
    "tavily_search"
  );
  assert.equal(
    requiredToolForLatestTurn(
      [{ role: "user", content: "Search the web for current fashion trends." }],
      { tavilyAvailable: true }
    ),
    "tavily_search"
  );
});

test("web search is not forced when Tavily is not configured or already ran", () => {
  const request = { role: "user", content: "Search the web for recent AI news." };
  assert.equal(requiredToolForLatestTurn([request], { tavilyAvailable: false }), null);
  assert.equal(
    requiredToolForLatestTurn([request, aiToolCall("tavily_search")], { tavilyAvailable: true }),
    null
  );
});

test("normal current store questions do not force Tavily", () => {
  assert.equal(
    requiredToolForLatestTurn(
      [{ role: "user", content: "What is the current stock of SF-KURTI-101?" }],
      { tavilyAvailable: true }
    ),
    null
  );
});

test("comparison with exact IDs requires product_compare", () => {
  assert.equal(
    requiredToolForLatestTurn([
      { role: "user", content: "Compare SF-KURTI-101 vs SF-KURTI-102." },
    ]),
    "product_compare"
  );
});

test("comparison by name uses catalogue lookup and then product_compare", () => {
  const request = { role: "user", content: "Compare the blue kurti and the cream kurti." };
  assert.equal(requiredToolForLatestTurn([request]), "catalogue_search");
  assert.equal(
    requiredToolForLatestTurn([request, aiToolCall("catalogue_search")]),
    "product_compare"
  );
  assert.equal(
    requiredToolForLatestTurn([
      request,
      aiToolCall("catalogue_search"),
      aiToolCall("product_compare"),
    ]),
    null
  );
});
