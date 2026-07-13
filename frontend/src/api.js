const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body && { "Content-Type": "application/json" }),
        ...options.headers,
      },
    });
  } catch {
    const error = new Error("The StyleFlow BD backend is unreachable. Confirm that the server is running.");
    error.code = "NETWORK_ERROR";
    throw error;
  }

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.success) {
    const error = new Error(data?.error?.message || `Request failed with HTTP ${response.status}.`);
    error.code = data?.error?.code || "REQUEST_FAILED";
    throw error;
  }
  return data;
}

export function sendChat(message, conversationId) {
  return request("/chat", {
    method: "POST",
    body: JSON.stringify({ message, ...(conversationId && { conversationId }) }),
  });
}

export function inspectMemory(conversationId) {
  return request(`/chat/${encodeURIComponent(conversationId)}/memory`);
}

export function deleteMemory(conversationId) {
  return request(`/chat/${encodeURIComponent(conversationId)}/memory`, { method: "DELETE" });
}

export function getHealth() {
  return request("/health");
}
