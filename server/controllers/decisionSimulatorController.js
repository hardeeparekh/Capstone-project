const crypto = require("crypto");

const {
  generateMarketConditions,
  runBaselineStrategy
} = require("../services/decisionSimulatorEngine");
const {
  generateDecisionReflection
} = require("../services/decisionReflectionService");

const sessions = new Map();

const MAX_YEARS = 15;
const SESSION_TTL_MS = 2 * 60 * 60 * 1000;
const SUPPORTED_LEVELS = new Set(["Explorer", "Analyst", "Strategist"]);

function cleanupSessions() {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.updatedAt > SESSION_TTL_MS) {
      sessions.delete(id);
    }
  }
}

function parseNumber(value, fallbackValue = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallbackValue;
}

function getClientState(session) {
  const surplus = Math.max(0, session.salary - session.expenses);
  return {
    year: session.year,
    maxYears: session.maxYears,
    portfolio: Math.round(session.portfolio),
    cash: Math.round(session.cash),
    salary: Math.round(session.salary),
    expenses: Math.round(session.expenses),
    surplus: Math.round(surplus)
  };
}

exports.startDecisionSession = (req, res) => {
  cleanupSessions();

  const requestedLevel = String(req.body.level || "Analyst");
  const level = SUPPORTED_LEVELS.has(requestedLevel) ? requestedLevel : "Analyst";
  const salary = parseNumber(req.body.salary, 0);
  const expenses = parseNumber(req.body.expenses, 0);
  const initialSavings = parseNumber(req.body.initialSavings, 0);

  if (salary <= 0) {
    return res.status(400).json({ error: "Salary must be greater than zero." });
  }

  if (expenses < 0) {
    return res.status(400).json({ error: "Expenses cannot be negative." });
  }

  if (expenses >= salary) {
    return res
      .status(400)
      .json({ error: "Expenses must be lower than salary to start simulation." });
  }

  const sessionId = crypto.randomUUID();
  const openingCash = Math.max(0, salary - expenses);
  const safeInitialSavings = Math.max(0, initialSavings);

  const session = {
    id: sessionId,
    config: { level },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    year: 1,
    maxYears: MAX_YEARS,
    portfolio: safeInitialSavings,
    cash: openingCash,
    salary,
    expenses,
    baseline: {
      portfolio: safeInitialSavings,
      cash: 0
    },
    history: []
  };

  sessions.set(sessionId, session);

  return res.json({
    sessionId,
    state: getClientState(session)
  });
};

exports.playDecisionYear = async (req, res) => {
  cleanupSessions();

  const sessionId = String(req.body.sessionId || "");
  const action = String(req.body.action || "").toLowerCase();
  const amount = Math.max(0, parseNumber(req.body.amount, 0));

  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(404).json({ error: "Session expired. Start a new run." });
  }

  if (!["invest", "hold", "withdraw"].includes(action)) {
    return res.status(400).json({ error: "Invalid action type." });
  }

  const session = sessions.get(sessionId);
  const market = generateMarketConditions(session.config.level);

  if (action === "invest") {
    const investAmount = Math.min(amount, session.cash);
    session.cash -= investAmount;
    session.portfolio += investAmount;
  } else if (action === "withdraw") {
    const withdrawAmount = Math.min(amount, session.portfolio);
    session.portfolio -= withdrawAmount;
    session.cash += withdrawAmount;
  }

  session.portfolio *= 1 + market.marketReturn;
  session.expenses *= 1 + market.inflation;
  session.salary *= 1 + market.wageGrowth;

  const newSurplus = Math.max(0, session.salary - session.expenses);
  session.cash += newSurplus;

  session.baseline = runBaselineStrategy(
    session.baseline,
    session.salary,
    session.expenses,
    market.marketReturn
  );

  session.history.push({
    year: session.year,
    action,
    event: market.event,
    marketReturn: Number((market.marketReturn * 100).toFixed(2)),
    inflation: Number((market.inflation * 100).toFixed(2)),
    wageGrowth: Number((market.wageGrowth * 100).toFixed(2))
  });

  session.year += 1;
  session.updatedAt = Date.now();

  if (session.year > session.maxYears) {
    const finalUser = Math.round(session.portfolio + session.cash);
    const finalOptimal = Math.round(
      session.baseline.portfolio + session.baseline.cash
    );
    const difference = finalUser - finalOptimal;

    const reflection = await generateDecisionReflection({
      history: session.history,
      finalUser,
      finalOptimal,
      level: session.config.level
    });

    sessions.delete(sessionId);

    return res.json({
      finished: true,
      reflection: {
        finalUser,
        finalOptimal,
        difference,
        message: `Summary: ${reflection.summary}\n\n${reflection.detail}\n\nTip: ${reflection.advice}`,
        details: reflection
      }
    });
  }

  return res.json({
    finished: false,
    state: getClientState(session),
    market: {
      return: `${(market.marketReturn * 100).toFixed(1)}%`,
      inflation: `${(market.inflation * 100).toFixed(1)}%`,
      wageGrowth: `${(market.wageGrowth * 100).toFixed(1)}%`,
      event: market.event
    }
  });
};
