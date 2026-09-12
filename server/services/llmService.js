async function generateExplanation(data) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return "AI explanation currently unavailable. Please provide GROQ_API_KEY in server/.env.";
  }

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "groq/compound-mini",
        temperature: 0.1,
        max_tokens: 120,
        messages: [
          {
            role: "system",
            content:
              "You are a concise financial tutor. Output EXACTLY 3 short bullet points. Do NOT output markdown tables, math breakdowns, headers, greetings, or conclusions.",
          },
          {
            role: "user",
            content: `Summarize in 3 bullet points: Total Invested ₹${data.totalInvestment}, Expected Value ₹${data.averageValue}, Real Purchasing Power ₹${data.realAverageValue}, Goal Odds ${data.probabilityOfReachingTarget}%.`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Groq API error:", errText);
      return "AI explanation currently unavailable.";
    }

    const json = await res.json();
    return (
      json?.choices?.[0]?.message?.content ||
      "AI explanation currently unavailable."
    );
  } catch (error) {
    console.error("Groq explanation error:", error);
    return "AI explanation currently unavailable.";
  }
}

module.exports = { generateExplanation };