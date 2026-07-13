import { useState } from "react";

export default function Composer({ onSend, loading }) {
  const [value, setValue] = useState("");

  function submit() {
    const message = value.trim();
    if (!message || loading) return;
    setValue("");
    onSend(message);
  }

  return (
    <footer className="composer-area">
      <div className="composer">
        <textarea
          aria-label="Message StyleFlow BD"
          rows="1"
          maxLength="4000"
          placeholder="Ask about outfits, sizes, stock or delivery…"
          value={value}
          disabled={loading}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
        />
        <button type="button" onClick={submit} disabled={loading || !value.trim()}>
          Send
        </button>
      </div>
      <p>Enter to send · Shift + Enter for a new line</p>
    </footer>
  );
}
