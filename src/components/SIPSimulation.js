import { useState } from "react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";


export default function SIPSimulation() {
  // Snapshot States

  const [mode, setMode] = useState("short");
  const [income, setIncome] = useState("");
  const [expenses, setExpenses] = useState("");
  const [snapshotDone, setSnapshotDone] = useState(false);

  // SIP States
  const [sip, setSip] = useState("");
  const [years, setYears] = useState("");
  const [risk, setRisk] = useState("moderate");

  // Results
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  // Snapshot Calculations
  const savings = income && expenses ? income - expenses : 0;
  const recommendedSip = savings > 0 ? Math.floor(savings * 0.4) : 0;
  const emergencyFund = expenses ? expenses * 6 : 0;

  const generateSnapshot = () => {
    if (!income || !expenses) {
      setError("Please enter income and expenses.");
      return;
    }

    if (income <= expenses) {
      setError("Expenses cannot be greater than income.");
      return;
    }

    setError("");
    setSnapshotDone(true);
  };

  const runSimulation = async () => {
    if (!sip || !years) {
      setError("Please enter SIP amount and duration.");
      return;
    }

    if (sip > savings) {
      setError("SIP cannot exceed your monthly savings.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/sipsimulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // body: JSON.stringify({
        //   sip: Number(sip),
        //   years: Number(years),
        //   riskLevel: risk,
        //   targetAmount: 0,
        //   inflationRate: 6,
        //   mode: mode,
        // }),

        body: JSON.stringify({
  sip: Number(sip),
  years: Number(years),
  riskLevel: risk,
  targetAmount: 0,
  inflationRate: 6,
  mode,
  monthlyIncome: income,
  monthlyExpenses: expenses
}),
      });

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError("Something went wrong. Try again.");
    }

    setLoading(false);
  };

  return (
    <section className="section reveal">
      <span className="eyebrow">Financial Learning</span>
      <h2 className="section-title">Snapshot & SIP Simulator</h2>

      {/* Snapshot Section */}
      <div className="sip-panel">
        <h3>Step 1: Financial Snapshot</h3>

        <div className="sip-field">
          <label>Monthly Income (₹)</label>
          <input
            type="number"
            value={income}
            onChange={(e) => setIncome(Number(e.target.value))}
          />
        </div>

        <div className="sip-field">
          <label>Monthly Expenses (₹)</label>
          <input
            type="number"
            value={expenses}
            onChange={(e) => setExpenses(Number(e.target.value))}
          />
        </div>

        <button className="primary-btn" onClick={generateSnapshot}>
          Generate Snapshot
        </button>

        {snapshotDone && (
          <div className="snapshot-results">
            <p>Monthly Savings: ₹{savings}</p>
            <p>Recommended SIP: ₹{recommendedSip}</p>
            <p>Emergency Fund Target: ₹{emergencyFund}</p>
          </div>
        )}
      </div>

      {/* SIP Simulation */}
      {snapshotDone && (
        <div className="sip-panel">
          <h3>Step 2: SIP Simulation</h3>

          <div className="sip-field">
            <label>Monthly SIP (₹)</label>
            <input
              type="number"
              value={sip}
              onChange={(e) => setSip(Number(e.target.value))}
            />
          </div>

          <div className="sip-field">
            <label>Investment Duration (Years)</label>
            <input
              type="number"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
            />
          </div>

          <div className="sip-field">
            <label>Risk Level</label>
            <select value={risk} onChange={(e) => setRisk(e.target.value)}>
              <option value="low">Low Risk</option>
              <option value="moderate">Moderate Risk</option>
              <option value="high">High Risk</option>
            </select>
          </div>

      <div className="sip-field">
       <label>Explanation Mode</label>
        <select value={mode} onChange={(e) => setMode(e.target.value)}>
         <option value="short">Quick Insight</option>
         <option value="detailed">Detailed Explanation</option>
       </select>
     </div>

          <button className="primary-btn" onClick={runSimulation}>
            Run Simulation
          </button>
        </div>
      )}

      {/* Error */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Loading */}
      {loading && <p>Running simulation...</p>}

      {/* Results */}
     {results && (
      
  <div className="sip-panel">
    <h3>Simulation Results</h3>

    {results.yearlyGrowth && (
  <div style={{ width: "100%", height: 300, marginBottom: "2rem" }}>
    <ResponsiveContainer>
      <LineChart data={results.yearlyGrowth}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" />
        <YAxis />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#00c6ff"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
)}

    <p>
      Total Investment: ₹{results.totalInvestment?.toLocaleString()}
    </p>

    <p>
      Average Outcome: ₹{results.averageValue?.toLocaleString()}
    </p>

    <p>
      Worst Case: ₹{results.worstCase?.toLocaleString()}
    </p>

    <p>
      Best Case: ₹{results.bestCase?.toLocaleString()}
    </p>

    <p>
      Inflation Adjusted Average: ₹{results.realAverageValue?.toLocaleString()}
    </p>

    {/* System Insight Cards */}
<div className="system-insights">

  <div className="insight-card">
    <h4>📈 Compounding Effect</h4>
    <p>
      You invested ₹{results.totalInvestment.toLocaleString()}.
      It grew to ₹{results.averageValue.toLocaleString()}.
      The extra ₹
      {(results.averageValue - results.totalInvestment).toLocaleString()}
      is generated through compounding over time.
    </p>
  </div>

  <div className="insight-card">
    <h4>⚠️ Risk Range</h4>
    <p>
      Your outcome could vary between ₹
      {results.worstCase.toLocaleString()} and ₹
      {results.bestCase.toLocaleString()}.
      This difference shows how volatility affects returns.
    </p>
  </div>

  <div className="insight-card">
    <h4>💰 Inflation Reality</h4>
    <p>
      After inflation, your average value feels like ₹
      {results.realAverageValue.toLocaleString()}
      in today’s purchasing power.
    </p>
  </div>

</div>

    {results.probabilityOfReachingTarget !== null && (
      <p>
        Probability of Success: {results.probabilityOfReachingTarget}%
      </p>
    )}

    <div className="ai-explanation">
  <h4>AI Insight</h4>

  {results.explanation.split("\n").map((line, index) =>
    line.trim() ? (
      <div key={index} className="detail-line">
        {line}
      </div>
    ) : null
  )}

</div>

  </div>
)}
    </section>
  );
}