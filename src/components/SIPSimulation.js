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
  const [age, setAge] = useState("");

  // Results
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  // Chat States
  const [question, setQuestion] = useState("");
  const [chatAnswer, setChatAnswer] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Snapshot Calculations
  const savings = income && expenses ? income - expenses : 0;

  let emergencyMonths = 6;
  let sipMinPercent = 0.3;
  let sipMaxPercent = 0.5;
  let recommendedProfile = "Moderate";

  if (age) {
    if (age < 30) {
      emergencyMonths = 6;
      sipMinPercent = 0.4;
      sipMaxPercent = 0.6;
      recommendedProfile = "Aggressive";
    } else if (age <= 45) {
      emergencyMonths = 6;
      sipMinPercent = 0.3;
      sipMaxPercent = 0.5;
      recommendedProfile = "Moderate";
    } else {
      emergencyMonths = 9;
      sipMinPercent = 0.2;
      sipMaxPercent = 0.35;
      recommendedProfile = "Conservative";
    }
  }

  const emergencyFund = expenses ? expenses * emergencyMonths : 0;
  const recommendedSipMin = savings > 0 ? Math.floor(savings * sipMinPercent) : 0;
  const recommendedSipMax = savings > 0 ? Math.floor(savings * sipMaxPercent) : 0;

  const generateSnapshot = () => {
    if (!age || !income || !expenses) {
      setError("Please enter age, income and expenses.");
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

        body: JSON.stringify({
          sip: Number(sip),
          years: Number(years),
          riskLevel: risk,
          targetAmount: 0,
          inflationRate: 6,
          mode,
          monthlyIncome: income,
          monthlyExpenses: expenses,
          age: age
        }),
      });

      const data = await response.json();
      setResults(data);

    } catch (err) {
      setError("Something went wrong. Try again.");
    }

    setLoading(false);
  };

  // Chat with AI
  const askAI = async () => {

    if (!question) return;

    setChatLoading(true);

    try {

      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question,
          context: {
            age,
            sip,
            years,
            risk,
            average: results.averageValue,
            worst: results.worstCase,
            best: results.bestCase
          }
        })
      });

      const data = await response.json();
      setChatAnswer(data.answer);

    } catch (err) {
      setChatAnswer("AI is currently unavailable.");
    }

    setChatLoading(false);
  };

  return (
    <section className="section reveal">

      <span className="eyebrow">Financial Learning</span>
      <h2 className="section-title">Snapshot & SIP Simulator</h2>

      {/* Snapshot Section */}

      <div className="sip-panel">

        <h3>Step 1: Financial Snapshot</h3>

        <div className="sip-field">
          <label>Current Age</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
          />
        </div>

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

            <p>
              Suggested SIP Range: ₹{recommendedSipMin} – ₹{recommendedSipMax}
            </p>

            <p>Emergency Fund Target: ₹{emergencyFund}</p>

            <p>Recommended Risk Profile: {recommendedProfile}</p>
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

            <select
              value={risk}
              onChange={(e) => setRisk(e.target.value)}
            >
              <option value="low">Low Risk</option>
              <option value="moderate">Moderate Risk</option>
              <option value="high">High Risk</option>
            </select>

          </div>

          <div className="sip-field">

            <label>Explanation Mode</label>

            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              <option value="short">Quick Insight</option>
              <option value="detailed">Detailed Explanation</option>
            </select>

          </div>

          <button
            className="primary-btn"
            onClick={runSimulation}
          >
            Run Simulation
          </button>

        </div>

      )}

      {error && <p style={{ color: "red" }}>{error}</p>}

      {loading && <p>Running simulation...</p>}

      {/* Results */}

      {results && (

        <div className="sip-panel">

          <h3>Simulation Results</h3>

          <div className="graph-container">

            <div className="graph-box">

              <h4>Expected Growth</h4>

              <ResponsiveContainer width="100%" height={250}>

                <LineChart data={results.yearlyAverage}>

                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="year" />

                  <YAxis />

                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={2}
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

            <div className="graph-box">

              <h4>Risk Spread (Best vs Worst)</h4>

              <ResponsiveContainer width="100%" height={250}>

                <LineChart>

                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="year" />

                  <YAxis />

                  <Tooltip />

                  <Line
                    data={results.yearlyWorst}
                    type="monotone"
                    dataKey="value"
                    stroke="#ef4444"
                  />

                  <Line
                    data={results.yearlyBest}
                    type="monotone"
                    dataKey="value"
                    stroke="#22c55e"
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

          </div>

          <p>Total Investment: ₹{results.totalInvestment?.toLocaleString()}</p>
          <p>Average Outcome: ₹{results.averageValue?.toLocaleString()}</p>
          <p>Worst Case: ₹{results.worstCase?.toLocaleString()}</p>
          <p>Best Case: ₹{results.bestCase?.toLocaleString()}</p>
          <p>Inflation Adjusted Average: ₹{results.realAverageValue?.toLocaleString()}</p>

          {results.probabilityOfReachingTarget !== null && (
            <p>Probability of Success: {results.probabilityOfReachingTarget}%</p>
          )}

          {/* AI Insight */}

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

          {/* Chat with AI */}

          <div className="ai-chat">

            <h4>Chat with AI</h4>

            <input
              type="text"
              placeholder="Ask about your investment plan..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />

            <button
              className="primary-btn"
              onClick={askAI}
            >
              Ask AI
            </button>

            {chatLoading && <p>Thinking...</p>}

            {chatAnswer && (
              <div className="chat-response">
                <p>{chatAnswer}</p>
              </div>
            )}

          </div>

        </div>

      )}

    </section>
  );
}