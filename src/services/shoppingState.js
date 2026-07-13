import { PRODUCTS, STORE } from "../data/store.js";

const wishlists = new Map();
const orderDrafts = new Map();

function getProduct(productId) {
  const lookup = String(productId || "").toLowerCase();
  return PRODUCTS.find((product) =>
    product.id.toLowerCase() === lookup || product.name.toLowerCase() === lookup
  );
}

function publicProduct(product) {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    description: product.description,
    occasions: product.occasions,
    price: product.price,
    currency: "BDT",
    imageUrl: product.category === "panjabi" || product.category === "shirt"
      ? "/boutique-rack.jpg"
      : "/boutique-hero.jpg",
  };
}

export function updateWishlist(conversationId, { operation, productId }) {
  const current = wishlists.get(conversationId) || [];
  if (operation === "add") {
    const product = getProduct(productId);
    if (!product) return { success: false, message: "That product ID is not in the catalogue." };
    if (!current.includes(product.id)) current.push(product.id);
    wishlists.set(conversationId, current);
  }
  if (operation === "remove") {
    wishlists.set(conversationId, current.filter((id) => id !== productId));
  }
  if (operation === "clear") wishlists.set(conversationId, []);
  const products = (wishlists.get(conversationId) || []).map(getProduct).filter(Boolean).map(publicProduct);
  return { success: true, operation, count: products.length, products };
}

export function updateOrderDraft(conversationId, input) {
  const operation = input.operation === "prepare" || input.operation === "create" ? "add" : input.operation;
  const current = orderDrafts.get(conversationId) || { items: [], deliveryArea: "dhaka" };
  if (operation === "add") {
    const product = getProduct(input.productId);
    if (!product) return { success: false, message: "That product ID is not in the catalogue." };
    const variant = product.variants.find((item) =>
      (!input.color || item.color.toLowerCase().includes(input.color.toLowerCase())) &&
      (!input.size || item.size.toLowerCase() === input.size.toLowerCase())
    );
    if (!variant) return { success: false, message: "That color and size combination is not listed." };
    const quantity = Math.max(1, Number.parseInt(input.quantity, 10) || 1);
    if (quantity > variant.stock) return { success: false, message: `Only ${variant.stock} piece(s) are available.` };
    current.items.push({
      productId: product.id,
      name: product.name,
      color: variant.color,
      size: variant.size,
      quantity,
      unitPrice: product.price,
    });
  }
  if (operation === "remove") {
    current.items = current.items.filter((item) => item.productId !== input.productId);
  }
  if (operation === "clear") current.items = [];
  if (input.deliveryArea) current.deliveryArea = input.deliveryArea;
  orderDrafts.set(conversationId, current);
  const subtotal = current.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const deliveryCharge = current.items.length
    ? current.deliveryArea === "outside_dhaka" ? STORE.delivery.outsideDhaka.charge : STORE.delivery.dhaka.charge
    : 0;
  return {
    success: true,
    operation,
    items: current.items,
    deliveryArea: current.deliveryArea,
    subtotal,
    deliveryCharge,
    total: subtotal + deliveryCharge,
    currency: "BDT",
    status: "draft_only",
    notice: "A human seller must confirm stock, customer details, payment, and the final order.",
  };
}

export function clearShoppingState(conversationId) {
  wishlists.delete(conversationId);
  orderDrafts.delete(conversationId);
}
