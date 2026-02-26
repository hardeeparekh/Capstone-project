function runMonteCarlo(sip, years, meanReturn, volatility, runs = 200) {
  const allPaths = [];
  
  const yearlyTotals = Array(years).fill(0);
  for (let i = 0; i < runs; i++) {
    let portfolio = 0;
    const yearlyPath = [];

    for (let y = 0; y < years; y++) {
      const randomShock = (Math.random() * 2 - 1) * volatility;
      const annualReturn = meanReturn + randomShock;

      portfolio = (portfolio + sip * 12) * (1 + annualReturn);
      yearlyPath.push(portfolio);
    }

    allPaths.push(yearlyPath);
  }

  const finalValues = allPaths
    .map(path => path[years - 1])
    .sort((a, b) => a - b);

  const averageFinal =
    finalValues.reduce((sum, val) => sum + val, 0) / runs;

  const worstFinal = finalValues[Math.floor(runs * 0.1)];
  const bestFinal = finalValues[Math.floor(runs * 0.9)];

  // Year-wise percentile calculations
  const yearlyAverage = [];
  const yearlyWorst = [];
  const yearlyBest = [];

  for (let y = 0; y < years; y++) {
    const yearValues = allPaths
      .map(path => path[y])
      .sort((a, b) => a - b);

    yearlyAverage.push({
      year: y + 1,
      value: Math.round(
        yearValues.reduce((sum, val) => sum + val, 0) / runs
      )
    });

    yearlyWorst.push({
      year: y + 1,
      value: Math.round(yearValues[Math.floor(runs * 0.1)])
    });

    yearlyBest.push({
      year: y + 1,
      value: Math.round(yearValues[Math.floor(runs * 0.9)])
    });
  }

  return {
    average: Math.round(averageFinal),
    worstCase: Math.round(worstFinal),
    bestCase: Math.round(bestFinal),
    allResults: finalValues,
    yearlyAverage,
    yearlyWorst,
    yearlyBest
  };
}

module.exports = { runMonteCarlo };
