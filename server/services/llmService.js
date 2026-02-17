async function generateExplanation(data) {
  try {

    
    const { GoogleGenAI } = await import("@google/genai");

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

    const prompt = `
You are a financial literacy tutor for beginners.
Explain the following SIP simulation results in simple language:

Total Investment: ₹${data.totalInvestment}
Average Outcome: ₹${data.averageValue}
Worst Case: ₹${data.worstCase}
Best Case: ₹${data.bestCase}
Inflation Adjusted Average: ₹${data.realAverageValue}
Probability of reaching target: ${data.probabilityOfReachingTarget}%

Explain:
- What these numbers mean
- What risk means here
- How inflation affects value
- What lesson the user should learn

Keep it very simple and friendly.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });

    return response.text;

  } catch (error) {
    console.error("Gemini error:", error);
    return "AI explanation currently unavailable.";
  }
}

module.exports = { generateExplanation };