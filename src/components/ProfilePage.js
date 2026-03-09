import React, { useState, useEffect, useRef } from "react";
import Simulation from "./Simulation";
import DecisionSimulator from "./DecisionSimulator";
import "./ProfilePage.css";

const API_BASE = "http://localhost:5000/api";

function spawnConfetti(container) {
  if (!container) return;
  const colors = ["#ff5f2e", "#0e9f6e", "#ffd166", "#06d6a0", "#118ab2"];
  for (let i = 0; i < 48; i++) {
    const el = document.createElement("div");
    el.className = "confetti-piece";
    el.style.cssText = `
      left:${Math.random() * 100}%;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      width:${6 + Math.random() * 8}px;
      height:${6 + Math.random() * 8}px;
      border-radius:${Math.random() > 0.5 ? "50%" : "2px"};
      animation-delay:${Math.random() * 0.4}s;
      animation-duration:${0.9 + Math.random() * 0.7}s;
      transform:rotate(${Math.random() * 360}deg);
    `;
    container.appendChild(el);
    el.addEventListener("animationend", () => el.remove());
  }
}

function AnimatedNumber({ value, prefix = "₹", duration = 1000 }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    if (!value && value !== 0) return;
    cancelAnimationFrame(rafRef.current);
    const start = Date.now();
    const from = display;
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      setDisplay(Math.round(from + (value - from) * eased));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);

  return (
    <>
      {prefix}
      {display.toLocaleString("en-IN")}
    </>
  );
}

function DualInput({
  label,
  name,
  value,
  min,
  max,
  step = 1000,
  unit = "₹",
  tip,
  emoji,
  onChange,
}) {
  const [localText, setLocalText] = useState(String(value));
  const [focused, setFocused] = useState(false);
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  useEffect(() => {
    if (!focused) setLocalText(String(value));
  }, [value, focused]);

  const handleTextChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setLocalText(raw);
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num >= min && num <= max) onChange(name, num);
  };

  const handleBlur = () => {
    setFocused(false);
    const num = parseInt(localText, 10);
    if (isNaN(num) || num < min) {
      onChange(name, min);
      setLocalText(String(min));
    } else if (num > max) {
      onChange(name, max);
      setLocalText(String(max));
    } else {
      onChange(name, num);
      setLocalText(String(num));
    }
  };

  const isYears = unit === "";

  return (
    <div className={`dual-input ${focused ? "dual-input--focused" : ""}`}>
      <div className="di-head">
        <span className="di-label">
          {emoji && <span className="di-emoji">{emoji}</span>}
          {label}
        </span>
        {tip && (
          <span className="di-tip" title={tip}>
            ?
          </span>
        )}
        <div className="di-text-wrap">
          {unit && <span className="di-unit">{unit}</span>}
          <input
            className="di-text"
            type="text"
            inputMode="numeric"
            value={
              focused
                ? localText
                : isYears
                  ? `${value} yrs`
                  : value.toLocaleString("en-IN")
            }
            onFocus={() => {
              setFocused(true);
              setLocalText(String(value));
            }}
            onBlur={handleBlur}
            onChange={handleTextChange}
          />
        </div>
      </div>
      <div className="di-slider-wrap">
        <div className="di-track">
          <div className="di-fill" style={{ width: `${pct}%` }} />
          <div className="di-thumb" style={{ left: `${pct}%` }} />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            onChange(name, Number(e.target.value));
            setLocalText(String(e.target.value));
          }}
          className="di-range"
        />
      </div>
      <div className="di-bounds">
        <span>{isYears ? `${min} yr` : `₹${(min / 1000).toFixed(0)}K`}</span>
        <span>
          {isYears
            ? `${max} yr`
            : max >= 1000000
              ? `₹${(max / 100000).toFixed(0)}L`
              : `₹${(max / 1000).toFixed(0)}K`}
        </span>
      </div>
    </div>
  );
}

