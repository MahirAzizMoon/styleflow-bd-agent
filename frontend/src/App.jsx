import { useEffect, useState } from "react";
import { deleteMemory, getHealth, inspectMemory, sendChat } from "./api.js";
import ChatWindow from "./components/ChatWindow.jsx";
import Composer from "./components/Composer.jsx";
import MemoryPanel from "./components/MemoryPanel.jsx";

const CONVERSATION_KEY = "styleflow.conversationId";
const MESSAGES_KEY = "styleflow.messages";

function loadMessages() {
  try {
    return JSON.parse(sessionStorage.getItem(MESSAGES_KEY)) || [];
  } catch {
    return [];
  }
}

export default function App() {
  const [conversationId, setConversationId] = useState(
    () => sessionStorage.getItem(CONVERSATION_KEY) || ""
  );
  const [messages, setMessages] = useState(loadMessages);
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    sessionStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    getHealth().then(setHealth).catch(() => setHealth(null));
  }, []);

  async function handleSend(content) {
    const userMessage = { id: crypto.randomUUID(), role: "user", content };
    setMessages((current) => [...current, userMessage]);
    setLoading(true);

    try {
      const data = await sendChat(content, conversationId);
      if (!conversationId) {
        setConversationId(data.conversationId);
        sessionStorage.setItem(CONVERSATION_KEY, data.conversationId);
      }
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.response.content,
          toolsUsed: data.metadata.toolsUsed,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "error",
          content: error.message,
          code: error.code,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleNewConversation() {
    sessionStorage.removeItem(CONVERSATION_KEY);
    sessionStorage.removeItem(MESSAGES_KEY);
    setConversationId("");
    setMessages([]);
  }

  async function handleInspectMemory() {
    return inspectMemory(conversationId);
  }

  async function handleClearMemory() {
    const result = await deleteMemory(conversationId);
    handleNewConversation();
    return result;
  }

  return (
    <div className="app-shell">
      <MemoryPanel
        conversationId={conversationId}
        onInspect={handleInspectMemory}
        onClear={handleClearMemory}
      />
      <main className="chat-app">
        <header className="app-header">
          <div className="brand-lockup">
            <span className="brand-mark">SF</span>
            <div>
              <h1>StyleFlow BD</h1>
              <p className="brand-subtitle">AI shopping concierge</p>
            </div>
          </div>
          <div className="header-actions">
            <div className={`status-pill ${health?.status === "ok" ? "online" : "checking"}`}>
              <span className="status-dot" />
              {health?.status === "ok" ? "Online" : "Connecting"}
            </div>
            <div className="thread-label" title={conversationId || "No active conversation"}>
              <span>Thread</span>
              <strong>{conversationId ? conversationId.slice(0, 12) : "New"}</strong>
            </div>
            <button className="secondary-button" type="button" onClick={handleNewConversation}>
              New conversation
            </button>
          </div>
        </header>

        <ChatWindow messages={messages} loading={loading} onSuggestion={handleSend} />
        <Composer onSend={handleSend} loading={loading} />
      </main>
    </div>
  );
}
