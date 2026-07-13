const startedAt = new Date().toISOString();
const state = {
  chatRequests: 0,
  chatFailures: 0,
  totalDurationMs: 0,
  tools: new Map(),
  products: new Map(),
  feedback: { helpful: 0, notHelpful: 0 },
  handoffs: 0,
};

function increment(map, key) {
  if (key) map.set(key, (map.get(key) || 0) + 1);
}

export function recordChat({ toolsUsed = [], durationMs = 0, products = [] }) {
  state.chatRequests += 1;
  state.totalDurationMs += durationMs;
  toolsUsed.forEach((name) => increment(state.tools, name));
  products.forEach((product) => increment(state.products, product.name || product.id));
  if (toolsUsed.includes("human_handoff")) state.handoffs += 1;
}

export function recordFailure() {
  state.chatRequests += 1;
  state.chatFailures += 1;
}

export function recordFeedback(rating) {
  if (rating === "helpful") state.feedback.helpful += 1;
  if (rating === "not_helpful") state.feedback.notHelpful += 1;
}

function topEntries(map, limit = 8) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

export function getAnalytics() {
  return {
    startedAt,
    chatRequests: state.chatRequests,
    successfulRequests: state.chatRequests - state.chatFailures,
    failedRequests: state.chatFailures,
    averageDurationMs: state.chatRequests
      ? Math.round(state.totalDurationMs / Math.max(1, state.chatRequests - state.chatFailures))
      : 0,
    handoffs: state.handoffs,
    feedback: state.feedback,
    topTools: topEntries(state.tools),
    popularProducts: topEntries(state.products),
    persistence: "In-memory demo analytics reset when the server restarts.",
  };
}
