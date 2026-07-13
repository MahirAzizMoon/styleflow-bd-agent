import assert from "node:assert/strict";
import test from "node:test";
import { compareProducts } from "../src/agent/tools/productCompare.js";
import { getSizeGuide } from "../src/agent/tools/sizeGuide.js";
import { recommendOutfits } from "../src/agent/tools/recommender.js";
import { updateOrderDraft, updateWishlist } from "../src/services/shoppingState.js";

test("product comparison returns trusted catalogue fields", () => {
  const result = compareProducts(["SF-KURTI-101", "SF-PANJABI-601"]);
  assert.equal(result.found, 2);
  assert.ok(result.products.every((product) => product.price > 0 && product.sizes.length));
});

test("size guide recommends L for a 41-inch chest", () => {
  assert.equal(getSizeGuide({ chestInches: 41 }).recommended, "L");
});

test("personalized recommendations respect supplied filters", () => {
  const result = recommendOutfits({ occasion: "eid", maxPrice: 2500, size: "L", color: "blue" });
  assert.ok(result.recommendations.some((product) => product.id === "SF-KURTI-101"));
});

test("wishlist is isolated by conversation", () => {
  updateWishlist("wish-a", { operation: "clear" });
  updateWishlist("wish-b", { operation: "clear" });
  assert.equal(updateWishlist("wish-a", { operation: "add", productId: "SF-KURTI-101" }).count, 1);
  assert.equal(updateWishlist("wish-b", { operation: "list" }).count, 0);
});

test("order draft calculates subtotal, delivery, and total without placing an order", () => {
  updateOrderDraft("draft-a", { operation: "clear" });
  const result = updateOrderDraft("draft-a", { operation: "add", productId: "SF-PANJABI-601", color: "cream", size: "L", quantity: 2, deliveryArea: "dhaka" });
  assert.equal(result.subtotal, 3900);
  assert.equal(result.deliveryCharge, 80);
  assert.equal(result.total, 3980);
  assert.equal(result.status, "draft_only");
});

test("order draft accepts provider-string quantity and exact product name", () => {
  updateOrderDraft("draft-provider", { operation: "clear" });
  const result = updateOrderDraft("draft-provider", { operation: "prepare", productId: "Shurjo Cotton Panjabi", color: "cream", size: "L", quantity: "2", deliveryArea: "dhaka" });
  assert.equal(result.total, 3980);
});
