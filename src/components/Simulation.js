import "./ProfilePage.css";

export default function SimulationModal({ result, onClose }) {
  if (!result) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel reveal show">
        <header className="modal-header-simple">
          <h3 className="panel-title">Neural Forecast Analysis</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </header>

        <div className="modal-body">
          <div className="results-grid">
            <div className="res-card danger">
              <span className="label">Worst Case (Real)</span>
              <span className="val">₹{result.realWorstCase?.toLocaleString("en-IN")}</span>
            </div>
            <div className="res-card highlight">
              <span className="label">Expected Value (Real)</span>
              <span className="val">₹{result.realAverageValue?.toLocaleString("en-IN")}</span>
            </div>
            <div className="res-card success">
              <span className="label">Best Case (Real)</span>
              <span className="val">₹{result.realBestCase?.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {result.probabilityOfReachingTarget != null && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              background: result.probabilityOfReachingTarget >= 60
                ? 'rgba(14,159,110,0.08)'
                : 'rgba(255,95,46,0.08)',
              border: `1px solid ${result.probabilityOfReachingTarget >= 60
                ? 'rgba(14,159,110,0.2)'
                : 'rgba(255,95,46,0.2)'}`,
            }}>
              <span style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: '1.5rem',
                fontWeight: 800,
                color: result.probabilityOfReachingTarget >= 60 ? 'var(--accent-2)' : 'var(--accent)',
              }}>
                {result.probabilityOfReachingTarget}%
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)', opacity: 0.8, lineHeight: 1.4 }}>
                probability of reaching<br />your target corpus
              </span>
            </div>
          )}

          <div className="ai-insight-box-modal">
            <div className="badge-ai">AI Reflection</div>
            <p className="ai-text-body">
              {result.explanation || "AI explanation unavailable."}
            </p>
          </div>
        </div>

        <footer className="modal-footer">
          <button className="btn btn-primary shine full-width" onClick={onClose}>
            Acknowledge Forecast
          </button>
        </footer>
      </div>
    </div>
  );
}