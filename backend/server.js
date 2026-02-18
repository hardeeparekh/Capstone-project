// require("dotenv").config();

// const express = require('express');
// const bodyParser = require('body-parser');
// const cors = require('cors');
// const SimulationEngine = require('./simulationEngine');
// const LLMService = require('./llmservice'); // Ensure casing matches your file name

// console.log(process.env.GENAI_API_KEY);

// const app = express();
// app.use(cors());
// app.use(bodyParser.json());

// const sessions = {}; 

// app.post('/api/start', (req, res) => {
//   const { level, salary, expenses, initialSavings } = req.body;
//   const id = Date.now().toString();
  
//   sessions[id] = {
//     config: { level },
//     year: 1,
//     maxYears: 15,
    
//     // User State
//     portfolio: parseFloat(initialSavings),
//     cash: 0, 
//     salary: parseFloat(salary),
//     expenses: parseFloat(expenses),
    
//     // Baseline (Ghost) State
//     baseline: {
//       portfolio: parseFloat(initialSavings),
//       cash: 0
//     },

//     history: [] 
//   };
  
//   // Calculate initial surplus for Turn 1
//   const initialSurplus = sessions[id].salary - sessions[id].expenses;
//   sessions[id].cash = Math.max(0, initialSurplus); 

//   res.json({ sessionId: id, state: sessions[id] });
// });

// // NOTICE: Added 'async' here so we can use 'await' for the AI
// app.post('/api/play-year', async (req, res) => {
//   const { sessionId, action, amount } = req.body; 
//   const session = sessions[sessionId];
  
//   if (!session) return res.status(404).json({ error: "Session expired" });

//   // 1. Get Market Conditions
//   // Note: Ensure your simulationEngine exports 'generateMarketConditions' 
//   // (or 'getMarketYear' if you used the Real Data file I gave you).
//   // defaulting to the function name in your snippet:
//   const conditions = SimulationEngine.generateMarketConditions(session.config.level);

//   // 2. User Action
//   if (action === 'invest') {
//     const investAmt = Math.min(amount, session.cash);
//     session.portfolio += investAmt;
//     session.cash -= investAmt;
//   } else if (action === 'withdraw') {
//     const withdrawAmt = Math.min(amount, session.portfolio);
//     session.portfolio -= withdrawAmt;
//     session.cash += withdrawAmt;
//   }

//   // 3. Apply Market Return
//   session.portfolio = session.portfolio * (1 + conditions.marketReturn);

//   // 4. Update Income & Expenses
//   session.expenses = session.expenses * (1 + conditions.inflation);
//   session.salary = session.salary * (1 + conditions.wageGrowth); 
  
//   // 5. Calculate New Surplus
//   let surplus = session.salary - session.expenses;
//   if (surplus < 0) surplus = 0; 
  
//   session.cash += surplus; 

//   // 6. Run Ghost Strategy
//   session.baseline = SimulationEngine.runBaselineStrategy(
//     session.baseline, 
//     session.salary, 
//     session.expenses, 
//     conditions.marketReturn
//   );

//   // 7. Log History
//   session.history.push({
//     year: session.year,
//     return: conditions.marketReturn,
//     event: conditions.event,
//     inflation: conditions.inflation,
//     action: action
//   });

//   session.year += 1;

//   // 8. GAME OVER - CALL REAL AI
//   if (session.year > session.maxYears) {
//     const finalUser = session.portfolio + session.cash;
//     const finalOptimal = session.baseline.portfolio + session.baseline.cash;
//     const diff = finalUser - finalOptimal;

//     // --- REAL AI INTEGRATION ---
//     // We await the response from Google Gemini
//     const reflection = await LLMService.generateReflection(
//       session.history, 
//       Math.round(finalUser), 
//       Math.round(finalOptimal),
//       session.config.level
//     );

//     return res.json({ 
//       finished: true, 
//       reflection: {
//         finalUser: Math.round(finalUser),
//         finalOptimal: Math.round(finalOptimal),
//         difference: Math.round(diff),
//         // We combine the AI's JSON fields into a readable message
//         message: `**${reflection.summary}**\n\n${reflection.detail}\n\n*Mentor Tip: ${reflection.advice}*`
//       }
//     });
//   }

//   res.json({
//     finished: false,
//     state: {
//       year: session.year,
//       portfolio: session.portfolio,
//       cash: session.cash,
//       salary: session.salary,
//       expenses: session.expenses,
//       surplus: surplus 
//     },
//     market: {
//       return: (conditions.marketReturn * 100).toFixed(1) + "%",
//       inflation: (conditions.inflation * 100).toFixed(1) + "%",
//       wageGrowth: (conditions.wageGrowth * 100).toFixed(1) + "%",
//       event: conditions.event
//     }
//   });
// });

// const PORT = 8080;
// app.listen(PORT, () => {
//   console.log(`Real AI Engine running on port ${PORT}`);
// });


require("dotenv").config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Import modules
// Note: Ensure file names match exactly! (Linux/Mac is case-sensitive)
const SimulationEngine = require('./simulationEngine');
const LLMService = require('./llmservice'); 

const app = express();
app.use(cors());
app.use(bodyParser.json());

const sessions = {}; 

