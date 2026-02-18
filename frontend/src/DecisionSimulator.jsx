import React, { useState } from 'react';

export default function DecisionSimulator() {
  const [phase, setPhase] = useState('setup'); 
  const [level, setLevel] = useState('Analyst');
  
  // Game Data
  const [sessionId, setSessionId] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [lastMarket, setLastMarket] = useState(null);
  const [result, setResult] = useState(null);

  // --- USER PROFILE INPUTS (No Hardcoding) ---
  const [salary, setSalary] = useState(60000);
  const [expenses, setExpenses] = useState(30000);
  const [savings, setSavings] = useState(10000);
  
  // Slider (0-100%)
  const [sliderVal, setSliderVal] = useState(50); 

  async function startGame() {
    // Send ALL user inputs to backend
    const res = await fetch('http://localhost:8080/api/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        level, 
        salary: Number(salary), 
        expenses: Number(expenses), 
        initialSavings: Number(savings) 
      })
    });
    const data = await res.json();
    setSessionId(data.sessionId);
    setGameState(data.state);
    setPhase('playing');
  }

  async function playTurn(actionType) {
    let amount = 0;
    // Calculate amount based on slider percentage of available funds
    if (actionType === 'invest') {
      amount = gameState.cash * (sliderVal / 100);
    } else if (actionType === 'withdraw') {
      amount = gameState.portfolio * (sliderVal / 100);
    }

    const res = await fetch('http://localhost:8080/api/play-year', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, action: actionType, amount })
    });
    
    const data = await res.json();

    if (data.finished) {
      setResult(data.reflection);
      setPhase('finished');
    } else {
      setGameState(data.state);
      setLastMarket(data.market);
      setSliderVal(50); 
    }
  }

  // --- VIEW: SETUP ---
  if (phase === 'setup') {
    return (
      <div className="p-8 max-w-md mx-auto bg-white rounded-xl shadow-lg mt-10">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Financial Life Simulator</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Difficulty</label>
            <select value={level} onChange={e => setLevel(e.target.value)} className="w-full border p-2 rounded">
              <option value="Explorer">Explorer (Easy)</option>
              <option value="Analyst">Analyst (Normal)</option>
              <option value="Strategist">Strategist (Hard)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Annual Salary</label>
            <input type="number" value={salary} onChange={e=>setSalary(e.target.value)} className="w-full border p-2 rounded"/>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Annual Expenses</label>
            <input type="number" value={expenses} onChange={e=>setExpenses(e.target.value)} className="w-full border p-2 rounded"/>
            <p className="text-xs text-gray-400">Include rent, food, bills.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Current Savings</label>
            <input type="number" value={savings} onChange={e=>setSavings(e.target.value)} className="w-full border p-2 rounded"/>
          </div>
        </div>

        <button onClick={startGame} className="w-full mt-6 bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700">
          Start Journey
        </button>
      </div>
    );
  }

  // --- VIEW: PLAYING ---
  if (phase === 'playing') {
    const isCrash = lastMarket?.event === "CRASH";

    return (
      <div className="p-6 max-w-2xl mx-auto bg-slate-50 min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Year {gameState.year} / 15</h1>
          {lastMarket && (
             <div className="text-right text-sm">
                <div className={isCrash ? "text-red-600 font-bold" : "text-gray-600"}>
                  Market: {lastMarket.return}
                </div>
                <div className="text-orange-500">
                  Inflation: {lastMarket.inflation}
                </div>
             </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded shadow border-l-4 border-blue-500">
            <p className="text-xs uppercase font-bold text-gray-500">Portfolio</p>
            <p className="text-2xl font-bold text-blue-600">₹{Math.round(gameState.portfolio).toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded shadow border-l-4 border-green-500">
            <p className="text-xs uppercase font-bold text-gray-500">Cash (Savings)</p>
            <p className="text-2xl font-bold text-green-600">₹{Math.round(gameState.cash).toLocaleString()}</p>
          </div>
        </div>

        {/* Life Stats */}
        <div className="bg-gray-200 p-3 rounded mb-6 flex justify-between text-sm">
           <span>Salary: ₹{Math.round(gameState.salary).toLocaleString()}</span>
           <span className="text-red-600">Expenses: ₹{Math.round(gameState.expenses).toLocaleString()}</span>
           <span className="font-bold text-green-700">Surplus: ₹{Math.round(gameState.surplus).toLocaleString()}</span>
        </div>

        {/* Action Center */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="font-bold text-lg mb-4 text-center">Decide Allocation</h3>
          
          <div className="mb-6 px-4">
            <input 
              type="range" min="0" max="100" value={sliderVal} 
              onChange={(e) => setSliderVal(e.target.value)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-center font-bold text-blue-600 mt-2">{sliderVal}%</div>
          </div>

          <div className="grid grid-cols-3 gap-3">
             <button onClick={() => playTurn('invest')} className="bg-green-600 text-white py-3 rounded hover:bg-green-700">
               Invest<br/><span className="text-xs">₹{Math.round(gameState.cash * (sliderVal/100)).toLocaleString()}</span>
             </button>

             <button onClick={() => playTurn('hold')} className="bg-gray-200 text-gray-700 py-3 rounded hover:bg-gray-300">
               Do Nothing
             </button>

             <button onClick={() => playTurn('withdraw')} className="bg-red-50 text-red-600 border border-red-200 py-3 rounded hover:bg-red-100">
               Sell<br/><span className="text-xs">₹{Math.round(gameState.portfolio * (sliderVal/100)).toLocaleString()}</span>
             </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'finished') {
    return (
      <div className="p-8 max-w-md mx-auto bg-white rounded-xl shadow-xl mt-10">
        <h2 className="text-3xl font-bold mb-6 text-center">Final Results</h2>
        <div className="space-y-4 mb-6">
          <div className="flex justify-between">
            <span>Your Net Worth:</span>
            <span className="font-bold">₹{result.finalUser.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-gray-500">
             <span>Optimal Strategy:</span>
             <span>₹{result.finalOptimal.toLocaleString()}</span>
          </div>
          <div className={`p-2 rounded font-bold text-center ${result.difference >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            Difference: {result.difference > 0 ? '+' : ''}₹{result.difference.toLocaleString()}
          </div>
        </div>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="text-sm text-yellow-900">{result.message}</p>
        </div>
        <button onClick={() => setPhase('setup')} className="w-full mt-6 bg-gray-800 text-white py-3 rounded">Play Again</button>
      </div>
    );
  }
}
