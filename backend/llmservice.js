// // const API_KEY = 'AIzaSyCPgVjR3BmPX1TTOxlMcJ95Jj_XKmsK714';

// // llmService.js
// // using the new @google/genai SDK

// // 1. Setup
// // const { GoogleGenAI } = require("@google/genai");

// // --- PASTE YOUR REAL KEY HERE ---
// // const API_KEY = "AIzaSyBIr2UCQoIcNOJOsK2g3O2SItt5rgdvD8I"; 

// // llmService.js

// require("dotenv").config();

// const { GoogleGenAI } = require("@google/genai");

// const API_KEY = process.env.GENAI_API_KEY; // <- set this in env, don't hardcode
// console.log("Loaded API Key:", API_KEY ? "✅ Present" : "❌ Missing");
// if (!API_KEY) throw new Error("Set GEMINI/GENAI API key: export GENAI_API_KEY=...");

// const ai = new GoogleGenAI({
//   apiKey: process.env.GENAI_API_KEY
// });
// console.log("GoogleGenAI client initialized.");

// const LLMService = (() => {
//   async function generateReflection(history, finalUser, finalOptimal, level) {
    
//     try {
//       console.log("🤖 Asking Gemini for advice...");

//       const prompt = `
// You are a financial mentor in a simulation game.

// Game Stats:
// - Level: ${level}
// - User Wealth: $${finalUser}
// - Optimal Wealth: $${finalOptimal}

// User History: ${JSON.stringify(history)}

// Analyze their performance and answer in JSON with keys: summary, detail, advice.
// Respond ONLY with valid JSON, e.g.
// { "summary":"...", "detail":"...", "advice":"..." }
// `;

//       const response = await ai.models.generateContent({
//         model: "gemini-1.5-flash", // try gemini-1.5-pro if flash gives issues
//         contents: prompt,
//         config: {
//           // Ask explicitly for JSON
//           responseMimeType: "application/json",
//           // Optional: strict schema to help controlled generation
//           responseSchema: {
//             type: "object",
//             properties: {
//               summary: { type: "string" },
//               detail: { type: "string" },
//               advice: { type: "string" }
//             },
//             required: ["summary", "detail", "advice"]
//           }
//         }
//       });
//       console.log("Raw response received from Gemini.");

//       // Helpful debug: print the whole SDK response once (comment out when stable)
//       console.log("raw response:", JSON.stringify(response, null, 2));

//       // Best-effort extraction of text:
//       let text;
//       if (typeof response.text === "function") {
//         text = response.text();
//       } else if (response.candidates && response.candidates[0]) {
//         // fallback shape some SDKs use
//         text = response.candidates[0].content?.[0]?.text || response.candidates[0].text;
//       } else {
//         text = JSON.stringify(response);
//       }

//       console.log("✅ AI Response (raw text):", text);

//       // Try robust parsing: direct JSON, then extract JSON substring
//       try {
//         return JSON.parse(text);
//       } catch (parseErr) {
//         // try to extract first {...} block
//         const m = text.match(/\{[\s\S]*\}/);
//         if (m) {
//           try { return JSON.parse(m[0]); } catch (e) { /* fallthrough */ }
//         }
//         // if still failing, throw a clear error so outer catch logs it
//         throw new Error("Failed to parse JSON from model response.");
//       }

//     } catch (error) {
//       // log full error details for debugging
//       console.error("\n🔴 AI ERROR:", error?.message || error, error?.stack || "");
//       // If the SDK returned HTTP info, print status/message (helpful for auth/rate limit)
//       if (error?.response) {
//         try { console.error("status:", error.response.status, "data:", error.response.data); } catch {}
//       }

//       return {
//         summary: "Simulation Finished",
//         detail: "Could not connect to AI mentor: " + (error?.message || "unknown error"),
//         advice: "Consistency is key."
//       };
//     }
//   }

//   return { generateReflection };
// })();

// // module.exports = LLMService;


// // // This is NOT AI. It is just smart 'if' statements.
// // // NO API KEY REQUIRED.

// // const LLMService = (() => {
// //   function generateReflection(history, finalUser, finalOptimal) {
// //     const diff = finalUser - finalOptimal;

// //     // Rule 1: Did they win?
// //     if (diff >= 0) {
// //       return { 
// //         summary: "You beat the market!", 
// //         detail: "Your aggressive strategy paid off this time." 
// //       };
// //     } 
    
// //     // Rule 2: Did they panic sell?
// //     // We check the history array for 'withdraw' actions during 'CRASH' events
// //     const panicSells = history.filter(h => h.event === 'CRASH' && h.action === 'withdraw');
    
// //     if (panicSells.length > 0) {
// //       return {
// //         summary: "You panicked.",
// //         detail: "You sold your investments when the market was down. This locked in your losses."
// //       };
// //     }

// //     // Default Rule
// //     return {
// //       summary: "You played it too safe.",
// //       detail: "You held too much cash and inflation ate your profits."
// //     };
// //   }

// //   return { generateReflection };
// // })();

// module.exports = LLMService;


require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = process.env.GENAI_API_KEY;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

console.log("GoogleGenAI client initialized in llmService.js.");
console.log(API_KEY)

async function generateReflection(history, finalUser, finalOptimal, level) {
  try {
    console.log("🤖 Asking Gemini for advice...");

    const prompt = `
      You are a financial mentor in a simulation game.
      
      Game Stats:
      - Level: ${level}
      - User Wealth: $${finalUser}
      - Optimal Wealth: $${finalOptimal}
      
      User History: ${JSON.stringify(history)}
      
      Respond ONLY with valid JSON (no markdown):
      {
        "summary": "Short headline",
        "detail": "2 sentences on their performance",
        "advice": "One actionable tip"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Cleanup Markdown formatting if Gemini adds it
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    return JSON.parse(text);

  } catch (error) {
    console.error("🔴 AI Error:", error.message);
    return {
      summary: "Simulation Complete",
      detail: "AI connection failed, but you finished the run!",
      advice: "Compare your score to the optimal wealth manually."
    };
  }
}

// CRITICAL FIX: Export it correctly
module.exports = { generateReflection };