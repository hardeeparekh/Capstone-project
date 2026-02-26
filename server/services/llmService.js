async function generateExplanation(data, mode="short") {
  try {

    
    const { GoogleGenAI } = await import("@google/genai");

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });
    let prompt;

    if (mode === "short") {
  prompt = `
You are a friendly financial coach explaining results to a beginner.
Give very simple and practical advice.
Rules:
- No financial jargon.
- No product names (no ELSS, PPF, etc.).
- No aggressive instructions.
- Maximum 4 short sentences.
- Speak like you are guiding a young adult.

Focus on:
- Savings balance
- Risk awareness
- Time horizon
- Inflation awareness

Keep it calm, supportive, and simple.
`;
}
else {
  prompt = `
You are a practical financial mentor guiding a beginner.

Give a concise structured review.

Rules:
- Keep it short.
- Maximum 2–3 lines per section.
- No long paragraphs.
- Use simple language.
- If using a slightly advanced term, explain it in 2–3 words in brackets.
- Do not repeat simulation numbers.
- Do not give product recommendations.

Format strictly like this:

🔹 Financial Position:
(2 short lines about savings ratio and SIP level.)

🔹 Risk & Time Horizon:
(2 short lines about volatility (price ups & downs) and compounding (growth on growth).)

🔹 Inflation Reality:
(2 short lines about inflation (price rise) and real return (actual value).)

🔹 Practical Improvements:
- Suggestion 1 (based on savings vs SIP)
- Suggestion 2 (based on duration or risk)
- Suggestion 3 (emergency fund or discipline)

Keep it clean, structured, and easy to read.
`;
}

    const fullPrompt = `
${prompt}

USER DATA:
Monthly Income: ₹${data.monthlyIncome}
Monthly Expenses: ₹${data.monthlyExpenses}
Monthly Savings: ₹${data.monthlySavings}
Monthly SIP: ₹${data.sipAmount}
Investment Duration: ${data.years} years
Risk Level: ${data.riskLevel}

SIMULATION RESULTS:
Total Investment: ₹${data.totalInvestment}
Average Outcome: ₹${data.averageValue}
Worst Case: ₹${data.worstCase}
Best Case: ₹${data.bestCase}
Inflation Adjusted Average: ₹${data.realAverageValue}
Probability of reaching target: ${data.probabilityOfReachingTarget}%
`;


    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: fullPrompt
    });

    return response.text;

  } catch (error) {
    console.error("Gemini error:", error);
    return "AI explanation currently unavailable.";
  }
}

module.exports = { generateExplanation };