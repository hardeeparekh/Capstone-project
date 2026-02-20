const { generateExplanation } = require("../services/llmService");

const { runMonteCarlo } = require("../services/monteCarloService");

exports.runSIPSimulation = async(req, res) => {
  try {
    const { sip, years, riskLevel, targetAmount, inflationRate, mode } = req.body;

    if (!sip || !years || !riskLevel) {
      return res.status(400).json({
        error: "SIP, years and risk level are required"
      });
    }

    const riskMap = {
      low: { mean: 0.07, volatility: 0.03 },
      moderate: { mean: 0.12, volatility: 0.08 },
      high: { mean: 0.16, volatility: 0.15 }
    };

    const selectedRisk = riskMap[riskLevel];

    if (!selectedRisk) {
      return res.status(400).json({
        error: "Invalid risk level"
      });
    }

    const simulation = runMonteCarlo(
      sip,
      years,
      selectedRisk.mean,
      selectedRisk.volatility,
      500
    );

    let probab = null;

    if (targetAmount) {
      const successCount = simulation.allResults.filter(
        value => value >= targetAmount
      ).length;

      probab = Math.round(
        (successCount / simulation.allResults.length) * 100
      );
    }

    const inflation = inflationRate ? inflationRate / 100 : 0.06;

    const realAverage =
      simulation.average / Math.pow(1 + inflation, years);

    const realWorst =
      simulation.worstCase / Math.pow(1 + inflation, years);

    const realBest =
      simulation.bestCase / Math.pow(1 + inflation, years);
    
    const explanation = await generateExplanation({
     totalInvestment: sip * 12 * years,
     averageValue: simulation.average,
     worstCase: simulation.worstCase,
     bestCase: simulation.bestCase,
     realAverageValue: Math.round(realAverage),
     probabilityOfReachingTarget: probab
    }, 
    mode || "short"
    );

      res.json({
      totalInvestment: sip * 12 * years,
      averageValue: simulation.average,
      worstCase: simulation.worstCase,
      bestCase: simulation.bestCase,
      realAverageValue: Math.round(realAverage),
      realWorstCase: Math.round(realWorst),
      realBestCase: Math.round(realBest),
      probabilityOfReachingTarget: probab,
      explanation
    });

  } catch (error) {
    res.status(500).json({
      error: "Monte Carlo simulation failed"
    });
  }
};