const RISK_PROFILES = [
  {
    id: "Conservative",
    emoji: "🛡️",
    title: "Protector",
    subtitle: "Low Risk",
    desc: "Sleep soundly. Slow & steady growth with minimal drama.",
    color: "#0e9f6e",
    returns: "7% avg",
    mood: "Calm",
  },
  {
    id: "Moderate",
    emoji: "⚖️",
    title: "Balancer",
    subtitle: "Medium Risk",
    desc: "Best of both worlds. Decent growth, manageable ups & downs.",
    color: "#f59e0b",
    returns: "12% avg",
    mood: "Steady",
  },
  {
    id: "Aggressive",
    emoji: "🚀",
    title: "Hunter",
    subtitle: "High Risk",
    desc: "Go big or go home. Max returns but buckle up for volatility.",
    color: "#ff5f2e",
    returns: "16% avg",
    mood: "Bold",
  },
];

function RiskSelector({ value, onChange }) {
  return (
    <div className="risk-selector">
      <div className="di-label" style={{ marginBottom: "0.6rem" }}>
        <span className="di-emoji">🎯</span> Risk Appetite
      </div>
      <div className="risk-cards">
        {RISK_PROFILES.map((p) => (
          <button
            key={p.id}
            className={`risk-card ${value === p.id ? "risk-card--active" : ""}`}
            style={{ "--rc": p.color }}
            onClick={() => onChange("strategy", p.id)}
          >
            <span className="rc-emoji">{p.emoji}</span>
            <span className="rc-title">{p.title}</span>
            <span className="rc-sub">{p.subtitle}</span>
            <span className="rc-desc">{p.desc}</span>
            <div className="rc-meta">
              <span className="rc-badge">{p.returns}</span>
              <span className="rc-mood">{p.mood}</span>
            </div>
            {value === p.id && <div className="rc-check">✓</div>}
          </button>
        ))}
      </div>
    </div>
  );
}

function CompoundVisualizer({ sip, years, strategy }) {
  const rateMap = { Conservative: 0.07, Moderate: 0.12, Aggressive: 0.16 };
  const rate = rateMap[strategy] || 0.12;

  const points = [];
  let portfolio = 0;
  let totalInvested = 0;
  for (let y = 0; y <= years; y++) {
    points.push({
      y,
      portfolio: Math.round(portfolio),
      invested: Math.round(totalInvested),
    });
    portfolio = (portfolio + sip * 12) * (1 + rate);
    totalInvested += sip * 12;
  }

  const maxVal = points[points.length - 1]?.portfolio || 1;
  const W = 300,
    H = 80;
  const toX = (i) => (i / years) * W;
  const toY = (v) => H - (v / maxVal) * H;

  const portfolioPath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${toX(p.y)},${toY(p.portfolio)}`)
    .join(" ");
  const investedPath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${toX(p.y)},${toY(p.invested)}`)
    .join(" ");
  const areaPath = portfolioPath + ` L${W},${H} L0,${H} Z`;

  const final = points[points.length - 1];
  const gain = final ? final.portfolio - final.invested : 0;

  return (
    <div className="cv-wrap">
      <div className="cv-head">
        <span className="di-label">
          <span className="di-emoji">📈</span> Wealth Projection
        </span>
        <div className="cv-legend">
          <span className="cv-dot" style={{ background: "var(--accent-2)" }} />{" "}
          Growth
          <span
            className="cv-dot"
            style={{ background: "var(--muted)", opacity: 0.5 }}
          />{" "}
          Invested
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="cv-svg"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="cvGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-2)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--accent-2)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#cvGrad)" />
        <path
          d={investedPath}
          fill="none"
          stroke="var(--muted)"
          strokeWidth="1.5"
          strokeOpacity="0.4"
          strokeDasharray="4 3"
        />
        <path
          d={portfolioPath}
          fill="none"
          stroke="var(--accent-2)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="cv-stats">
        <div className="cv-stat">
          <span>Final Corpus</span>
          <strong style={{ color: "var(--accent-2)" }}>
            ₹{(final?.portfolio || 0).toLocaleString("en-IN")}
          </strong>
        </div>
        <div className="cv-stat">
          <span>Total Invested</span>
          <strong>₹{(final?.invested || 0).toLocaleString("en-IN")}</strong>
        </div>
        <div className="cv-stat">
          <span>Wealth Gain</span>
          <strong style={{ color: "var(--accent)" }}>
            ₹{gain.toLocaleString("en-IN")}
          </strong>
        </div>
      </div>
    </div>
  );
}

