function getFallbackReflection(history, finalUser, finalOptimal) {
  const diff = finalUser - finalOptimal;
  const crashWithdrawal = history.find(
    (item) => item.event === "CRASH" && item.action === "withdraw"
  );
  const investMoves = history.filter((item) => item.action === "invest").length;

  if (crashWithdrawal) {
    return {
      summary: "Panic Sell Detected",
      detail:
        "You sold during a market crash, which locked in losses and reduced future compounding.",
      advice: "During deep drawdowns, avoid panic exits and focus on long-term allocation."
    };
  }

  if (diff >= 0) {
    return {
      summary: "Strong Decision Quality",
      detail:
        "Your choices matched or beat the baseline strategy over the full 15-year cycle.",
      advice: "Repeat this discipline: keep investing through volatility and avoid overreacting."
    };
  }

  if (investMoves < 4) {
    return {
      summary: "Too Conservative",
      detail:
        "You stayed under-invested for many years and missed upside in growth years.",
      advice: "Set a minimum yearly investment rule so cash does not stay idle."
    };
  }

  return {
    summary: "Close, But Behind Baseline",
    detail:
      "Your final result was slightly below the baseline because timing and allocations were inconsistent.",
    advice: "Use a stable allocation rule and review only once per year."
  };
}

function safeParseModelJson(rawText) {
  if (!rawText || typeof rawText !== "string") return null;

  const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (nestedError) {
      return null;
    }
  }
}

async function generateDecisionReflection({
  history,
  finalUser,
  finalOptimal,
  level
}) {
  const fallback = getFallbackReflection(history, finalUser, finalOptimal);

  if (!process.env.GEMINI_API_KEY) {
    return fallback;
  }

  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

    const prompt = `
You are a financial mentor in a decision simulation game.
Analyze this run and return strict JSON with keys summary, detail, advice.

Level: ${level}
Final user wealth: ${finalUser}
Final baseline wealth: ${finalOptimal}
History: ${JSON.stringify(history)}

Rules:
- summary: short headline (max 8 words)
- detail: max 2 short sentences
- advice: one practical tip
- return valid JSON only
`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });

    const rawText =
      typeof response.text === "function" ? response.text() : response.text;
    const parsed = safeParseModelJson(rawText);

    if (
      parsed &&
      typeof parsed.summary === "string" &&
      typeof parsed.detail === "string" &&
      typeof parsed.advice === "string"
    ) {
      return parsed;
    }

    return fallback;
  } catch (error) {
    console.error("Decision reflection error:", error.message);
    return fallback;
  }
}

module.exports = {
  generateDecisionReflection
};
