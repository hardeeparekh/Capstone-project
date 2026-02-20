export default function SIPSimulation() {
  return (
    <section id="sip" className="section reveal">
      <span className="eyebrow">Simulation</span>
      <h2 className="section-title">SIP Growth Simulator</h2>

      <div className="sip-panel">
        <div className="sip-field">
          <label>Monthly SIP (₹)</label>
          <input type="number" placeholder="10000" />
        </div>

        <div className="sip-field">
          <label>Investment Duration (Years)</label>
          <input type="number" placeholder="20" />
        </div>

        <div className="sip-field">
          <label>Risk Level</label>
          <select>
            <option>Low</option>
            <option>Moderate</option>
            <option>High</option>
          </select>
        </div>

        <button className="primary-btn">Run Simulation</button>
      </div>

      <div className="sip-results">
        <div className="sip-card">
          <h3>Total Investment</h3>
          <p>₹ 24,00,000</p>
        </div>

        <div className="sip-card">
          <h3>Average Outcome</h3>
          <p>₹ 96,00,000</p>
        </div>

        <div className="sip-card">
          <h3>Worst Case</h3>
          <p>₹ 80,00,000</p>
        </div>

        <div className="sip-card">
          <h3>Best Case</h3>
          <p>₹ 1,15,00,000</p>
        </div>
      </div>

      <div className="prob-section">
        <h3>Probability of Reaching Goal</h3>
        <div className="prob-bar">
          <div className="prob-fill" style={{ width: "37%" }}></div>
        </div>
        <p>37%</p>
      </div>

      <div className="ai-panel">
        <h3>AI Insight</h3>
        <p>
          Your investment shows strong long-term growth potential, but there is
          only a 37% probability of reaching your target.
        </p>
        <button className="secondary-btn">Explain More</button>
      </div>
    </section>
  );
}