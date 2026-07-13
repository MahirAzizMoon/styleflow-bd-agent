export default function MessageBubble({ message }) {
  const isError = message.role === "error";
  const label = isError ? "Error" : message.role === "user" ? "You" : "StyleFlow BD";

  return (
    <article className={`message-row ${message.role}`}>
      <div className="message-label">{label}</div>
      <div className="message-bubble">
        {isError && <strong className="error-code">{message.code}</strong>}
        <p>{message.content}</p>
        {message.toolsUsed?.length > 0 && (
          <div className="tool-badges">
            {message.toolsUsed.map((toolName) => (
              <span className="tool-badge" key={toolName}>🔧 {toolName}</span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
