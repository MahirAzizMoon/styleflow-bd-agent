import ProductCard from "./ProductCard.jsx";

export default function MessageBubble({ message, showProducts = true, onAction, onFeedback }) {
  const isError = message.role === "error";
  const label = isError ? "Error" : message.role === "user" ? "You" : "StyleFlow BD";

  return (
    <article className={`message-row ${message.role}`}>
      <div className="message-label">{label}</div>
      <div className="message-bubble">
        {isError && <strong className="error-code">{message.code}</strong>}
        <p>{message.content}</p>
        {showProducts && message.products?.length > 0 && (
          <div className="product-grid">
            {message.products.map((product) => <ProductCard key={product.id} product={product} onAction={onAction} />)}
          </div>
        )}
        {message.orderDraft && (
          <div className="draft-card">
            <strong>Order draft · not placed</strong>
            {message.orderDraft.items.map((item) => <p key={`${item.productId}-${item.color}-${item.size}`}>{item.quantity} × {item.name} · {item.color} · {item.size}</p>)}
            <p>Subtotal ৳{message.orderDraft.subtotal} + delivery ৳{message.orderDraft.deliveryCharge}</p>
            <strong>Total ৳{message.orderDraft.total}</strong>
          </div>
        )}
        {message.handoff && <div className="handoff-card"><strong>Human handoff {message.handoff.reference}</strong><p>{message.handoff.nextStep}</p></div>}
        {message.toolsUsed?.length > 0 && (
          <div className="tool-badges">
            {message.toolsUsed.map((toolName) => (
              <span className="tool-badge" key={toolName}>🔧 {toolName}</span>
            ))}
          </div>
        )}
        {message.role === "assistant" && (
          <div className="feedback-actions">
            <span>Helpful?</span>
            <button type="button" onClick={() => onFeedback("helpful")}>Yes</button>
            <button type="button" onClick={() => onFeedback("not_helpful")}>No</button>
          </div>
        )}
      </div>
    </article>
  );
}
