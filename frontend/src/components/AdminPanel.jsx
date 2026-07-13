import { useEffect, useState } from "react";
import { getAnalytics } from "../api.js";

export default function AdminPanel({ open, onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    getAnalytics().then((result) => setData(result.analytics)).catch((err) => setError(err.message));
  }, [open]);

  if (!open) return null;
  return (
    <div className="admin-overlay" role="dialog" aria-modal="true" aria-label="Demo analytics">
      <section className="admin-panel">
        <div className="admin-heading">
          <div><p className="eyebrow">DEMO INSIGHTS</p><h2>Agent analytics</h2></div>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        {error && <p className="panel-error">{error}</p>}
        {!data ? <p>Loading analytics…</p> : (
          <>
            <div className="metric-grid">
              <div><strong>{data.chatRequests}</strong><span>Requests</span></div>
              <div><strong>{data.successfulRequests}</strong><span>Successful</span></div>
              <div><strong>{data.failedRequests}</strong><span>Failed</span></div>
              <div><strong>{data.averageDurationMs}ms</strong><span>Average</span></div>
              <div><strong>{data.handoffs}</strong><span>Handoffs</span></div>
              <div><strong>{data.feedback.helpful}</strong><span>Helpful</span></div>
            </div>
            <div className="analytics-columns">
              <div><h3>Most-used tools</h3>{data.topTools.length ? data.topTools.map((item) => <p key={item.name}><span>{item.name}</span><strong>{item.count}</strong></p>) : <small>No data yet</small>}</div>
              <div><h3>Popular products</h3>{data.popularProducts.length ? data.popularProducts.map((item) => <p key={item.name}><span>{item.name}</span><strong>{item.count}</strong></p>) : <small>No data yet</small>}</div>
            </div>
            <p className="analytics-note">{data.persistence}</p>
          </>
        )}
      </section>
    </div>
  );
}
