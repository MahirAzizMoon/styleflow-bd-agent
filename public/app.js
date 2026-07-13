const messages = document.querySelector("#messages");
const form = document.querySelector("#chatForm");
const input = document.querySelector("#messageInput");
const sendButton = document.querySelector("#sendButton");
const newChatButton = document.querySelector("#newChat");
const connectionLabel = document.querySelector("#connectionLabel");
const statusDot = document.querySelector("#statusDot");
const threadPill = document.querySelector("#threadPill");

let conversationId = null;
let busy = false;

function escapeText(value) {
  const element = document.createElement("div");
  element.textContent = value;
  return element.innerHTML;
}

function addMessage(role, content, tools = []) {
  const row = document.createElement("div");
  row.className = `message ${role}`;
  const metadata = tools.length ? `Used ${tools.join(", ")}` : role === "assistant" ? "ChatFlow" : "You";
  row.innerHTML = role === "assistant"
    ? `<div class="avatar">CF</div><div class="bubble"><div>${escapeText(content)}</div><div class="message-meta">${escapeText(metadata)}</div></div>`
    : `<div class="bubble"><div>${escapeText(content)}</div><div class="message-meta">${metadata}</div></div>`;
  messages.append(row);
  messages.scrollTop = messages.scrollHeight;
}

function showTyping() {
  const row = document.createElement("div");
  row.id = "typing";
  row.className = "message assistant typing";
  row.innerHTML = '<div class="avatar">CF</div><div class="bubble"><span class="typing-dots"><span></span><span></span><span></span></span></div>';
  messages.append(row);
  messages.scrollTop = messages.scrollHeight;
}

function setBusy(value) {
  busy = value;
  input.disabled = value;
  sendButton.disabled = value;
  if (!value) input.focus();
}

function resetConversation() {
  conversationId = null;
  threadPill.textContent = "New thread";
  messages.innerHTML = document.querySelector(".welcome")?.outerHTML || `
    <div class="welcome"><div class="welcome-icon">✦</div><p class="eyebrow">NEW CONVERSATION</p>
    <h2>What can we work through?</h2><p>Ask a question, run a calculation, or tell me something to remember.</p></div>`;
  input.focus();
}

async function sendMessage(text) {
  if (busy || !text.trim()) return;
  document.querySelector(".welcome")?.remove();
  addMessage("user", text.trim());
  input.value = "";
  input.style.height = "auto";
  setBusy(true);
  showTyping();

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text.trim(), ...(conversationId && { conversationId }) }),
    });
    const data = await response.json();
    document.querySelector("#typing")?.remove();

    if (!response.ok || !data.success) {
      const apiMessage = data?.error?.message || "ChatFlow could not complete the request.";
      throw new Error(apiMessage);
    }

    conversationId = data.conversationId;
    threadPill.textContent = conversationId;
    addMessage("assistant", data.response.content, data.metadata?.toolsUsed || []);
  } catch (error) {
    document.querySelector("#typing")?.remove();
    addMessage("assistant", `I couldn't complete that request. ${error.message}`);
  } finally {
    setBusy(false);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  sendMessage(input.value);
});

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 140)}px`;
});

document.addEventListener("click", (event) => {
  const suggestion = event.target.closest("[data-prompt]");
  if (suggestion) sendMessage(suggestion.dataset.prompt);
});

newChatButton.addEventListener("click", resetConversation);

fetch("/health")
  .then((response) => response.json())
  .then((health) => {
    const ready = health.success && health.llmConfigured;
    connectionLabel.textContent = ready ? `Ready · ${health.llmProvider}` : `${health.llmProvider || "Model"} key needed`;
    statusDot.classList.toggle("online", ready);
  })
  .catch(() => { connectionLabel.textContent = "Server offline"; });

input.focus();