// --- FALLBACK LOGIC (The "Mock AI") ---
// We use this if the Real AI fails.
function getFallbackReflection(history, finalUser, finalOptimal) {
  const diff = finalUser - finalOptimal;
  
  // Rule 1: Panic Selling?
  const panicMove = history.find(h => h.isCrash && h.action === 'withdraw');
  if (panicMove) {
    return {
      summary: "Panic Seller!",
      detail: "You withdrew money when the market crashed. This locked in your losses and hurt your long-term growth.",
      advice: "Next time, try to hold or invest more during a crash."
    };
  }

  // Rule 2: Beat the Market?
  if (diff >= 0) {
    return {
      summary: "Market Master!",
      detail: "You beat the baseline strategy! Your timing or consistent investing paid off significantly.",
      advice: "Keep maintaining this discipline in real life."
    };
  }

  // Rule 3: Default
  return {
    summary: "Solid Effort",
    detail: "You finished slightly behind the optimal strategy. Inflation or missed investment opportunities likely played a role.",
    advice: "Try to automate your investments to catch every market upswing."
  };
}


app.post('/api/start', (req, res) => {
  const { level, salary, expenses, initialSavings } = req.body;
  const id = Date.now().toString();
  
  sessions[id] = {
    config: { level: level || "Explorer" },
    year: 1,
    maxYears: 15,
    portfolio: parseFloat(initialSavings) || 0,
    cash: 0, 
    salary: parseFloat(salary) || 50000,
    expenses: parseFloat(expenses) || 30000,
    baseline: {
      portfolio: parseFloat(initialSavings) || 0,
      cash: 0
    },
    history: [] 
  };
  
  // Initial surplus check
  const surplus = sessions[id].salary - sessions[id].expenses;
  sessions[id].cash = Math.max(0, surplus); 

  res.json({ sessionId: id, state: sessions[id] });
});

app.post('/api/play-year', async (req, res) => {
  const { sessionId, action, amount } = req.body; 
  const session = sessions[sessionId];
  
  if (!session) return res.status(404).json({ error: "Session expired" });

  // 1. Get Market Conditions
  // Safe check in case SimulationEngine is missing the function
  const conditions = SimulationEngine.generateMarketConditions 
    ? SimulationEngine.generateMarketConditions(session.config.level)
    : { marketReturn: 0.08, inflation: 0.03, wageGrowth: 0.03, event: "Normal Year" };

  // 2. User Action
  if (action === 'invest') {
    const investAmt = Math.min(Number(amount), session.cash);
    session.portfolio += investAmt;
    session.cash -= investAmt;
  } else if (action === 'withdraw') {
    const withdrawAmt = Math.min(Number(amount), session.portfolio);
    session.portfolio -= withdrawAmt;
    session.cash += withdrawAmt;
  }

  // 3. Apply Market Return
  session.portfolio = session.portfolio * (1 + conditions.marketReturn);

  // 4. Update Income & Expenses
  session.expenses = session.expenses * (1 + conditions.inflation);
  session.salary = session.salary * (1 + conditions.wageGrowth); 
  
  // 5. Calculate New Surplus
  let surplus = session.salary - session.expenses;
  if (surplus < 0) surplus = 0; 
  session.cash += surplus; 

  // 6. Run Ghost Strategy
  if (SimulationEngine.runBaselineStrategy) {
    session.baseline = SimulationEngine.runBaselineStrategy(
      session.baseline, 
      session.salary, 
      session.expenses, 
      conditions.marketReturn
    );
  } else {
    // Fallback math if engine function missing
    const baseSurplus = session.salary - session.expenses;
    session.baseline.portfolio += (baseSurplus * 0.2); 
    session.baseline.portfolio *= (1 + conditions.marketReturn);
  }

  // 7. Log History (Mark if it was a crash for the AI/Logic to see)
  const isCrash = conditions.marketReturn < -0.10;
  session.history.push({
    year: session.year,
    return: (conditions.marketReturn * 100).toFixed(1) + "%",
    event: conditions.event,
    action: action,
    isCrash: isCrash 
  });

  session.year += 1;

  // 8. GAME OVER LOGIC (Hybrid AI)
  if (session.year > session.maxYears) {
    const finalUser = Math.round(session.portfolio + session.cash);
    const finalOptimal = Math.round(session.baseline.portfolio); 
    const diff = finalUser - finalOptimal;

    let reflection;

    // --- TRY REAL AI ---
    try {
      console.log("Attempting to contact AI Mentor...");
      // Check if API key exists before even trying
      if (!process.env.GENAI_API_KEY) throw new Error("No API Key");

      reflection = await LLMService.generateReflection(
        session.history, 
        finalUser, 
        finalOptimal,
        session.config.level
      );
      
      // If AI returns null or empty for some reason, throw to trigger catch
      if (!reflection || !reflection.summary) throw new Error("Empty AI Response");

    } catch (error) {
      // --- CATCH: USE FALLBACK ---
      console.log("⚠️ AI Failed or Offline. Using Logic Fallback.", error.message);
      reflection = getFallbackReflection(session.history, finalUser, finalOptimal);
    }

    // Return the Final Result (works for both AI and Fallback)
    return res.json({ 
      finished: true, 
      reflection: {
        finalUser: finalUser,
        finalOptimal: finalOptimal,
        difference: diff,
        // Ensure message format works for frontend
        message: `**${reflection.summary}**\n\n${reflection.detail}\n\n*Tip: ${reflection.advice}*`,
        details: reflection
      }
    });
  }

  // Normal Turn Response
  res.json({
    finished: false,
    state: {
      year: session.year,
      portfolio: session.portfolio,
      cash: session.cash,
      salary: session.salary,
      expenses: session.expenses,
      surplus: surplus 
    },
    market: {
      return: (conditions.marketReturn * 100).toFixed(1) + "%",
      event: conditions.event
    }
  });
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Hybrid Engine (AI + Fallback) running on port ${PORT}`);
});