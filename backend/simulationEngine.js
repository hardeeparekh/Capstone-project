const SimulationEngine = (() => {
  
  // Standard Normal Variate (Bell Curve)
  function randn_bm() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  // --- DYNAMIC DIFFICULTY ---
  // Returns parameters. No hardcoded results, only probability weights.
  function getLevelParams(levelName) {
    switch (levelName) {
      case "Explorer": // Easy: High growth, low inflation, no crashes
        return { mu: 0.08, sigma: 0.05, inflation: 0.02, wageGrowth: 0.03, shockProb: 0.0 }; 
      case "Analyst": // Normal: Realistic market, steady inflation
        return { mu: 0.10, sigma: 0.15, inflation: 0.04, wageGrowth: 0.025, shockProb: 0.10 }; 
      case "Strategist": // Hard: High volatility, high inflation, stagnant wages
        return { mu: 0.12, sigma: 0.25, inflation: 0.06, wageGrowth: 0.01, shockProb: 0.25 }; 
      default: 
        return { mu: 0.08, sigma: 0.05, inflation: 0.02, wageGrowth: 0.03, shockProb: 0.0 };
    }
  }

  // --- GENERATE RANDOM YEAR ---
  function generateMarketConditions(levelName) {
    const params = getLevelParams(levelName);
    
    // 1. Market Return (Random Walk)
    let r = params.mu + params.sigma * randn_bm();

    // 2. Shock Logic
    let event = "Normal";
    if (Math.random() < params.shockProb) {
      r = -0.30; // Crash
      event = "CRASH";
    } else if (r > 0.25) {
      event = "BOOM";
    }

    // 3. Inflation & Wage Growth (Randomized around mean)
    // We add small noise so it's not the exact same % every year
    let yearlyInflation = params.inflation + (randn_bm() * 0.005); 
    let yearlyWageGrowth = params.wageGrowth + (randn_bm() * 0.005);
    
    // Sanity clamps
    if (yearlyInflation < 0) yearlyInflation = 0;
    if (yearlyWageGrowth < -0.05) yearlyWageGrowth = -0.05; // Wages rarely drop 5% without firing

    return { 
      marketReturn: r, 
      inflation: yearlyInflation, 
      wageGrowth: yearlyWageGrowth,
      event 
    };
  }

  // --- THE GHOST (Baseline Strategy) ---
  // The ghost adapts to the SAME market conditions the user faces
  function runBaselineStrategy(prevBaseline, income, expenses, marketReturn) {
    let surplus = income - expenses;
    if (surplus < 0) surplus = 0;

    // Ghost Rule: Invest 90% of surplus, Keep 10% Cash
    const investAmount = surplus * 0.90; 
    const cashKeep = surplus * 0.10;

    const newPortfolio = (prevBaseline.portfolio + investAmount) * (1 + marketReturn);
    const newCash = prevBaseline.cash + cashKeep;

    return {
      portfolio: newPortfolio,
      cash: newCash
    };
  }

  return {
    generateMarketConditions,
    runBaselineStrategy
  };
})();

module.exports = SimulationEngine;