const { generateExplanation } = require("../services/llmService");

const { runMonteCarlo } = require("../services/monteCarloService");

exports.runSIPSimulation = async(req, res) => {
  try {
    const { sip, years, riskLevel, targetAmount, inflationRate, mode, monthlyIncome, monthlyExpenses, age } = req.body;

    if (!sip || !years || !riskLevel || age == undefined) {
      return res.status(400).json({
        error: "SIP, years, risk level and age are required"
      });
    }

    if (age <= 0 || age > 100) {
      return res.status(400).json({
        error: "Invalid age"
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

//age based ajustment required to decide the risk level and return.
let equityAllocation = 100 - age;


if (riskLevel === "high") {
  equityAllocation += 10;
} else if (riskLevel === "low") {
  equityAllocation -= 10;
}

//allocation between 20% and 90%
equityAllocation = Math.max(20, Math.min(90, equityAllocation));

const debtAllocation = 100 - equityAllocation;

// Market assumptions
const equityReturn = 0.14;
const equityVolatility = 0.18;

const debtReturn = 0.07;
const debtVolatility = 0.04;


const adjustedMean =
  (equityAllocation / 100) * equityReturn +
  (debtAllocation / 100) * debtReturn;


const adjustedVolatility =
  (equityAllocation / 100) * equityVolatility +
  (debtAllocation / 100) * debtVolatility;


    // To calculate effective working years left and adjust the mean return and volatility accordingly

    const retirementAge = 60;
    const effectiveYears = Math.min(years, retirementAge - age);

    if (effectiveYears <= 0) {
      return res.status(400).json({
        error: "Investment duration exceeds retirement age"
      });
    }

    const simulation = runMonteCarlo(
      sip,
      effectiveYears,
      adjustedMean,
      adjustedVolatility,
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
      simulation.average / Math.pow(1 + inflation, effectiveYears);

    const realWorst =
      simulation.worstCase / Math.pow(1 + inflation, effectiveYears);

    const realBest =
      simulation.bestCase / Math.pow(1 + inflation, effectiveYears);
    
    const explanation = await generateExplanation({
  totalInvestment: sip * 12 * effectiveYears,
  averageValue: simulation.average,
  worstCase: simulation.worstCase,
  bestCase: simulation.bestCase,
  realAverageValue: Math.round(realAverage),
  probabilityOfReachingTarget: probab,
  sipAmount: sip,
  years: effectiveYears,
  riskLevel,
  age,
  monthlyIncome,
  monthlyExpenses,
  monthlySavings: monthlyIncome - monthlyExpenses
    }, mode || "short");


      res.json({
      totalInvestment: sip * 12 * effectiveYears,
      averageValue: simulation.average,
      worstCase: simulation.worstCase,
      bestCase: simulation.bestCase,
      realAverageValue: Math.round(realAverage),
      realWorstCase: Math.round(realWorst),
      realBestCase: Math.round(realBest),
      probabilityOfReachingTarget: probab,
      explanation,
      yearlyGrowth: simulation.yearlyGrowth,
      yearlyAverage: simulation.yearlyAverage,
      yearlyWorst: simulation.yearlyWorst,
      yearlyBest: simulation.yearlyBest,
    });

  } catch (error) {
  console.error("FULL ERROR:", error);
  res.status(500).json({
    error: error.message
  });
}
};
