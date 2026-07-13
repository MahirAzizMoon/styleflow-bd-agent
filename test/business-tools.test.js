import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { searchCatalogue } from "../src/agent/tools/catalogue.js";
import { checkInventory } from "../src/agent/tools/inventory.js";
import { getStorePolicy } from "../src/agent/tools/storePolicy.js";
import { createHandoff } from "../src/agent/tools/humanHandoff.js";
import { getProductImageUrl, PRODUCTS } from "../src/data/store.js";

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

test("every catalogue product has its own ID-matched image file", () => {
  const imageUrls = [];
  for (const product of PRODUCTS) {
    const imageUrl = getProductImageUrl(product);
    assert.match(imageUrl, new RegExp(`^/products/${product.id}\\.(?:jpeg|png)$`));
    assert.ok(existsSync(new URL(`../frontend/public${imageUrl}`, import.meta.url)), `${imageUrl} is missing`);
    imageUrls.push(imageUrl);
  }
  assert.equal(imageUrls.length, PRODUCTS.length);
  assert.equal(new Set(imageUrls).size, PRODUCTS.length);
});

test("the first four kurtis have distinct product-specific images", () => {
  const kurtis = PRODUCTS.filter((product) =>
    ["SF-KURTI-101", "SF-KURTI-102", "SF-KURTI-103", "SF-KURTI-104"].includes(product.id)
  );
  const imageUrls = kurtis.map(getProductImageUrl);

  assert.equal(kurtis.length, 4);
  assert.equal(new Set(imageUrls).size, 4);
  assert.deepEqual(imageUrls, [
    "/products/SF-KURTI-101.jpeg",
    "/products/SF-KURTI-102.png",
    "/products/SF-KURTI-103.png",
    "/products/SF-KURTI-104.png",
  ]);
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

test("an exact product name or ID returns only that visual card", () => {
  assert.deepEqual(
    searchCatalogue({ query: "Show me the Nilima Embroidered Kurti as a visual card" }).map((product) => product.id),
    ["SF-KURTI-101"]
  );
  assert.deepEqual(
    searchCatalogue({ query: "Please show SF-SAREE-302" }).map((product) => product.id),
    ["SF-SAREE-302"]
  );
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

test("a provider-supplied zero maximum price is treated as no budget filter", async () => {
  const { catalogueSearchTool } = await import("../src/agent/tools/catalogue.js");
  const result = JSON.parse(await catalogueSearchTool.invoke({
    query: "panjabi",
    maxPrice: 0,
  }));
  assert.ok(result.found >= 1);
  assert.ok(result.products.every((product) => product.price > 0));
});

test("generic model-supplied category words do not hide valid catalogue matches", () => {
  const products = searchCatalogue({ query: "blue Eid outfit", category: "outfit", color: "blue", occasion: "eid", size: "L", maxPrice: 2500 });
  assert.ok(products.some((product) => product.id === "SF-KURTI-101"));
});

test("empty optional handoff customer name is accepted", async () => {
  const { humanHandoffTool } = await import("../src/agent/tools/humanHandoff.js");
  const result = JSON.parse(await humanHandoffTool.invoke({ reason: "Damaged item", customerName: "" }));
  assert.equal(result.status, "handoff_requested");
});

test("an unfiltered visual catalogue payload includes all product cards", async () => {
  const { catalogueSearchTool } = await import("../src/agent/tools/catalogue.js");
  const result = JSON.parse(await catalogueSearchTool.invoke({ query: "", category: "", color: "", size: "", occasion: "", maxPrice: 0 }));
  assert.equal(result.returned, PRODUCTS.length);
  assert.equal(result.products.length, PRODUCTS.length);
  assert.ok(result.products.every((product) => product.imageUrl?.startsWith("/")));
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
