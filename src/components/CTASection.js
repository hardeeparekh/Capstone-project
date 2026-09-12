export default function CTASection({ onLaunchSim }) {
  return (
    <section className="section cta-section">
      <h2 className="cta-title">Ready to forge your future?</h2>
      <button onClick={onLaunchSim} className="btn btn-primary shine cta-btn">
        🚀 Launch Interactive Simulators
      </button>
    </section>
  );
}
