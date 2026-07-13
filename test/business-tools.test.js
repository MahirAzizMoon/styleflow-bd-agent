import assert from "node:assert/strict";
import test from "node:test";
import { searchCatalogue } from "../src/agent/tools/catalogue.js";
import { checkInventory } from "../src/agent/tools/inventory.js";
import { getStorePolicy } from "../src/agent/tools/storePolicy.js";
import { createHandoff } from "../src/agent/tools/humanHandoff.js";
import { PRODUCTS } from "../src/data/store.js";

test("catalogue contains at least 40 unique complete products", () => {
  assert.ok(PRODUCTS.length >= 40);
  assert.equal(new Set(PRODUCTS.map((product) => product.id)).size, PRODUCTS.length);
  for (const product of PRODUCTS) {
    assert.ok(product.name && product.category && product.description);
    assert.ok(product.price > 0);
    assert.ok(product.occasions.length > 0);
    assert.ok(product.variants.length > 0);
  }
});

test("catalogue search respects budget, occasion, color, and size", () => {
  const products = searchCatalogue({
    query: "Show me a blue Eid outfit under 2500 taka in size L",
    maxPrice: 2500,
    occasion: "eid",
    color: "blue",
    size: "L",
  });
  const nilima = products.find((product) => product.id === "SF-KURTI-101");
  assert.ok(nilima);
  assert.equal(nilima.price, 1850);
});

test("catalogue search returns no product when filters cannot all be satisfied", () => {
  assert.deepEqual(searchCatalogue({ category: "saree", size: "XL" }), []);
});

test("empty optional provider fields are treated as absent filters", async () => {
  const { catalogueSearchTool } = await import("../src/agent/tools/catalogue.js");
  const result = JSON.parse(await catalogueSearchTool.invoke({
    query: "",
    category: "",
    color: "",
    size: "L",
    occasion: "eid",
    maxPrice: 2500,
  }));
  assert.ok(result.found >= 1);
  assert.ok(result.products.some((product) => product.id === "SF-KURTI-101"));
});

test("inventory reports an exact listed variant and stock quantity", () => {
  const result = checkInventory({ productId: "SF-KURTI-101", color: "blue", size: "M" });
  assert.equal(result.found, true);
  assert.deepEqual(result.variants, [{ color: "blue", size: "M", stock: 7, available: true }]);
});

test("inventory handles unknown product and unknown variant safely", () => {
  assert.equal(checkInventory({ productId: "NOT-REAL" }).found, false);
  const result = checkInventory({ productId: "SF-KURTI-101", color: "orange", size: "XL" });
  assert.equal(result.found, true);
  assert.deepEqual(result.variants, []);
});

test("store policy returns Bangladesh-specific delivery facts", () => {
  const result = getStorePolicy("delivery");
  assert.equal(result.policy.dhaka.charge, 80);
  assert.equal(result.policy.outsideDhaka.charge, 130);
});

test("human handoff creates a reference without sending personal data", () => {
  const result = createHandoff({ reason: "Customer asked for a human seller" });
  assert.equal(result.status, "handoff_requested");
  assert.match(result.reference, /^SF-[A-F0-9]{8}$/);
  assert.match(result.nextStep, /does not send personal details externally/i);
});
