import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble.jsx";
import { getLatestProductMessageId } from "../chatMessages.js";

const suggestions = [
  "Recommend an Eid outfit in blue under ৳2,500, size L.",
  "Compare SF-KURTI-101 and SF-DRESS-702.",
  "My chest is 41 inches. Which size should I try?",
  "Show my wishlist.",
  "Prepare a draft for two cream Shurjo Panjabis, size L, inside Dhaka.",
  "I received a damaged item and need a human seller.",
];

export default function ChatWindow({ messages, loading, onSuggestion, onFeedback }) {
  const endRef = useRef(null);
  const latestProductMessageId = getLatestProductMessageId(messages);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <section className="chat-window" aria-live="polite">
      {messages.length === 0 ? (
        <div className="welcome-card">
          <div className="welcome-content">
            <span className="welcome-symbol">S</span>
            <p className="eyebrow">YOUR PERSONAL BOUTIQUE CONCIERGE</p>
            <h2>Style, selected<br />just for you.</h2>
            <p className="welcome-copy">
              Discover 40 curated pieces, check live size and colour availability, and get thoughtful
              recommendations for every occasion.
            </p>
            <div className="catalogue-meta">
              <span><strong>40</strong> curated pieces</span>
              <span><strong>8</strong> collections</span>
              <span><strong>৳</strong> local pricing</span>
            </div>
          </div>
          <div className="lookbook" aria-hidden="true">
            <div className="lookbook-main" />
            <div className="lookbook-small" />
            <span className="lookbook-label">THE STYLEFLOW EDIT</span>
          </div>
          <div className="suggestion-grid">
            {suggestions.map((suggestion) => (
              <button type="button" key={suggestion} onClick={() => onSuggestion(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      ) : (
        messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            showProducts={message.id === latestProductMessageId}
            onAction={onSuggestion}
            onFeedback={onFeedback}
          />
        ))
      )}
      {loading && (
        <article className="message-row assistant loading-row">
          <div className="message-label">StyleFlow BD</div>
          <div className="message-bubble typing-indicator" aria-label="StyleFlow BD is responding">
            <span /> <span /> <span />
          </div>
        </article>
      )}
      <div ref={endRef} />
    </section>
  );
}
