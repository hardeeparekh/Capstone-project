async function generateExplanation(data, mode="short") {
  try {

    
    const { GoogleGenAI } = await import("@google/genai");

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });
    let prompt;

    if(mode == "short"){
    prompt = `
    You are a financial literacy tutor.

Explain the SIP results briefly.

Structure:

📊 Summary: (max 2 short sentences)
⚠️ Risk Insight: (1 short sentence)
💰 Inflation Effect: (1 short sentence)
🎯 Key Takeaway: (2 bullet points only)

Keep it very short and simple.
`
;
    } else{
      prompt = `
You are a financial literacy tutor.

Give a detailed explanation of the SIP results.

Structure:

 What Happened:
 Risk Insight:
 Inflation Effect:
 Learning Takeaway:

Use beginner-friendly language but elaborate clearly.
`;
    }

    const fullPrompt = `
${prompt}

Data:
Total Investment: ₹${data.totalInvestment}
Average Outcome: ₹${data.averageValue}
Worst Case: ₹${data.worstCase}
Best Case: ₹${data.bestCase}
Inflation Adjusted Average: ₹${data.realAverageValue}
Probability of reaching target: ${data.probabilityOfReachingTarget}%
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