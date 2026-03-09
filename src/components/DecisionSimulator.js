import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

const API_BASE = "http://localhost:5000/api/decision-simulator";

const LEVEL_OPTIONS = [
  {
    id: "Explorer",
    title: "Explorer",
    subtitle: "Easy",
    description: "Stable markets and lower volatility."
  },
  {
    id: "Analyst",
    title: "Analyst",
    subtitle: "Normal",
    description: "Balanced market cycles with occasional shocks."
  },
  {
    id: "Strategist",
    title: "Strategist",
    subtitle: "Hard",
    description: "High volatility and inflation pressure."
  }
];

function formatInr(value) {
  return `Rs ${Math.round(value || 0).toLocaleString("en-IN")}`;
}

export default function DecisionSimulator({ defaults, onComplete }) {
  const initialValues = useMemo(
    () => ({
      salary: Math.max(120000, Math.round((defaults?.income || 80000) * 12)),
      expenses: Math.max(60000, Math.round((defaults?.expenses || 32000) * 12)),
      initialSavings: Math.max(
        0,
        Math.round((defaults?.savings || 15000) * 12)
      )
    }),
    [defaults]
  );

  const [isOpen, setIsOpen] = useState(false);
  const [phase, setPhase] = useState("setup");
  const [level, setLevel] = useState("Analyst");
  const [salary, setSalary] = useState(initialValues.salary);
  const [expenses, setExpenses] = useState(initialValues.expenses);
  const [initialSavings, setInitialSavings] = useState(initialValues.initialSavings);

  const [sessionId, setSessionId] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [lastMarket, setLastMarket] = useState(null);
  const [result, setResult] = useState(null);

  const [allocationPct, setAllocationPct] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (phase === "setup" && !isOpen) {
      setSalary(initialValues.salary);
      setExpenses(initialValues.expenses);
      setInitialSavings(initialValues.initialSavings);
    }
  }, [initialValues, phase, isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape" && !loading) {
        setIsOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, loading]);

  const progress = gameState
    ? ((gameState.year - 1) / Math.max(1, gameState.maxYears)) * 100
    : 0;

  const projectedInvestAmount = gameState
    ? Math.round(gameState.cash * (allocationPct / 100))
    : 0;

  const projectedWithdrawAmount = gameState
    ? Math.round(gameState.portfolio * (allocationPct / 100))
    : 0;

  const openModal = () => {
    setError("");
    setIsOpen(true);
  };

  const closeModal = () => {
    if (loading) return;
    setIsOpen(false);
  };

  const resetRun = () => {
    setPhase("setup");
    setSessionId(null);
    setGameState(null);
    setLastMarket(null);
    setResult(null);
    setAllocationPct(50);
    setError("");
  };

  const startGame = async () => {
    setError("");

    if (salary <= 0 || expenses < 0 || expenses >= salary) {
      setError("Salary must be greater than expenses to run Feature 2.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level,
          salary: Number(salary),
          expenses: Number(expenses),
          initialSavings: Number(initialSavings)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Could not start simulator.");
        return;
      }

      setSessionId(data.sessionId);
      setGameState(data.state);
      setLastMarket(null);
      setResult(null);
      setAllocationPct(50);
      setPhase("playing");
    } catch (networkError) {
      setError("Network error while starting simulator.");
    } finally {
      setLoading(false);
    }
  };

  const playTurn = async (action) => {
    if (!sessionId || !gameState) return;

    const amount =
      action === "invest"
        ? projectedInvestAmount
        : action === "withdraw"
          ? projectedWithdrawAmount
          : 0;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/play-year`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          action,
          amount
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Could not play this year.");
        return;
      }

      if (data.finished) {
        setResult(data.reflection);
        setPhase("finished");
        if (onComplete) onComplete(data.reflection);
      } else {
        setGameState(data.state);
        setLastMarket(data.market);
        setAllocationPct(50);
      }
    } catch (networkError) {
      setError("Network error while playing this turn.");
    } finally {
      setLoading(false);
    }
  };

  const modalNode =
    isOpen && typeof document !== "undefined"
      ? createPortal(
          <div className="decision-overlay" onClick={closeModal}>
            <div
              className="glass-panel decision-modal decision-dialog"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="modal-header-simple">
                <div>
                  <h3 className="panel-title">Feature 2: Decision Simulator</h3>
                  <p className="panel-sub">Year-by-year choices with market shocks</p>
                </div>
                <button className="btn-close" onClick={closeModal} disabled={loading}>
                  x
                </button>
              </div>

              {phase === "setup" && (
                <div className="decision-setup">
                  <div className="decision-level-grid">
                    {LEVEL_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        className={`decision-level ${level === option.id ? "active" : ""}`}
                        onClick={() => setLevel(option.id)}
                      >
                        <span className="decision-level-title">{option.title}</span>
                        <span className="decision-level-sub">{option.subtitle}</span>
                        <span className="decision-level-desc">{option.description}</span>
                      </button>
                    ))}
                  </div>

                  <div className="decision-input-grid">
                    <label className="decision-field">
                      Annual Salary
                      <input
                        type="number"
                        min={0}
                        value={salary}
                        onChange={(event) => setSalary(Number(event.target.value))}
                      />
                    </label>
                    <label className="decision-field">
                      Annual Expenses
                      <input
                        type="number"
                        min={0}
                        value={expenses}
                        onChange={(event) => setExpenses(Number(event.target.value))}
                      />
                    </label>
                    <label className="decision-field decision-field--wide">
                      Initial Invested Savings
                      <input
                        type="number"
                        min={0}
                        value={initialSavings}
                        onChange={(event) => setInitialSavings(Number(event.target.value))}
                      />
                    </label>
                  </div>

                  {error && <div className="decision-error">{error}</div>}

                  <button
                    className={`btn btn-primary full-w ${loading ? "loading" : ""}`}
                    onClick={startGame}
                    disabled={loading}
                  >
                    {loading ? "Starting..." : "Start Scenario"}
                  </button>
                </div>
              )}

              {phase === "playing" && gameState && (
                <div className="decision-playing">
                  <div className="decision-year-row">
                    <div>
                      <span className="decision-result-label">
                        Year {gameState.year} / {gameState.maxYears}
                      </span>
                      <strong className="decision-year-title">Decision Window</strong>
                    </div>
                    {lastMarket && (
                      <div className="decision-market-chip">
                        <span>{lastMarket.event}</span>
                        <span>{lastMarket.return}</span>
                        <span>Inflation {lastMarket.inflation}</span>
                      </div>
                    )}
                  </div>

                  <div className="decision-progress-track">
                    <div
                      className="decision-progress-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="decision-metrics">
                    <div className="decision-metric-card">
                      <span>Portfolio</span>
                      <strong>{formatInr(gameState.portfolio)}</strong>
                    </div>
                    <div className="decision-metric-card">
                      <span>Cash</span>
                      <strong>{formatInr(gameState.cash)}</strong>
                    </div>
                    <div className="decision-metric-card">
                      <span>Surplus</span>
                      <strong>{formatInr(gameState.surplus)}</strong>
                    </div>
                  </div>

                  <div className="decision-slider-wrap">
                    <label>Allocation this year: {allocationPct}%</label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={allocationPct}
                      onChange={(event) => setAllocationPct(Number(event.target.value))}
                    />
                  </div>

                  <div className="decision-sim-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => playTurn("invest")}
                      disabled={loading}
                    >
                      Invest {formatInr(projectedInvestAmount)}
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => playTurn("hold")}
                      disabled={loading}
                    >
                      Hold
                    </button>
                    <button
                      className="btn decision-btn-warn"
                      onClick={() => playTurn("withdraw")}
                      disabled={loading}
                    >
                      Withdraw {formatInr(projectedWithdrawAmount)}
                    </button>
                  </div>

                  {error && <div className="decision-error">{error}</div>}
                </div>
              )}

              {phase === "finished" && result && (
                <div className="decision-finished">
                  <div className="decision-finished-grid">
                    <div className="decision-finished-card">
                      <span>Your Net Worth</span>
                      <strong>{formatInr(result.finalUser)}</strong>
                    </div>
                    <div className="decision-finished-card">
                      <span>Baseline</span>
                      <strong>{formatInr(result.finalOptimal)}</strong>
                    </div>
                    <div className="decision-finished-card">
                      <span>Difference</span>
                      <strong
                        className={
                          result.difference >= 0
                            ? "decision-diff decision-diff--good"
                            : "decision-diff decision-diff--warn"
                        }
                      >
                        {result.difference >= 0 ? "+" : ""}
                        {formatInr(result.difference)}
                      </strong>
                    </div>
                  </div>

                  <div className="decision-message">{result.message}</div>

                  <div className="decision-finished-actions">
                    <button className="btn btn-primary" onClick={resetRun}>
                      Run Again
                    </button>
                    <button className="btn btn-ghost" onClick={closeModal}>
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div className="glass-panel decision-panel">
      <div className="decision-panel-head">
        <div>
          <div className="decision-eyebrow">FEATURE 2</div>
          <h3 className="panel-title">Decision Simulator</h3>
          <p className="panel-sub">
            Play a 15-year market journey and compare your decisions to a baseline.
          </p>
        </div>
        <span className="decision-chip">{level}</span>
      </div>

      {result && (
        <div className="decision-last-result">
          <div>
            <span className="decision-result-label">Last Net Worth</span>
            <strong>{formatInr(result.finalUser)}</strong>
          </div>
          <div>
            <span className="decision-result-label">Baseline</span>
            <strong>{formatInr(result.finalOptimal)}</strong>
          </div>
          <div>
            <span className="decision-result-label">Difference</span>
            <strong
              className={
                result.difference >= 0
                  ? "decision-diff decision-diff--good"
                  : "decision-diff decision-diff--warn"
              }
            >
              {result.difference >= 0 ? "+" : ""}
              {formatInr(result.difference)}
            </strong>
          </div>
        </div>
      )}

      <button className="btn btn-primary full-w" onClick={openModal}>
        {phase === "playing" ? "Resume Scenario" : "Launch Feature 2"}
      </button>

      {modalNode}
    </div>
  );
}