function Achievement({ icon, label, unlocked }) {
  return (
    <div
      className={`achievement ${unlocked ? "achievement--on" : ""}`}
      title={label}
    >
      <span className="ach-icon">{icon}</span>
      <span className="ach-label">{label}</span>
    </div>
  );
}
function ScoreRing({ score }) {
  const r = 36,
    circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 75 ? "#0e9f6e" : score >= 50 ? "#f59e0b" : "#ff5f2e";
  const label =
    score >= 75
      ? "Excellent"
      : score >= 50
        ? "Good"
        : score >= 25
          ? "Fair"
          : "Start!";
  return (
    <div className="score-ring">
      <svg viewBox="0 0 88 88" width="88" height="88">
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke="rgba(16,36,27,0.08)"
          strokeWidth="7"
        />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 44 44)"
          style={{
            transition: "stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)",
          }}
        />
      </svg>
      <div className="sr-inner">
        <span className="sr-num" style={{ color }}>
          {score}
        </span>
        <span className="sr-label">{label}</span>
      </div>
    </div>
  );
}

function TickerTape({ items }) {
  return (
    <div className="ticker-wrap">
      <div className="ticker-inner">
        {[...items, ...items].map((item, i) => (
          <span
            key={i}
            className={`ticker-item ${item.up ? "ticker-up" : "ticker-down"}`}
          >
            {item.label} <strong>{item.val}</strong>
            <span className="ticker-arrow">{item.up ? "▲" : "▼"}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ProfilePage({ user, onLogout }) {
  const confettiRef = useRef(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeSimResult, setActiveSimResult] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [step, setStep] = useState(0);
  const [simHistory, setSimHistory] = useState([]);
  const [financialScore, setFinancialScore] = useState(0);
  const [pulseCard, setPulseCard] = useState(null);

  const [snapshot, setSnapshot] = useState({
    emergencyFund: 0,
    monthlySavings: 0,
    suggestedSIPRange: { min: 0, max: 0 },
    hasData: false,
  });

  const [form, setForm] = useState({
    age: 24,
    income: 80000,
    expenses: 32000,
    savings: 15000,
    strategy: "Moderate",
    targetGoal: 2500000,
    sipYears: 15,
  });

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  // Live computed values
  const surplus = Math.max(0, form.income - form.expenses);
  const savingsRate =
    form.income > 0 ? Math.round((surplus / form.income) * 100) : 0;
  const suggestedSIP = snapshot.hasData
    ? snapshot.suggestedSIPRange.min
    : Math.round(surplus * 0.3);

  // Financial health score
  useEffect(() => {
    let s = 0;
    if (savingsRate >= 30) s += 35;
    else if (savingsRate >= 15) s += 20;
    else s += 5;
    if (form.age < 30) s += 20;
    else if (form.age < 40) s += 12;
    else s += 5;
    if (form.sipYears >= 15) s += 25;
    else if (form.sipYears >= 10) s += 15;
    else s += 5;
    if (form.targetGoal >= 1000000) s += 20;
    setFinancialScore(Math.min(100, s));
  }, [form, savingsRate]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const syncSnapshot = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch(`${API_BASE}/snapshot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setSnapshot({ ...data, hasData: true });
        setStep((s) => Math.max(s, 1));
        setPulseCard("snapshot");
        setTimeout(() => setPulseCard(null), 1000);
        spawnConfetti(confettiRef.current);
        showToast("🎉 Snapshot calibrated!");
      } else {
        showToast(data.error || "Calibration failed", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const runSimulation = async () => {
    setIsSimulating(true);
    const riskMap = {
      Conservative: "low",
      Moderate: "moderate",
      Aggressive: "high",
    };
    try {
      const res = await fetch(`${API_BASE}/sipsimulation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sip: suggestedSIP,
          years: form.sipYears,
          riskLevel: riskMap[form.strategy],
          targetAmount: form.targetGoal,
          inflationRate: 6,
        }),
      });
      const result = await res.json();
      if (res.ok) {
        setActiveSimResult(result);
        setStep((s) => Math.max(s, 2));
        setSimHistory((p) => [
          {
            ...result,
            strategy: form.strategy,
            ts: new Date().toLocaleTimeString(),
            years: form.sipYears,
          },
          ...p.slice(0, 4),
        ]);
        setShowModal(true);
        if (result.probabilityOfReachingTarget >= 70)
          spawnConfetti(confettiRef.current);
        showToast(
          `✓ ${result.probabilityOfReachingTarget}% chance of hitting your goal`,
        );
      } else {
        showToast(result.error || "Simulation failed", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setIsSimulating(false);
    }
  };

  const tickerItems = [
    {
      label: "Your SIP",
      val: `₹${suggestedSIP.toLocaleString("en-IN")}`,
      up: true,
    },
    { label: "Savings Rate", val: `${savingsRate}%`, up: savingsRate >= 20 },
    { label: "Horizon", val: `${form.sipYears}Y`, up: form.sipYears >= 10 },
    {
      label: "Target",
      val: `₹${(form.targetGoal / 100000).toFixed(1)}L`,
      up: true,
    },
    { label: "Strategy", val: form.strategy, up: true },
    {
      label: "Health Score",
      val: `${financialScore}/100`,
      up: financialScore >= 50,
    },
  ];

  const riskProfile = RISK_PROFILES.find((r) => r.id === form.strategy);

  const achievements = [
    { icon: "🌱", label: "First Sync", unlocked: step >= 1 },
    { icon: "🎯", label: "Goal Set", unlocked: form.targetGoal >= 1000000 },
    { icon: "⚡", label: "Simulator", unlocked: step >= 2 },
    { icon: "💎", label: "20%+ Saved", unlocked: savingsRate >= 20 },
    {
      icon: "🏆",
      label: "70%+ Odds",
      unlocked: activeSimResult?.probabilityOfReachingTarget >= 70,
    },
    { icon: "🚀", label: "10+ Years", unlocked: form.sipYears >= 10 },
  ];

  const handleDecisionComplete = () => {
    setStep((s) => Math.max(s, 3));
    showToast("Decision simulator completed.");
  };

  return (
    <div className="pp-root">
      <div className="confetti-layer" ref={confettiRef} />

      {toast && (
        <div className={`pp-toast pp-toast--${toast.type}`}>
          <span className="toast-dot" />
          {toast.msg}
        </div>
      )}

      <header className="pp-header">
        <div className="pp-header-left">
          <div className="pp-avatar">
            {(user?.name || "O")[0].toUpperCase()}
            <div className="avatar-ring" />
          </div>
          <div className="pp-identity">
            <span className="eyebrow">COMMANDER</span>
            <h1 className="pp-username">{user?.name || "Operator-01"}</h1>
            <div className="pp-badges">
              <span
                className="pp-badge pp-badge--strategy"
                style={{ "--rc": riskProfile?.color }}
              >
                {riskProfile?.emoji} {riskProfile?.title}
              </span>
              <span
                className="pp-badge"
                style={{
                  background:
                    savingsRate >= 30
                      ? "rgba(14,159,110,0.12)"
                      : "rgba(255,95,46,0.1)",
                  color:
                    savingsRate >= 30 ? "var(--accent-2)" : "var(--accent)",
                  borderColor:
                    savingsRate >= 30
                      ? "rgba(14,159,110,0.25)"
                      : "rgba(255,95,46,0.2)",
                }}
              >
                💰 {savingsRate}% saved
              </span>
            </div>
          </div>
        </div>

        <div className="pp-header-right">
          <ScoreRing score={financialScore} />
          <div className="achievements-row">
            {achievements.map((a, i) => (
              <Achievement key={i} {...a} />
            ))}
          </div>
          <button className="btn btn-ghost pp-logout" onClick={onLogout}>
            LOGOUT_
          </button>
        </div>
      </header>

      <TickerTape items={tickerItems} />

      {/* Progress steps  */}
      <div className="pp-steps">
        {[
          { label: "Calibrate", sub: "Set your profile", icon: "📊" },
          { label: "Simulate", sub: "Monte Carlo", icon: "🎲" },
          { label: "Decide", sub: "Decision game", icon: "🧠" },
        ].map((s, i) => (
          <div
            key={i}
            className={`pp-step ${step > i ? "done" : step === i ? "active" : ""} ${i === 2 && step < 2 ? "locked" : ""}`}
          >
            <div className="step-bubble">
              <span className="step-icon">{s.icon}</span>
              {step > i && <div className="step-check">✓</div>}
            </div>
            <div className="step-text">
              <span className="step-name">{s.label}</span>
              <span className="step-sub">{s.sub}</span>
            </div>
            {i < 2 && (
              <div className="step-line">
                <div
                  className="step-line-fill"
                  style={{ width: step > i ? "100%" : "0%" }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="pp-grid">
        {/* Calibration  */}
        <section className="glass-panel pp-panel calibration-panel">
          <div className="panel-head">
            <div className="brand-mark">📊</div>
            <div>
              <h3 className="panel-title">Core Calibration</h3>
              <p className="panel-sub">Your financial fingerprint</p>
            </div>
          </div>

          <div className="field-group">
            <div className="age-row">
              <span className="di-label">
                <span className="di-emoji"></span> Age
              </span>
              <div className="age-btns">
                <button
                  className="age-btn"
                  onClick={() => set("age", Math.max(18, form.age - 1))}
                >
                  −
                </button>
                <input
                  className="age-input"
                  type="number"
                  value={form.age}
                  min={18}
                  max={70}
                  onChange={(e) =>
                    set(
                      "age",
                      Math.max(18, Math.min(70, Number(e.target.value))),
                    )
                  }
                />
                <button
                  className="age-btn"
                  onClick={() => set("age", Math.min(70, form.age + 1))}
                >
                  +
                </button>
              </div>
              <span className="age-note">
                {form.age < 25
                  ? "Early bird advantage!"
                  : form.age < 35
                    ? "Prime time"
                    : form.age < 45
                      ? "⏳ Act now"
                      : "🏁 Every year counts"}
              </span>
            </div>

            <RiskSelector value={form.strategy} onChange={set} />

            <DualInput
              label="Monthly Income"
              name="income"
              value={form.income}
              min={10000}
              max={500000}
              step={5000}
              emoji="💼"
              tip="Your gross monthly take-home salary"
              onChange={set}
            />

            <DualInput
              label="Monthly Expenses"
              name="expenses"
              value={form.expenses}
              min={5000}
              max={form.income - 1000}
              step={1000}
              emoji="🛒"
              tip="All fixed + variable monthly costs"
              onChange={set}
            />

            <DualInput
              label="Target Corpus"
              name="targetGoal"
              value={form.targetGoal}
              min={100000}
              max={50000000}
              step={100000}
              emoji="🎯"
              tip="The wealth amount you want to reach"
              onChange={set}
            />

            <DualInput
              label="Investment Horizon"
              name="sipYears"
              value={form.sipYears}
              min={3}
              max={30}
              step={1}
              unit=""
              emoji="⏳"
              tip="How many years you plan to invest"
              onChange={set}
            />

            {/* Live surplus pill */}
            <div className="surplus-pill">
              <div className="surplus-left">
                <span className="surplus-label">MONTHLY SURPLUS</span>
                <span
                  className="surplus-val"
                  style={{
                    color: surplus > 0 ? "var(--accent-2)" : "var(--danger)",
                  }}
                >
                  ₹{surplus.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="surplus-bar">
                <div
                  className="surplus-fill"
                  style={{ width: `${Math.min(100, savingsRate * 2.5)}%` }}
                />
              </div>
              <span className="surplus-rate">{savingsRate}%</span>
            </div>
          </div>

          <button
            className={`btn btn-primary shine full-w mt-top ${isSyncing ? "loading" : ""}`}
            onClick={syncSnapshot}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <>
                <span className="spin" />
                CALIBRATING...
              </>
            ) : (
              <>
                <span>⟳</span> SYNC SNAPSHOT
              </>
            )}
          </button>
        </section>

        {/*snapshot + Monte Carlo */}
        <div className="pp-col-mid">
          <div className="glass-panel">
            <CompoundVisualizer
              sip={suggestedSIP}
              years={form.sipYears}
              strategy={form.strategy}
            />
          </div>

          <div className="snapshot-cards">
            <div
              className={`snap-card ${pulseCard === "snapshot" ? "snap-card--pulse" : ""}`}
            >
              <span className="snap-tag">💰 MONTHLY SURPLUS</span>
              <div className="snap-big">
                {snapshot.hasData ? (
                  <AnimatedNumber value={snapshot.monthlySavings} />
                ) : (
                  <span className="snap-na">Sync first</span>
                )}
              </div>
              <p className="snap-desc">Your investable cash each month</p>
            </div>

            <div
              className={`snap-card snap-card--green ${pulseCard === "snapshot" ? "snap-card--pulse" : ""}`}
            >
              <span className="snap-tag">🛡️ EMERGENCY BUFFER</span>
              <div className="snap-big">
                {snapshot.hasData ? (
                  <AnimatedNumber value={snapshot.emergencyFund} />
                ) : (
                  <span className="snap-na">Sync first</span>
                )}
              </div>
              <p className="snap-desc">6× burn rate — your safety net</p>
            </div>

            <div
              className={`snap-card snap-card--wide snap-card--sip ${pulseCard === "snapshot" ? "snap-card--pulse" : ""}`}
            >
              <span className="snap-tag">📈 SUGGESTED SIP RANGE</span>
              <div className="sip-range-row">
                <div className="sip-block">
                  <span className="sip-lbl">MINIMUM</span>
                  <span className="sip-amount">
                    {snapshot.hasData ? (
                      <AnimatedNumber value={snapshot.suggestedSIPRange.min} />
                    ) : (
                      "—"
                    )}
                  </span>
                </div>
                <div className="sip-arrow">→</div>
                <div className="sip-block">
                  <span className="sip-lbl">MAXIMUM</span>
                  <span className="sip-amount sip-amount--hi">
                    {snapshot.hasData ? (
                      <AnimatedNumber value={snapshot.suggestedSIPRange.max} />
                    ) : (
                      "—"
                    )}
                  </span>
                </div>
                {snapshot.hasData && (
                  <div className="sip-pill">
                    {Math.round(
                      (snapshot.suggestedSIPRange.min / form.income) * 100,
                    )}
                    % of income
                  </div>
                )}
              </div>
              <p className="snap-desc">Optimal range: 30–50% of surplus</p>
            </div>
          </div>

          {/* Monte Carlo */}
          <div className="glass-panel mc-panel">
            <div className="mc-top">
              <div>
                <div className="panel-head">
                  <div
                    className="brand-mark"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--accent-2), #06d6a0)",
                    }}
                  >
                    🎲
                  </div>
                  <div>
                    <h3 className="panel-title">Monte Carlo Engine</h3>
                    <p className="panel-sub">
                      500 stochastic futures · inflation adjusted
                    </p>
                  </div>
                </div>
              </div>
              {activeSimResult && (
                <div
                  className="prob-chip"
                  style={{
                    background:
                      activeSimResult.probabilityOfReachingTarget >= 60
                        ? "rgba(14,159,110,0.12)"
                        : "rgba(255,95,46,0.1)",
                  }}
                >
                  <span
                    className="prob-num"
                    style={{
                      color:
                        activeSimResult.probabilityOfReachingTarget >= 60
                          ? "var(--accent-2)"
                          : "var(--accent)",
                    }}
                  >
                    {activeSimResult.probabilityOfReachingTarget}%
                  </span>
                  <span className="prob-lbl">success odds</span>
                </div>
              )}
            </div>

            {activeSimResult ? (
              <div className="mc-results">
                <div className="mc-bar-group">
                  {[
                    {
                      l: "Worst",
                      v: activeSimResult.realWorstCase,
                      c: "var(--danger)",
                      pct: 20,
                    },
                    {
                      l: "Expected",
                      v: activeSimResult.realAverageValue,
                      c: "var(--accent)",
                      pct: 60,
                    },
                    {
                      l: "Best",
                      v: activeSimResult.realBestCase,
                      c: "var(--accent-2)",
                      pct: 100,
                    },
                  ].map((item) => (
                    <div key={item.l} className="mc-bar-row">
                      <span className="mc-bar-label">{item.l}</span>
                      <div className="mc-bar-track">
                        <div
                          className="mc-bar-fill"
                          style={{ width: `${item.pct}%`, background: item.c }}
                        />
                      </div>
                      <span className="mc-bar-val" style={{ color: item.c }}>
                        ₹{item.v?.toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowModal(true)}
                >
                  View Full Report →
                </button>
              </div>
            ) : (
              <div className="mc-idle">
                <div className="mc-dice">🎲</div>
                <p>
                  Run 500 simulations to see your probability of hitting ₹
                  {(form.targetGoal / 100000).toFixed(1)}L
                </p>
              </div>
            )}

            <button
              className={`btn btn-primary shine full-w ${isSimulating ? "loading" : ""}`}
              onClick={runSimulation}
              disabled={!snapshot.hasData || isSimulating}
            >
              {isSimulating ? (
                <>
                  <span className="spin" />
                  SIMULATING 500 FUTURES...
                </>
              ) : (
                "▶  LAUNCH SIMULATION"
              )}
            </button>

            {!snapshot.hasData && (
              <div className="mc-gate">
                ⚠ Sync your snapshot first to unlock the engine
              </div>
            )}
          </div>
        </div>

        {/* Feature 3 + History  */}
        <div className="pp-col-right">
          <DecisionSimulator
            defaults={{
              income: form.income,
              expenses: form.expenses,
              savings: form.savings,
            }}
            onComplete={handleDecisionComplete}
          />

          {/* Simulation history */}
          {simHistory.length > 0 && (
            <div className="glass-panel history-panel">
              <h3
                className="panel-title"
                style={{ fontSize: "0.9rem", marginBottom: "0.75rem" }}
              >
                Run History
              </h3>
              {simHistory.map((r, i) => (
                <div key={i} className="history-row">
                  <div className="hist-top">
                    <span className="hist-strat">
                      {RISK_PROFILES.find((p) => p.id === r.strategy)?.emoji}{" "}
                      {r.strategy} · {r.years}yr
                    </span>
                    <span className="hist-time">{r.ts}</span>
                  </div>
                  <div className="hist-vals">
                    <span className="hv hv--bad">
                      ₹{r.realWorstCase?.toLocaleString("en-IN")}
                    </span>
                    <span className="hv hv--mid">
                      ₹{r.realAverageValue?.toLocaleString("en-IN")}
                    </span>
                    <span className="hv hv--good">
                      ₹{r.realBestCase?.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div
                    className={`hist-prob-bar ${r.probabilityOfReachingTarget >= 60 ? "good" : "warn"}`}
                  >
                    <div
                      style={{ width: `${r.probabilityOfReachingTarget}%` }}
                    />
                    <span>{r.probabilityOfReachingTarget}% odds</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="glass-panel tip-card">
            <div className="tip-emoji">💡</div>
            <div className="tip-content">
              <strong>WorthWise Tip</strong>
              <p>
                {savingsRate < 15
                  ? "Aim to save at least 20% of your income — even ₹2,000/month extra makes a huge difference over 15 years."
                  : savingsRate < 30
                    ? "You're doing well! Pushing savings to 30% could add lakhs to your final corpus."
                    : "Excellent savings rate! Consistency is your superpower — don't stop now."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {showModal && activeSimResult && (
        <Simulation
          result={activeSimResult}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

