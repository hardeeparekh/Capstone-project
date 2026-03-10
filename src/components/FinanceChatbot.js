import { useState, useRef, useEffect, useCallback } from "react";

const API_BASE = "http://localhost:5000/api";

const CATEGORIES = [
  {
    id: "sip",
    label: "SIP & MF",
    icon: "📈",
    questions: [
      "What SIP amount should I start with?",
      "Which type of mutual fund suits my strategy?",
      "SIP vs lump sum — which is better for me?",
      "What is expense ratio and how does it affect returns?",
    ],
  },
  {
    id: "tax",
    label: "Tax Saving",
    icon: "🧾",
    questions: [
      "Best tax-saving options under Section 80C",
      "ELSS vs PPF vs NPS — which should I pick?",
      "How much tax will I save with my current income?",
      "What is the new tax regime vs old regime?",
    ],
  },
  {
    id: "budget",
    label: "Budgeting",
    icon: "💰",
    questions: [
      "How should I allocate my monthly surplus?",
      "What is the 50-30-20 rule?",
      "How much emergency fund do I need?",
      "Am I spending too much given my income?",
    ],
  },
  {
    id: "goals",
    label: "Goals",
    icon: "🎯",
    questions: [
      "Can I realistically hit my target corpus?",
      "How to plan for a house down payment?",
      "Best strategy to retire early in India?",
      "How much should I invest monthly for my goal?",
    ],
  },
  {
    id: "market",
    label: "Markets",
    icon: "🏦",
    questions: [
      "How does RBI repo rate affect my investments?",
      "What happens to my SIP during a market crash?",
      "Nifty50 index fund vs actively managed fund?",
      "What is rebalancing and should I do it?",
    ],
  },
];

function buildSystemPrompt(ctx) {
  const surplus = ctx
    ? Math.max(0, (ctx.income || 0) - (ctx.expenses || 0))
    : 0;
  const sipSuggested = Math.round(surplus * 0.3);

  const profile = ctx
    ? `== USER'S LIVE FINANCIAL PROFILE ==
• Age: ${ctx.age} years old
• Monthly income: ₹${ctx.income?.toLocaleString("en-IN")}
• Monthly expenses: ₹${ctx.expenses?.toLocaleString("en-IN")}
• Monthly surplus: ₹${surplus.toLocaleString("en-IN")} (${ctx.income > 0 ? Math.round((surplus / ctx.income) * 100) : 0}% savings rate)
• Suggested SIP: ~₹${sipSuggested.toLocaleString("en-IN")}/month (30% of surplus)
• Risk appetite: ${ctx.strategy}
• Target corpus: ₹${ctx.targetGoal?.toLocaleString("en-IN")}
• Investment horizon: ${ctx.sipYears} years
• Time to target: ${ctx.sipYears} years remaining

IMPORTANT: Always reference the user's actual numbers above when answering. Don't use generic examples when you have their real data.`
    : "== USER PROFILE == Not set up yet. Encourage calibrating their snapshot in the dashboard for personalised advice.";

  return `You are WorthBot — a sharp, warm, and highly knowledgeable Indian personal finance advisor embedded in WorthWise, a financial planning app.

${profile}

== YOUR PERSONALITY ==
- Direct and confident, never wishy-washy
- Use the user's real numbers to make advice concrete and personal
- Brief but complete — no padding, no unnecessary caveats
- Encouraging without being fake
- Use ₹, Indian number formatting (lakhs/crores), Indian financial products

== RESPONSE FORMAT ==
- 2-4 short paragraphs OR a brief intro + bullet list (max 5 bullets)
- Use **bold** for key numbers and important terms
- Use bullet points starting with "- " for lists
- End EVERY response with a "💡 **Quick action:**" line — one concrete next step the user can take TODAY
- Keep total response under 250 words

== SCOPE ==
Answer ONLY personal finance questions: investing, SIP, mutual funds, budgeting, emergency funds, taxes (Indian), insurance, retirement planning, real estate basics, Indian markets (Nifty, Sensex, SEBI regulations), debt management, credit scores.

For anything off-topic, reply exactly: "I'm focused on personal finance — ask me anything about investing, budgeting, or tax saving! 💸"

== HARD RULES ==
- Never recommend specific individual stocks or promise specific returns
- Always add "(past returns ≠ future results)" when quoting historical return figures
- Never suggest illegal tax avoidance
- If a question is about a crisis (job loss, debt trap, medical emergency), be empathetic first, practical second`;
}

