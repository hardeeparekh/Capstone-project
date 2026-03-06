const { generateExplanation } = require("../services/llmService");

exports.chatWithAI = async (req, res) => {
  try {

    const { question, context } = req.body;

    const data = {
      age: context.age,
      sipAmount: context.sip,
      years: context.years,
      riskLevel: context.risk,
      monthlyIncome: 0,
      monthlyExpenses: 0,
      monthlySavings: 0,
      totalInvestment: 0,
      averageValue: context.average,
      worstCase: context.worst,
      bestCase: context.best,
      realAverageValue: 0,
      probabilityOfReachingTarget: null
    };

    const answer = await generateExplanation(data, "chat", question);

    res.json({ answer });

  } catch (error) {

    console.error("Chat AI error:", error);

    res.status(500).json({
      answer: "AI is currently unavailable."
    });
  }
};