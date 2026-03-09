function randomNormal() {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function getLevelParams(levelName) {
  switch (levelName) {
    case "Explorer":
      return {
        meanReturn: 0.08,
        volatility: 0.05,
        inflation: 0.02,
        wageGrowth: 0.03,
        crashChance: 0.0
      };
    case "Strategist":
      return {
        meanReturn: 0.12,
        volatility: 0.25,
        inflation: 0.06,
        wageGrowth: 0.01,
        crashChance: 0.25
      };
    case "Analyst":
    default:
      return {
        meanReturn: 0.1,
        volatility: 0.15,
        inflation: 0.04,
        wageGrowth: 0.025,
        crashChance: 0.1
      };
  }
}

function generateMarketConditions(levelName) {
  const params = getLevelParams(levelName);
  let marketReturn = params.meanReturn + params.volatility * randomNormal();

  let event = "Normal";
  if (Math.random() < params.crashChance) {
    marketReturn = -0.3;
    event = "CRASH";
  } else if (marketReturn > 0.25) {
    event = "BOOM";
  }

  let inflation = params.inflation + randomNormal() * 0.005;
  let wageGrowth = params.wageGrowth + randomNormal() * 0.005;

  if (inflation < 0) inflation = 0;
  if (wageGrowth < -0.05) wageGrowth = -0.05;

  return {
    marketReturn,
    inflation,
    wageGrowth,
    event
  };
}

function runBaselineStrategy(previousBaseline, salary, expenses, marketReturn) {
  let surplus = salary - expenses;
  if (surplus < 0) surplus = 0;

  const investAmount = surplus * 0.9;
  const cashAmount = surplus * 0.1;

  return {
    portfolio: (previousBaseline.portfolio + investAmount) * (1 + marketReturn),
    cash: previousBaseline.cash + cashAmount
  };
}

module.exports = {
  generateMarketConditions,
  runBaselineStrategy
};
