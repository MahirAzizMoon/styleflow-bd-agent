import { useState } from "react";

export default function MemoryPanel({ conversationId, onInspect, onClear }) {
  const [open, setOpen] = useState(false);
  const [memory, setMemory] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function inspect() {
    if (!conversationId) return;
    setBusy(true);
    setError("");
    try {
      const data = await onInspect();
      setMemory(data.memory);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function clear() {
    if (!conversationId || !window.confirm("Clear this conversation's persistent memory?")) return;
    setBusy(true);
    setError("");
    try {
      await onClear();
      setMemory(null);
      setOpen(false);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className={`memory-panel ${open ? "open" : ""}`}>
      <button className="memory-toggle" type="button" onClick={() => setOpen((value) => !value)}>
        <span>Persistent memory</span>
        <span>{open ? "←" : "→"}</span>
      </button>

      {open && (
        <div className="memory-content">
          <p className="eyebrow">LANGGRAPH SQLITE</p>
          <h2>Thread memory</h2>
          <p className="memory-thread">{conversationId || "Start a conversation to create a thread."}</p>

          <div className="memory-actions">
            <button type="button" onClick={inspect} disabled={!conversationId || busy}>Inspect</button>
            <button className="danger-button" type="button" onClick={clear} disabled={!conversationId || busy}>
              Clear
            </button>
          </div>

          {error && <p className="panel-error">{error}</p>}
          {memory && (
            <div className="memory-result">
              <div className="memory-stats">
                <span><strong>{memory.turnCount}</strong> turns</span>
                <span><strong>{memory.messageCount}</strong> messages</span>
                <span><strong>{memory.summarized ? "Yes" : "No"}</strong> summarized</span>
              </div>
              {memory.summaryPreview && (
                <div className="summary-preview">
                  <strong>Summary preview</strong>
                  <p>{memory.summaryPreview}</p>
                </div>
              )}
              <div className="remembered-list">
                {memory.messages.map((message, index) => (
                  <div key={`${message.role}-${index}`}>
                    <strong>{message.role}</strong>
                    <p>{message.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