function MsgContent({ text }) {
  const lines = text.split("\n");
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      i++;
      continue;
    }

    const isBullet = /^[-•*]\s/.test(line.trim());

    const parseInline = (str) =>
      str.split(/(\*\*[^*]+\*\*|`[^`]+`)/).map((part, j) => {
        if (/^\*\*.*\*\*$/.test(part))
          return <strong key={j}>{part.slice(2, -2)}</strong>;
        if (/^`.*`$/.test(part))
          return (
            <code key={j} className="wbot-code">
              {part.slice(1, -1)}
            </code>
          );
        return <span key={j}>{part}</span>;
      });

    if (isBullet) {
      const raw = line.replace(/^[-•*]\s/, "");
      elements.push(
        <div key={i} className="wbot-bullet">
          <span className="wbot-bullet-dot">▸</span>
          <span>{parseInline(raw)}</span>
        </div>,
      );
    } else if (line.startsWith("💡")) {
      elements.push(
        <div key={i} className="wbot-action-tip">
          {parseInline(line)}
        </div>,
      );
    } else {
      elements.push(
        <p key={i} className="wbot-para">
          {parseInline(line)}
        </p>,
      );
    }
    i++;
  }

  return <div className="wbot-msg-body">{elements}</div>;
}

function TypingDots() {
  return (
    <div className="wbot-typing" aria-label="WorthBot is thinking">
      <span />
      <span />
      <span />
      <span className="wbot-thinking-txt">thinking…</span>
    </div>
  );
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FinanceChatbot({ financialContext }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState("unknown");
  const [modelName, setModelName] = useState("llama3.2");
  const [unread, setUnread] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [inputRows, setInputRows] = useState(1);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const messagesRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE}/chat/health`)
      .then((r) => r.json())
      .then((d) => {
        setOllamaStatus(d.ok ? "ok" : "error");
        if (d.model) setModelName(d.model);
      })
      .catch(() => setOllamaStatus("error"));
  }, []);

  useEffect(() => {
    if (open) {
      setUnread(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    const lineCount = e.target.value.split("\n").length;
    setInputRows(Math.min(4, Math.max(1, lineCount)));
  };

  const copyMessage = (text, idx) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    });
  };

  const sendMessage = useCallback(
    async (text) => {
      const userText = (text ?? input).trim();
      if (!userText || streaming) return;
      setInput("");
      setInputRows(1);
      setActiveCategory(null);

      const ts = Date.now();
      const userMsg = { role: "user", content: userText, ts };
      const history = [...messages, userMsg];
      const placeholderTs = Date.now();
      setMessages([
        ...history,
        { role: "assistant", content: "", streaming: true, ts: placeholderTs },
      ]);
      setStreaming(true);

      const apiMessages = history.slice(-12).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        abortRef.current = new AbortController();
        const res = await fetch(`${API_BASE}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortRef.current.signal,
          body: JSON.stringify({
            messages: apiMessages,
            system: buildSystemPrompt(financialContext),
          }),
        });

        if (!res.ok) throw new Error(`Server error ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop();

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const parsed = JSON.parse(line);
              if (parsed.token) {
                accumulated += parsed.token;
                setMessages((prev) => {
                  const next = [...prev];
                  next[next.length - 1] = {
                    role: "assistant",
                    content: accumulated,
                    streaming: true,
                    ts: placeholderTs,
                  };
                  return next;
                });
              }
              if (parsed.done) {
                setMessages((prev) => {
                  const next = [...prev];
                  next[next.length - 1] = {
                    role: "assistant",
                    content: accumulated,
                    streaming: false,
                    ts: placeholderTs,
                  };
                  return next;
                });
              }
            } catch {}
          }
        }
      } catch (err) {
        if (err.name === "AbortError") return;
        const isOffline = ollamaStatus === "error";
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: "assistant",
            content: isOffline
              ? "**Ollama isn't running.**\n\nStart it in your terminal:\n`ollama serve`\n\nThen pull a model if you haven't:\n`ollama pull llama3.2`"
              : "Something went wrong — please try again.",
            streaming: false,
            isError: true,
            ts: placeholderTs,
          };
          return next;
        });
      } finally {
        setStreaming(false);
        if (!open) setUnread(true);
      }
    },
    [input, messages, streaming, financialContext, ollamaStatus, open],
  );

  const stopStream = () => {
    abortRef.current?.abort();
    setStreaming(false);
    setMessages((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (last?.streaming)
        next[next.length - 1] = { ...last, streaming: false };
      return next;
    });
  };

  const clearChat = () => {
    stopStream();
    setMessages([]);
    setActiveCategory(null);
  };

  const isEmpty = messages.length === 0;
  const activeCategoryData = CATEGORIES.find((c) => c.id === activeCategory);

  const followUps = (() => {
    if (messages.length < 2 || streaming) return [];
    const last = messages[messages.length - 1];
    if (last.role !== "assistant" || !last.content) return [];
    const text = last.content.toLowerCase();
    if (text.includes("sip") || text.includes("mutual fund")) {
      return [
        "How do I start a SIP?",
        "Which app to use for SIP?",
        "Can I pause my SIP?",
      ];
    }
    if (text.includes("tax") || text.includes("80c") || text.includes("elss")) {
      return [
        "How to claim ELSS deduction?",
        "What is Form 16?",
        "Deadline for tax saving?",
      ];
    }
    if (text.includes("emergency") || text.includes("fund")) {
      return [
        "Where to keep emergency fund?",
        "FD vs liquid fund?",
        "How to build it fast?",
      ];
    }
    if (
      text.includes("budget") ||
      text.includes("expense") ||
      text.includes("savings")
    ) {
      return [
        "How to track expenses?",
        "Best budgeting apps in India?",
        "Zero-based budgeting?",
      ];
    }
    return [];
  })();

  return (
    <>
      <button
        className="wbot-fab"
        onClick={() => {
          setOpen((o) => !o);
          setUnread(false);
        }}
        aria-label="Open WorthBot finance assistant"
        title="WorthBot — your finance advisor"
      >
        <span className="wbot-fab-icon">{open ? "✕" : "💬"}</span>
        {!open && <span className="wbot-fab-label">WorthBot</span>}
        {unread && <span className="wbot-fab-badge" />}
        {!open && ollamaStatus !== "unknown" && (
          <span
            className={`wbot-fab-status wbot-fab-status--${ollamaStatus === "ok" ? "live" : "err"}`}
          />
        )}
      </button>

      {open && (
        <div
          className="wbot-panel"
          role="dialog"
          aria-modal="true"
          aria-label="WorthBot Finance Assistant"
        >
          {ollamaStatus === "error" && (
            <div className="wbot-offline-banner">
              <span>⚠️ Ollama offline</span>
              <code>ollama serve</code>
            </div>
          )}

          <div className="wbot-header">
            <div className="wbot-header-info">
              <div className="wbot-header-avatar">
                <span>🤖</span>
                {ollamaStatus === "ok" && (
                  <span className="wbot-header-pulse" />
                )}
              </div>
              <div>
                <div className="wbot-header-name">WorthBot</div>
                <div className="wbot-header-meta">
                  {ollamaStatus === "ok" ? (
                    <>{modelName} · local · private</>
                  ) : ollamaStatus === "error" ? (
                    <span className="wbot-meta-err">
                      offline — run ollama serve
                    </span>
                  ) : (
                    "connecting…"
                  )}
                </div>
              </div>
            </div>
            <div className="wbot-header-btns">
              {messages.length > 0 && (
                <button
                  className="wbot-hbtn"
                  onClick={clearChat}
                  title="New conversation"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 .49-4.5" />
                  </svg>
                </button>
              )}
              <button
                className="wbot-hbtn"
                onClick={() => setOpen(false)}
                title="Close"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Context bar — shows user's key numbers */}
          {financialContext && isEmpty && (
            <div className="wbot-ctx-bar">
              <div className="wbot-ctx-chip">
                <span className="wbot-ctx-lbl">Income</span>
                <span className="wbot-ctx-val">
                  ₹{(financialContext.income / 1000).toFixed(0)}K
                </span>
              </div>
              <div className="wbot-ctx-chip">
                <span className="wbot-ctx-lbl">Surplus</span>
                <span className="wbot-ctx-val wbot-ctx-val--green">
                  ₹
                  {(
                    Math.max(
                      0,
                      financialContext.income - financialContext.expenses,
                    ) / 1000
                  ).toFixed(0)}
                  K
                </span>
              </div>
              <div className="wbot-ctx-chip">
                <span className="wbot-ctx-lbl">Strategy</span>
                <span className="wbot-ctx-val">
                  {financialContext.strategy}
                </span>
              </div>
              <div className="wbot-ctx-chip">
                <span className="wbot-ctx-lbl">Horizon</span>
                <span className="wbot-ctx-val">
                  {financialContext.sipYears}yr
                </span>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="wbot-messages" ref={messagesRef}>
            {isEmpty ? (
              <div className="wbot-welcome">
                <div className="wbot-welcome-head">
                  <div className="wbot-welcome-avatar">🤖</div>
                  <div>
                    <p className="wbot-welcome-title">
                      {financialContext
                        ? `Hey! I know your numbers — let's make them work harder.`
                        : "Your personal finance advisor"}
                    </p>
                    <p className="wbot-welcome-sub">
                      {financialContext
                        ? `With ₹${Math.max(0, financialContext.income - financialContext.expenses).toLocaleString("en-IN")}/mo surplus and a ${financialContext.strategy.toLowerCase()} strategy, I can give you very specific advice.`
                        : "Ask me anything about investing, SIPs, taxes, or budgeting."}
                    </p>
                  </div>
                </div>

                {/* Category tabs */}
                <div className="wbot-cats">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      className={`wbot-cat ${activeCategory === cat.id ? "wbot-cat--active" : ""}`}
                      onClick={() =>
                        setActiveCategory(
                          activeCategory === cat.id ? null : cat.id,
                        )
                      }
                    >
                      <span>{cat.icon}</span> {cat.label}
                    </button>
                  ))}
                </div>

                {/* Questions for active category */}
                {activeCategoryData ? (
                  <div className="wbot-cat-questions">
                    {activeCategoryData.questions.map((q, i) => (
                      <button
                        key={i}
                        className="wbot-cat-q"
                        onClick={() => sendMessage(q)}
                      >
                        <span className="wbot-cat-q-arrow">→</span>
                        {q}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="wbot-starter-hint">
                    ↑ Pick a topic or type your question below
                  </div>
                )}
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`wbot-msg-wrap wbot-msg-wrap--${msg.role}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="wbot-msg-avatar">🤖</div>
                    )}
                    <div className="wbot-msg-col">
                      <div
                        className={`wbot-bubble wbot-bubble--${msg.role}${msg.isError ? " wbot-bubble--error" : ""}`}
                      >
                        {msg.role === "assistant" &&
                        msg.content === "" &&
                        msg.streaming ? (
                          <TypingDots />
                        ) : (
                          <MsgContent text={msg.content} />
                        )}
                        {msg.streaming && msg.content !== "" && (
                          <span className="wbot-cursor" aria-hidden="true" />
                        )}
                      </div>

                      {/* Message actions */}
                      {msg.role === "assistant" &&
                        !msg.streaming &&
                        msg.content && (
                          <div className="wbot-msg-actions">
                            <span className="wbot-msg-time">
                              {formatTime(msg.ts)}
                            </span>
                            <button
                              className="wbot-msg-btn"
                              onClick={() => copyMessage(msg.content, i)}
                              title="Copy response"
                            >
                              {copiedIdx === i ? "✓ copied" : "copy"}
                            </button>
                          </div>
                        )}
                      {msg.role === "user" && (
                        <div className="wbot-msg-actions wbot-msg-actions--user">
                          <span className="wbot-msg-time">
                            {formatTime(msg.ts)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Follow-up suggestions */}
                {followUps.length > 0 && !streaming && (
                  <div className="wbot-followups">
                    <span className="wbot-followups-lbl">Follow up:</span>
                    {followUps.map((q, i) => (
                      <button
                        key={i}
                        className="wbot-followup-chip"
                        onClick={() => sendMessage(q)}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                <div ref={bottomRef} />
              </>
            )}
          </div>

          <div className="wbot-input-wrap">
            <div className="wbot-input-box">
              <textarea
                ref={inputRef}
                className="wbot-textarea"
                value={input}
                rows={inputRows}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={
                  ollamaStatus === "error"
                    ? "Start Ollama to chat…"
                    : "Ask about SIPs, taxes, budgeting… (Enter to send)"
                }
                disabled={ollamaStatus === "error"}
              />
              <div className="wbot-input-actions">
                {input.length > 0 && (
                  <span className="wbot-char-count">{input.length}</span>
                )}
                {streaming ? (
                  <button
                    className="wbot-send-btn wbot-send-btn--stop"
                    onClick={stopStream}
                    title="Stop generating"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <rect x="4" y="4" width="16" height="16" rx="2" />
                    </svg>
                  </button>
                ) : (
                  <button
                    className="wbot-send-btn"
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || ollamaStatus === "error"}
                    title="Send (Enter)"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="12" y1="19" x2="12" y2="5" />
                      <polyline points="5 12 12 5 19 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <p className="wbot-input-hint">
              {streaming
                ? "Generating… Shift+Enter for new line"
                : "Enter to send · Shift+Enter for newline · runs 100% locally"}
            </p>
          </div>
        </div>
      )}

      <style>{`
        /* FAB trigger */
        .wbot-fab {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          height: 48px;
          padding: 0 1.1rem 0 .85rem;
          border-radius: 24px;
          border: none;
          background: linear-gradient(135deg, var(--accent,#ff5f2e) 0%, #ff8040 100%);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: .45rem;
          box-shadow: 0 4px 20px rgba(255,95,46,.4), 0 1px 4px rgba(255,95,46,.25);
          z-index: 950;
          transition: transform .18s, box-shadow .18s;
          font-family: 'Space Grotesk', sans-serif;
        }
        .wbot-fab:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(255,95,46,.5); }
        .wbot-fab-icon { font-size: 1.15rem; line-height: 1; }
        .wbot-fab-label { font-size: .8rem; font-weight: 700; color: #fff; letter-spacing: .02em; }
        .wbot-fab-badge {
          position: absolute; top: -3px; right: -3px;
          width: 11px; height: 11px; border-radius: 50%;
          background: #0e9f6e; border: 2px solid #fff;
          animation: wbotBadgePop .3s cubic-bezier(.34,1.56,.64,1);
        }
        @keyframes wbotBadgePop { from{transform:scale(0)} to{transform:scale(1)} }
        .wbot-fab-status {
          position: absolute; bottom: 6px; right: 6px;
          width: 7px; height: 7px; border-radius: 50%; border: 1.5px solid rgba(255,255,255,.9);
        }
        .wbot-fab-status--live { background: #06d6a0; }
        .wbot-fab-status--err  { background: #e63946; }

        /* Panel */
        .wbot-panel {
          position: fixed;
          bottom: 5.5rem;
          right: 2rem;
          width: clamp(340px, 94vw, 460px);
          max-height: 78vh;
          display: flex;
          flex-direction: column;
          background: rgba(252,253,252,0.97);
          backdrop-filter: blur(32px);
          -webkit-backdrop-filter: blur(32px);
          border: 1px solid rgba(255,255,255,.9);
          border-radius: 20px;
          box-shadow:
            0 24px 80px rgba(13,23,18,.17),
            0 6px 24px rgba(13,23,18,.09),
            0 0 0 1px rgba(16,36,27,.04);
          z-index: 949;
          overflow: hidden;
          font-family: 'Space Grotesk', sans-serif;
          animation: wbotSlideUp .26s cubic-bezier(.34,1.4,.64,1) both;
        }
        @keyframes wbotSlideUp {
          from { opacity:0; transform:translateY(16px) scale(.96); }
          to   { opacity:1; transform:none; }
        }

        /* Offline banner */
        .wbot-offline-banner {
          display: flex; align-items: center; justify-content: space-between;
          padding: .45rem 1rem;
          background: rgba(230,57,70,.08);
          border-bottom: 1px solid rgba(230,57,70,.15);
          font-size: .72rem; font-weight: 600; color: #c0392b;
          flex-shrink: 0;
        }
        .wbot-offline-banner code {
          background: rgba(230,57,70,.12); border-radius: 5px;
          padding: .15rem .45rem; font-size: .68rem; color: #c0392b;
        }

        /* Header */
        .wbot-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: .8rem 1rem;
          background: linear-gradient(135deg, #1a2e24 0%, #0d1f18 100%);
          flex-shrink: 0;
        }
        .wbot-header-info { display: flex; align-items: center; gap: .65rem; }
        .wbot-header-avatar {
          position: relative;
          width: 38px; height: 38px; border-radius: 12px;
          background: linear-gradient(135deg,#ff5f2e,#ff8040);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem; flex-shrink: 0;
        }
        .wbot-header-pulse {
          position: absolute; bottom: -2px; right: -2px;
          width: 9px; height: 9px; border-radius: 50%;
          background: #06d6a0; border: 2px solid #0d1f18;
          animation: wbotPulse 2s ease-in-out infinite;
        }
        @keyframes wbotPulse { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.15)} }
        .wbot-header-name { font-weight: 700; font-size: .9rem; color: #fff; letter-spacing: .015em; }
        .wbot-header-meta { font-size: .67rem; color: rgba(255,255,255,.5); margin-top: 1px; }
        .wbot-meta-err { color: #ff9999; }
        .wbot-header-btns { display: flex; gap: .3rem; }
        .wbot-hbtn {
          width: 30px; height: 30px; border-radius: 8px; border: none;
          background: rgba(255,255,255,.1); color: rgba(255,255,255,.7);
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: background .15s, color .15s;
        }
        .wbot-hbtn:hover { background: rgba(255,255,255,.2); color: #fff; }

        /* Context bar */
        .wbot-ctx-bar {
          display: flex; gap: .4rem; padding: .55rem .85rem;
          background: rgba(16,36,27,.03);
          border-bottom: 1px solid rgba(16,36,27,.06);
          flex-shrink: 0; overflow-x: auto;
        }
        .wbot-ctx-bar::-webkit-scrollbar { display: none; }
        .wbot-ctx-chip {
          display: flex; flex-direction: column; align-items: center;
          padding: .3rem .65rem; border-radius: 8px;
          background: rgba(255,255,255,.85);
          border: 1px solid rgba(16,36,27,.07);
          flex-shrink: 0;
        }
        .wbot-ctx-lbl { font-size: .58rem; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: rgba(16,36,27,.4); }
        .wbot-ctx-val { font-size: .78rem; font-weight: 700; color: var(--text,#0d1712); }
        .wbot-ctx-val--green { color: #0e9f6e; }

        /* Messages */
        .wbot-messages {
          flex: 1; overflow-y: auto; padding: .9rem .85rem;
          display: flex; flex-direction: column; gap: .75rem; min-height: 0;
        }
        .wbot-messages::-webkit-scrollbar { width: 3px; }
        .wbot-messages::-webkit-scrollbar-thumb { background: rgba(16,36,27,.1); border-radius: 3px; }

        /* Welcome */
        .wbot-welcome { display: flex; flex-direction: column; gap: .8rem; }
        .wbot-welcome-head { display: flex; gap: .7rem; align-items: flex-start; }
        .wbot-welcome-avatar {
          width: 38px; height: 38px; border-radius: 12px; flex-shrink: 0;
          background: linear-gradient(135deg,#ff5f2e,#ff8040);
          display: flex; align-items: center; justify-content: center; font-size: 1.1rem;
        }
        .wbot-welcome-title { font-weight: 700; font-size: .88rem; color: var(--text,#0d1712); margin: 0 0 .2rem; }
        .wbot-welcome-sub { font-size: .75rem; color: var(--muted,#5a7a6a); margin: 0; line-height: 1.5; }

        /* Categories */
        .wbot-cats { display: flex; flex-wrap: wrap; gap: .35rem; }
        .wbot-cat {
          padding: .3rem .7rem; border-radius: 20px;
          border: 1px solid rgba(16,36,27,.1);
          background: rgba(255,255,255,.7);
          color: var(--text,#0d1712); font-size: .74rem; font-weight: 600;
          cursor: pointer; font-family: inherit;
          display: flex; align-items: center; gap: .3rem;
          transition: all .15s;
        }
        .wbot-cat:hover { border-color: rgba(255,95,46,.35); background: rgba(255,95,46,.06); color: var(--accent,#ff5f2e); }
        .wbot-cat--active { border-color: var(--accent,#ff5f2e); background: rgba(255,95,46,.08); color: var(--accent,#ff5f2e); }

        /* Category questions */
        .wbot-cat-questions { display: flex; flex-direction: column; gap: .3rem; }
        .wbot-cat-q {
          padding: .55rem .75rem; border-radius: 10px;
          border: 1px solid rgba(16,36,27,.08);
          background: rgba(255,255,255,.8);
          color: var(--text,#0d1712); font-size: .78rem; font-weight: 500;
          cursor: pointer; font-family: inherit; text-align: left;
          display: flex; align-items: center; gap: .5rem;
          transition: all .15s;
        }
        .wbot-cat-q:hover { border-color: rgba(255,95,46,.3); background: rgba(255,95,46,.05); transform: translateX(2px); }
        .wbot-cat-q-arrow { color: var(--accent,#ff5f2e); font-size: .85rem; flex-shrink: 0; }
        .wbot-starter-hint { font-size: .72rem; color: rgba(16,36,27,.35); text-align: center; padding: .5rem 0; }

        /* Message rows */
        .wbot-msg-wrap { display: flex; gap: .5rem; align-items: flex-start; }
        .wbot-msg-wrap--user { flex-direction: row-reverse; }
        .wbot-msg-col { display: flex; flex-direction: column; gap: .25rem; max-width: 86%; }
        .wbot-msg-wrap--user .wbot-msg-col { align-items: flex-end; }
        .wbot-msg-avatar {
          width: 28px; height: 28px; border-radius: 9px; flex-shrink: 0; margin-top: .1rem;
          background: linear-gradient(135deg,#ff5f2e,#ff8040);
          display: flex; align-items: center; justify-content: center; font-size: .82rem;
        }

        /* Bubbles */
        .wbot-bubble {
          padding: .6rem .85rem; font-size: .81rem; line-height: 1.6; border-radius: 14px;
        }
        .wbot-bubble--user {
          border-radius: 14px 14px 4px 14px;
          background: linear-gradient(135deg, #1a2e24, #0d1f18);
          color: rgba(255,255,255,.92);
        }
        .wbot-bubble--assistant {
          border-radius: 14px 14px 14px 4px;
          background: rgba(255,255,255,.9);
          border: 1px solid rgba(16,36,27,.08);
          color: var(--text,#0d1712);
          box-shadow: 0 1px 4px rgba(13,23,18,.06);
        }
        .wbot-bubble--error {
          background: rgba(230,57,70,.06);
          border-color: rgba(230,57,70,.2);
          color: #c0392b;
        }

        /* Message body elements */
        .wbot-msg-body { display: flex; flex-direction: column; gap: .25rem; }
        .wbot-para { margin: 0; }
        .wbot-bullet { display: flex; gap: .4rem; align-items: baseline; margin: .05rem 0; }
        .wbot-bullet-dot { color: var(--accent,#ff5f2e); font-size: .7rem; flex-shrink: 0; margin-top: .05em; }
        .wbot-code {
          font-family: 'Fira Code', 'Courier New', monospace; font-size: .75em;
          background: rgba(16,36,27,.07); border-radius: 4px; padding: .05em .35em;
          border: 1px solid rgba(16,36,27,.08);
        }
        .wbot-action-tip {
          margin-top: .3rem; padding: .45rem .65rem;
          background: rgba(14,159,110,.08); border-radius: 8px;
          border-left: 3px solid #0e9f6e;
          font-size: .78rem; color: #096644; line-height: 1.5;
        }

        /* Streaming cursor */
        .wbot-cursor {
          display: inline-block; width: 2px; height: .85em;
          background: var(--accent,#ff5f2e); margin-left: 2px;
          vertical-align: text-bottom; border-radius: 1px;
          animation: wbotBlink .65s step-end infinite;
        }
        @keyframes wbotBlink { 0%,100%{opacity:1} 50%{opacity:0} }

        /* Typing dots */
        .wbot-typing {
          display: flex; gap: .3rem; align-items: center; padding: .05rem 0;
        }
        .wbot-typing span {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--accent,#ff5f2e);
          animation: wbotBounce 1.2s ease-in-out infinite;
        }
        .wbot-typing span:nth-child(2) { animation-delay: .2s; }
        .wbot-typing span:nth-child(3) { animation-delay: .4s; }
        @keyframes wbotBounce { 0%,100%{transform:translateY(0);opacity:.4} 50%{transform:translateY(-5px);opacity:1} }
        .wbot-thinking-txt { font-size: .68rem; color: rgba(16,36,27,.4); margin-left: .2rem; font-style: italic; }

        /* Message actions */
        .wbot-msg-actions {
          display: flex; align-items: center; gap: .5rem; padding: 0 .15rem;
        }
        .wbot-msg-actions--user { justify-content: flex-end; }
        .wbot-msg-time { font-size: .62rem; color: rgba(16,36,27,.3); }
        .wbot-msg-btn {
          font-size: .62rem; color: rgba(16,36,27,.35); background: none; border: none;
          cursor: pointer; font-family: inherit; padding: 0;
          transition: color .15s;
        }
        .wbot-msg-btn:hover { color: var(--accent,#ff5f2e); }

        /* Follow-up chips */
        .wbot-followups {
          display: flex; flex-wrap: wrap; gap: .35rem; align-items: center;
          padding: .1rem 0;
        }
        .wbot-followups-lbl { font-size: .67rem; color: rgba(16,36,27,.4); font-weight: 600; flex-shrink: 0; }
        .wbot-followup-chip {
          padding: .25rem .65rem; border-radius: 16px;
          border: 1px solid rgba(255,95,46,.2);
          background: rgba(255,95,46,.05);
          color: var(--accent,#ff5f2e); font-size: .71rem; font-weight: 500;
          cursor: pointer; font-family: inherit;
          transition: background .14s, border-color .14s;
        }
        .wbot-followup-chip:hover { background: rgba(255,95,46,.12); border-color: rgba(255,95,46,.4); }

        /* Input */
        .wbot-input-wrap {
          padding: .65rem .85rem .55rem;
          border-top: 1px solid rgba(16,36,27,.07);
          background: rgba(250,251,250,.95);
          flex-shrink: 0;
        }
        .wbot-input-box {
          display: flex; align-items: flex-end; gap: .4rem;
          background: #fff; border: 1.5px solid rgba(16,36,27,.1);
          border-radius: 14px; padding: .5rem .5rem .5rem .75rem;
          transition: border-color .15s, box-shadow .15s;
        }
        .wbot-input-box:focus-within {
          border-color: rgba(255,95,46,.45);
          box-shadow: 0 0 0 3px rgba(255,95,46,.1);
        }
        .wbot-textarea {
          flex: 1; border: none; outline: none; resize: none;
          font-family: inherit; font-size: .81rem; line-height: 1.55;
          color: var(--text,#0d1712); background: transparent;
          max-height: 100px; overflow-y: auto;
        }
        .wbot-textarea::placeholder { color: rgba(16,36,27,.32); }
        .wbot-textarea:disabled { cursor: not-allowed; opacity: .5; }
        .wbot-input-actions { display: flex; align-items: flex-end; gap: .3rem; flex-shrink: 0; }
        .wbot-char-count { font-size: .6rem; color: rgba(16,36,27,.25); align-self: center; }
        .wbot-send-btn {
          width: 34px; height: 34px; border-radius: 10px; border: none;
          background: linear-gradient(135deg, var(--accent,#ff5f2e), #ff8040);
          color: #fff; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: opacity .15s, box-shadow .15s, transform .1s;
          box-shadow: 0 2px 8px rgba(255,95,46,.35);
        }
        .wbot-send-btn:disabled { opacity: .3; box-shadow: none; cursor: default; }
        .wbot-send-btn:not(:disabled):hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(255,95,46,.5); }
        .wbot-send-btn--stop {
          background: rgba(230,57,70,.1); color: #e63946;
          box-shadow: none; border: 1px solid rgba(230,57,70,.2);
        }
        .wbot-send-btn--stop:hover { background: rgba(230,57,70,.18); transform: none; }
        .wbot-input-hint {
          font-size: .62rem; color: rgba(16,36,27,.28); text-align: center;
          margin: .35rem 0 0; padding: 0;
        }

        /* Mobile */
        @media (max-width: 480px) {
          .wbot-panel { right: .75rem; bottom: 5rem; width: calc(100vw - 1.5rem); max-height: 80vh; }
          .wbot-fab { right: .75rem; bottom: 1rem; }
        }
      `}</style>
    </>
  );
}
