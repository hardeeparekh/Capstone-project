import { useEffect, useState } from 'react';

function randomBarHeight() {
  return 20 + Math.random() * 60;
}

export default function HeroSection() {
  const [bars, setBars] = useState(() =>
    Array.from({ length: 12 }, () => randomBarHeight())
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setBars((prev) =>
        prev.map((height) => Math.max(10, Math.min(90, height + (Math.random() * 20 - 10))))
      );
    }, 2300);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <section className="hero section" id="top">
      <div className="hero-content reveal">
        <span className="eyebrow">Interactive Financial Simulation</span>
        <h1 className="hero-title">Build money instincts before real money mistakes.</h1>
        <p className="hero-sub">
          Not a calculator. A simulation-first learning world where you face market crashes,
          inflation spikes, and tough choices to master long-term discipline.
        </p>
        <div className="hero-actions">
          <a href="#features" className="btn btn-primary shine">
            Start Simulation
          </a>
          <a href="#levels" className="btn btn-ghost shine">
            View Levels
          </a>
        </div>
      </div>

      <div className="hero-visual reveal">
        <div className="mock-interface">
          <div className="mock-header">
            <div>
              <span className="mock-dot" />
              <span className="mock-dot" />
              <span className="mock-dot" />
            </div>
            <div className="mock-user">Year 12: Age 34</div>
          </div>
          <div className="mock-stats">
            <div className="stat-card">
              <span className="stat-label">Net Worth</span>
              <div className="stat-val up">Rs 1,42,500</div>
            </div>
            <div className="stat-card">
              <span className="stat-label">Market Trend</span>
              <div className="stat-val trend-down">-4.2%</div>
            </div>
          </div>

          <div className="mock-chart-area" id="mockChart">
            {bars.map((height, index) => (
              <div key={index} className="chart-bar" style={{ height: `${height}%` }} />
            ))}
          </div>

          <div className="mock-decision">
            <div className="decision-title">
              ! Market Correction Event
              <span className="decision-badge">Critical</span>
            </div>
            <p className="decision-copy">
              Stocks dropped 15%. Your portfolio is down Rs 12k. Do you panic sell or hold?
            </p>
            <div className="decision-actions">
              <button className="mock-btn secondary">Sell Assets</button>
              <button className="mock-btn primary">Hold and Buy Dip</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
