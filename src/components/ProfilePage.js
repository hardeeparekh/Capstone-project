import React, { useState, useMemo } from "react";
import "./ProfilePage.css";

export default function ProfilePage({ user, onLogout }) {
  const [isSyncing, setIsSyncing] = useState(false);

  const [formData, setFormData] = useState({
    age: 21,
    income: 75000,
    expenses: 30000,
    savings: 12000,
    strategy: "Moderate",
  });

  const metrics = useMemo(() => {
    const annualSavings = formData.income - formData.expenses;
    const ratio =
      formData.income > 0 ? (annualSavings / formData.income) * 100 : 0;
    return {
      savingsRate: Math.max(0, ratio).toFixed(1),
      netWorth: (Number(formData.savings) + annualSavings).toLocaleString(),
      burnRate: (formData.expenses / 12).toLocaleString(),
    };
  }, [formData]);

  const [sims] = useState([
    {
      id: 101,
      name: "Market Volatility",
      score: 95,
      status: "Optimal",
      date: "24 Feb",
    },
    {
      id: 102,
      name: "Real Estate Leverage",
      score: 88,
      status: "Stable",
      date: "18 Feb",
    },
    {
      id: 103,
      name: "Hyper-Inflation",
      score: 42,
      status: "Critical",
      date: "10 Feb",
    },
    {
      id: 104,
      name: "Crypto Arbitrage",
      score: 76,
      status: "Stable",
      date: "02 Feb",
    },
  ]);

  const stats = {
    level: 5,
    totalSims: sims.length,
    avgScore: 82,
    insight: "Growth Architect",
  };

  const handleUpdate = async () => {
    setIsSyncing(true);
    // prepared for sync with http://localhost:5000/api
    await new Promise((res) => setTimeout(res, 800));
    setIsSyncing(false);
  };

  return (
    <div className="profile-container reveal show">
      <header className="profile-header">
        <div className="profile-identity">
          <span className="eyebrow">WELCOME</span>
          <h2 className="section-title">{user?.name || "Operator-01"}</h2>
        </div>
        <div className="profile-badges">
          <div className="badge-item">
            <span>Level</span> 0{stats.level}
          </div>
          <div className="badge-item">
            <span>Avg Score</span> {stats.avgScore}
          </div>
        </div>
      </header>

      <div className="dashboard-grid">
        <section className="glass-panel main-config">
          <h3 className="panel-title">Baseline Parameters</h3>
          <div className="field-grid">
            <div className="input-box">
              <label>Age</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) =>
                  setFormData({ ...formData, age: e.target.value })
                }
              />
            </div>
            <div className="input-box">
              <label>Strategy</label>
              <select
                value={formData.strategy}
                onChange={(e) =>
                  setFormData({ ...formData, strategy: e.target.value })
                }
              >
                <option>Conservative</option>
                <option>Moderate</option>
                <option>Aggressive</option>
              </select>
            </div>
            <div className="input-box span-2">
              <label>Income</label>
              <input
                type="number"
                value={formData.income}
                onChange={(e) =>
                  setFormData({ ...formData, income: e.target.value })
                }
              />
            </div>
            <div className="input-box">
              <label>Expenses</label>
              <input
                type="number"
                value={formData.expenses}
                onChange={(e) =>
                  setFormData({ ...formData, expenses: e.target.value })
                }
              />
            </div>
            <div className="input-box">
              <label>Savings</label>
              <input
                type="number"
                value={formData.savings}
                onChange={(e) =>
                  setFormData({ ...formData, savings: e.target.value })
                }
              />
            </div>
          </div>

          <div className="efficiency-meter">
            <div className="meter-head">
              <span className="eyebrow">Savings Efficiency</span>
              <span className="meter-val">{metrics.savingsRate}%</span>
            </div>
            <div className="meter-track">
              <span
                className="meter-fill"
                style={{ width: `${metrics.savingsRate}%` }}
              ></span>
            </div>
          </div>

          <button
            className={`btn btn-primary shine ${isSyncing ? "loading" : ""}`}
            onClick={handleUpdate}
          >
            {isSyncing ? "Syncing core..." : "Update Baseline"}
          </button>
        </section>

        <aside className="profile-sidebar">
          <div className="intel-box">
            <div className="badge-ai">Neural Insight</div>
            <p className="insight-title">{stats.insight}</p>
            <p className="decision-copy">
              Projected annual balance: <strong>${metrics.netWorth}</strong>.
              Burn rate: <strong>${metrics.burnRate}/mo</strong>.
            </p>
          </div>

          <div className="archive-card">
            <div className="archive-header">
              <span className="eyebrow">Simulation Archives</span>
              <span className="sim-count">{stats.totalSims} Runs</span>
            </div>

            <div className="log-scroll">
              {sims.map((sim) => (
                <div className="log-row" key={sim.id}>
                  <div
                    className="log-indicator"
                    style={{
                      background:
                        sim.score > 90
                          ? "var(--accent-2)"
                          : sim.score > 70
                            ? "var(--accent)"
                            : "var(--danger)",
                    }}
                  >
                    {sim.score}
                  </div>
                  <div className="log-details">
                    <span className="log-name">{sim.name}</span>
                    <span className="log-meta">
                      {sim.status} • {sim.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-ghost full-vault-btn">
              Access Full Vault
            </button>
          </div>

          <div className="footer-actions">
            <button className="btn btn-ghost" onClick={onLogout}>
              Sign Out
            </button>
            <button className="btn btn-primary shine">New Simulation</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
