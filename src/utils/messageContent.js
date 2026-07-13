export function contentToText(content) {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part?.type === "text" && typeof part.text === "string") return part.text;
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }

  return content == null ? "" : JSON.stringify(content);
}

export function getFinalAnswer(messages = []) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    const text = contentToText(message?.content).trim();
    const isToolMessage = message?.getType?.() === "tool" || message?._getType?.() === "tool";

    if (text && !isToolMessage) {
      return text;
    }
  }

  return "The agent completed the request but did not return a text response.";
}

export function getToolsUsed(messages = []) {
  const tools = new Set();

  for (const message of messages) {
    const calls = message?.tool_calls ?? message?.additional_kwargs?.tool_calls ?? [];
    for (const call of calls) {
      const name = call?.name ?? call?.function?.name;
      if (name) tools.add(name);
    }
  }

  return [...tools];
}

export function getRichResponseData(messages = []) {
  const products = [];
  let handoff;
  let orderDraft;
  let wishlist;
  const seen = new Set();

  for (const message of messages) {
    const isToolMessage = message?.getType?.() === "tool" || message?._getType?.() === "tool" || message?.type === "tool";
    if (!isToolMessage) continue;
    const raw = contentToText(message?.content).trim();
    let payload;
    try { payload = JSON.parse(raw); } catch { continue; }
    const candidates = [
      ...(Array.isArray(payload.products) ? payload.products : []),
      ...(Array.isArray(payload.recommendations) ? payload.recommendations : []),
    ];
    for (const product of candidates) {
      if (!product?.id || seen.has(product.id)) continue;
      seen.add(product.id);
      products.push(product);
    }
    if (payload.status === "handoff_requested") handoff = payload;
    if (payload.status === "draft_only") orderDraft = payload;
    if (payload.operation && Array.isArray(payload.products) && Object.hasOwn(payload, "count")) wishlist = payload;
  }

  return { products: products.slice(0, 8), handoff, orderDraft, wishlist };
}
