import React, { useState, useEffect, useCallback } from "react";
import "./EconomicDashboard.css";

const MF_FUNDS = [
  {
    code: "119598",
    name: "SBI Bluechip",
    type: "Large Cap",
    risk: "Moderate",
    color: "#2563eb",
  },
  {
    code: "118834",
    name: "Mirae Large Cap",
    type: "Large Cap",
    risk: "Moderate",
    color: "#7c3aed",
  },
  {
    code: "120843",
    name: "Axis Midcap",
    type: "Mid Cap",
    risk: "High",
    color: "#d97706",
  },
  {
    code: "125354",
    name: "Parag Parikh Flexi",
    type: "Flexi Cap",
    risk: "Moderate",
    color: "#059669",
  },
];

export const WATCHLIST_CATEGORIES = [
  {
    id: "crypto",
    label: "Crypto",
    symbol: "BTC",
    desc: "BTC & ETH vs USD",
    freq: "real-time",
    items: [
      { id: "btc", label: "Bitcoin", unit: "USD", symbol: "BTC" },
      { id: "eth", label: "Ethereum", unit: "USD", symbol: "ETH" },
    ],
  },
  {
    id: "sectors",
    label: "NSE Sectors",
    symbol: "NSE",
    desc: "Nifty sector indices",
    freq: "delayed ~15 min",
    items: [
      { id: "niftyit", label: "Nifty IT", unit: "pts", symbol: "IT" },
      { id: "niftybank", label: "Nifty Bank", unit: "pts", symbol: "BNK" },
      { id: "niftyauto", label: "Nifty Auto", unit: "pts", symbol: "AUT" },
      { id: "niftypharma", label: "Nifty Pharma", unit: "pts", symbol: "PHR" },
    ],
  },
  {
    id: "us",
    label: "US Markets",
    symbol: "US",
    desc: "S&P 500 & NASDAQ",
    freq: "delayed ~15 min",
    items: [
      { id: "sp500", label: "S&P 500", unit: "pts", symbol: "SPX" },
      { id: "nasdaq", label: "NASDAQ", unit: "pts", symbol: "NDX" },
    ],
  },
];

async function fetchYahooQuote(ticker) {
  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`;
  const strategies = [
    async () => {
      const r = await fetch(
        `https://corsproxy.io/?${encodeURIComponent(yahooUrl)}`,
        { signal: AbortSignal.timeout(8000) },
      );
      if (!r.ok) throw new Error(`corsproxy ${r.status}`);
      return r.json();
    },
    async () => {
      const r = await fetch(
        `https://api.allorigins.win/raw?url=${encodeURIComponent(yahooUrl)}`,
        { signal: AbortSignal.timeout(9000) },
      );
      if (!r.ok) throw new Error(`allorigins raw ${r.status}`);
      return r.json();
    },
    async () => {
      const r = await fetch(
        `https://api.allorigins.win/get?url=${encodeURIComponent(yahooUrl)}`,
        { signal: AbortSignal.timeout(9000) },
      );
      if (!r.ok) throw new Error(`allorigins get ${r.status}`);
      const w = await r.json();
      if (!w?.contents) throw new Error("empty");
      return JSON.parse(w.contents);
    },
  ];
  let lastErr;
  for (const s of strategies) {
    try {
      const d = await s();
      const meta = d?.chart?.result?.[0]?.meta;
      if (!meta?.regularMarketPrice) throw new Error("no price");
      const price = meta.regularMarketPrice;
      const prev = meta.chartPreviousClose;
      const ch = prev ? ((price - prev) / prev) * 100 : null;
      return {
        val: Number(price).toLocaleString("en-IN", {
          maximumFractionDigits: 2,
        }),
        raw: price,
        up: ch == null ? true : ch >= 0,
        change: ch != null ? (ch >= 0 ? "+" : "") + ch.toFixed(2) + "%" : null,
        chNum: ch,
        live: true,
      };
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error(`All proxies failed for ${ticker}: ${lastErr?.message}`);
}

async function fetchExtraData(categoryIds) {
  const result = {};
  const has = (id) => categoryIds.includes(id);

  if (has("crypto")) {
    try {
      const r = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true",
        { signal: AbortSignal.timeout(8000) },
      );
      if (!r.ok) throw new Error("CoinGecko failed");
      const d = await r.json();
      ["bitcoin:btc", "ethereum:eth"].forEach((pair) => {
        const [coin, key] = pair.split(":");
        const p = d?.[coin]?.usd,
          ch = d?.[coin]?.usd_24h_change;
        if (p)
          result[key] = {
            val: "$" + Number(p).toLocaleString("en-US"),
            raw: p,
            up: ch >= 0,
            change:
              ch != null ? (ch >= 0 ? "+" : "") + ch.toFixed(2) + "%" : null,
            chNum: ch,
            live: true,
            src: "coingecko.com",
          };
        else result[key] = { val: null, error: "Fetch failed" };
      });
    } catch {
      result.btc = result.eth = { val: null, error: "Fetch failed" };
    }
  }

  if (has("sectors")) {
    const map = {
      niftyit: "^CNXIT",
      niftybank: "^NSEBANK",
      niftyauto: "^CNXAUTO",
      niftypharma: "^CNXPHARMA",
    };
    const entries = Object.entries(map);
    const settled = await Promise.allSettled(
      entries.map(([, t]) => fetchYahooQuote(t)),
    );
    entries.forEach(([key], i) => {
      result[key] =
        settled[i].status === "fulfilled"
          ? { ...settled[i].value, unit: "pts", src: "Yahoo Finance" }
          : { val: null, error: "Fetch failed" };
    });
  }

  if (has("us")) {
    const [sp, nq] = await Promise.allSettled([
      fetchYahooQuote("^GSPC"),
      fetchYahooQuote("^IXIC"),
    ]);
    result.sp500 =
      sp.status === "fulfilled"
        ? { ...sp.value, unit: "pts", src: "Yahoo Finance" }
        : { val: null, error: "Fetch failed" };
    result.nasdaq =
      nq.status === "fulfilled"
        ? { ...nq.value, unit: "pts", src: "Yahoo Finance" }
        : { val: null, error: "Fetch failed" };
  }

  return result;
}
async function fetchInflation() {
  const url =
    "https://api.tradingeconomics.com/india/inflation-rate?c=guest:guest&format=json";

  const r = await fetch(url, { signal: AbortSignal.timeout(8000) });

  if (!r.ok) throw new Error("Inflation fetch failed");

  const d = await r.json();

  if (!Array.isArray(d) || !d.length) throw new Error("Invalid inflation data");

  return {
    value: parseFloat(d[0].Value),
    date: d[0].Date,
  };
}

// async function fetchWorldBank(code) {
//   const r = await fetch(
//     `https://api.worldbank.org/v2/country/IN/indicator/${code}?format=json&mrv=3&mrnev=1`,
//     { signal: AbortSignal.timeout(8000) },
//   );
//   if (!r.ok) throw new Error(`WB ${r.status}`);
//   const json = await r.json();
//   const pts = json?.[1];
//   if (!Array.isArray(pts)) throw new Error("bad response");
//   const latest = pts.find((p) => p?.value != null);
//   if (!latest) throw new Error("no data");
//   return { value: latest.value, year: latest.date };
// }
async function fetchRBIRepoRate() {
  const url =
    "https://api.tradingeconomics.com/india/interest-rate?c=guest:guest&format=json";

  const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error("Repo rate fetch failed");

  const d = await r.json();

  if (!Array.isArray(d) || !d.length) throw new Error("Invalid repo data");

  return parseFloat(d[0].Value);
}
// async function fetchRBIRepoRate() {
//   const rbiUrl = "https://www.rbi.org.in/Scripts/bs_viewcontent.aspx?Id=4";
//   const proxies = [
//     `https://corsproxy.io/?${encodeURIComponent(rbiUrl)}`,
//     `https://api.allorigins.win/raw?url=${encodeURIComponent(rbiUrl)}`,
//     `https://api.allorigins.win/get?url=${encodeURIComponent(rbiUrl)}`,
//   ];
//   let html = "";
//   for (const p of proxies) {
//     try {
//       const r = await fetch(p, { signal: AbortSignal.timeout(10000) });
//       if (!r.ok) continue;
//       const body = await r.text();
//       try {
//         const parsed = JSON.parse(body);
//         html = parsed?.contents || body;
//       } catch {
//         html = body;
//       }
//       if (html.length > 500) break;
//     } catch {
//       continue;
//     }
//   }
//   if (!html) throw new Error("proxies failed");
//   const m = html.match(/Policy\s+Repo\s+Rate[\s\S]{0,300}?(\d+\.\d+)\s*%/i);
//   if (!m) throw new Error("not found");
//   return parseFloat(m[1]);
// }

export async function fetchLiveMarket() {
  const result = {
    usdInr: { val: null, up: false },
    eurInr: { val: null, up: false },
    gbpInr: { val: null, up: true },
    inflation: null,
    inflationYear: null,
    gdp: null,
    gdpYear: null,
    repoRate: null,
    mfs: MF_FUNDS.map((f) => ({ ...f, nav: null, change: null, up: true })),
  };

  await Promise.allSettled([
    (async () => {
      const r = await fetch("https://open.er-api.com/v6/latest/USD", {
        signal: AbortSignal.timeout(6000),
      });
      const d = await r.json();
      if (d?.rates?.INR) {
        result.usdInr.val = d.rates.INR.toFixed(2);
        result.usdInr.up = d.rates.INR < 84;
      }
      if (d?.rates?.EUR && d?.rates?.INR) {
        const e = d.rates.INR / d.rates.EUR;
        result.eurInr.val = e.toFixed(2);
        result.eurInr.up = e < 90;
      }
      if (d?.rates?.GBP && d?.rates?.INR) {
        const g = d.rates.INR / d.rates.GBP;
        result.gbpInr.val = g.toFixed(2);
        result.gbpInr.up = g < 106;
      }
    })(),
    fetchInflation()
      .then(({ value, date }) => {
        result.inflation = value.toFixed(1) + "%";
        result.inflationYear = date.slice(0, 4);
      })
      .catch((err) => console.error("Inflation error:", err)),
    fetchInflation("NY.GDP.MKTP.KD.ZG")
      .then(({ value, year }) => {
        result.gdp = value.toFixed(1) + "%";
        result.gdpYear = year;
      })
      .catch(() => {}),
    fetchRBIRepoRate()
      .then((rate) => {
        result.repoRate = rate.toFixed(2) + "%";
      })
      .catch(() => {}),
    ...MF_FUNDS.map((fund, i) =>
      fetch(`https://api.mfapi.in/mf/${fund.code}/latest`, {
        signal: AbortSignal.timeout(6000),
      })
        .then((r) => r.json())
        .then((d) => {
          const nav = parseFloat(d?.data?.[0]?.nav),
            prev = parseFloat(d?.data?.[1]?.nav);
          if (!isNaN(nav)) {
            result.mfs[i].nav = nav.toFixed(2);
            result.mfs[i].up = nav >= prev;
            result.mfs[i].change = !isNaN(prev)
              ? (nav >= prev ? "+" : "") +
                (((nav - prev) / prev) * 100).toFixed(2) +
                "%"
              : null;
          }
        })
        .catch(() => {}),
    ),
  ]);
  return result;
}

function getMacroMeta(m) {
  const usd = parseFloat(m?.usdInr?.val) || 85;
  const eur = parseFloat(m?.eurInr?.val) || 92;
  const gbp = parseFloat(m?.gbpInr?.val) || 107;
  const repo = parseFloat(m?.repoRate) || 5.25;
  const cpi = parseFloat(m?.inflation) || 2.75;
  const gdp = parseFloat(m?.gdp) || 6.4;

  const usdSig = usd > 86 ? "weak" : usd > 83 ? "neutral" : "strong";
  const repoSig = repo >= 6.0 ? "tight" : repo >= 5.0 ? "neutral" : "loose";
  const cpiSig = cpi > 6 ? "high" : cpi > 4 ? "moderate" : "low";
  const gdpSig = gdp >= 7 ? "strong" : gdp >= 5 ? "moderate" : "weak";

  return [
    {
      id: "usd",
      symbol: "$₹",
      label: "USD / INR",
      val: "₹" + usd.toFixed(2),
      unit: "per $1",
      up: usd < 84,
      sentiment:
        usdSig === "strong"
          ? "positive"
          : usdSig === "weak"
            ? "negative"
            : "neutral",
      badge:
        usdSig === "strong"
          ? "Rupee Strong"
          : usdSig === "weak"
            ? "USD Storng"
            : "Rupee Stable",
      src: "open.er-api.com",
      freq: "real-time",
      what: "Rupees needed to buy one US dollar.",
      why: "The primary forex pair for India. A weaker rupee raises import costs — fuel, electronics — pushing inflation higher. A stronger rupee helps importers but pressures IT exporters.",
      now:
        usdSig === "strong"
          ? `At ₹${usd.toFixed(2)}, the rupee is firm. Import costs are lower — favourable for fuel prices and foreign travel.`
          : usdSig === "weak"
            ? `At ₹${usd.toFixed(2)}, the rupee is under pressure. Expect higher fuel and electronics prices. RBI may intervene.`
            : `At ₹${usd.toFixed(2)}, the rupee is range-bound. No immediate stress on import prices.`,
      investor:
        usdSig === "weak"
          ? "A weak rupee amplifies returns on international funds (US ETFs) for Indian investors. Consider selective global diversification."
          : "Stable rupee means domestic equity and debt returns are unaffected by currency drag.",
      range: "Recent range: ₹82–88",
      tip:
        usdSig === "weak"
          ? "Consider US equity ETFs or international funds to hedge INR depreciation risk."
          : "No currency hedge required at this level.",
    },
    {
      id: "eur",
      symbol: "€₹",
      label: "EUR / INR",
      val: "₹" + eur.toFixed(2),
      unit: "per €1",
      up: eur < 90,
      sentiment: eur < 90 ? "positive" : "negative",
      badge: eur < 90 ? "Rupee Firm" : "Euro Strong",
      src: "open.er-api.com",
      freq: "real-time",
      what: "Rupees needed to buy one Euro.",
      why: "Relevant for European machinery imports, pharma APIs, luxury goods, and for students or travelers headed to Europe.",
      now: `At ₹${eur.toFixed(2)}, European imports are ${eur > 92 ? "expensive" : "reasonably priced"} for Indian buyers.`,
      investor:
        "EUR/INR matters for European equity fund investors — a rising EUR/INR adds a currency tailwind on top of market returns.",
      range: "Typical range: ₹87–95",
      tip: "Relevant for investors in European funds and students planning to study in Europe.",
    },
    {
      id: "gbp",
      symbol: "£₹",
      label: "GBP / INR",
      val: "₹" + gbp.toFixed(2),
      unit: "per £1",
      up: gbp < 106,
      sentiment: gbp < 106 ? "positive" : "negative",
      badge: gbp < 106 ? "Pound Steady" : "Pound Strong",
      src: "open.er-api.com",
      freq: "real-time",
      what: "Rupees needed to buy one British pound.",
      why: "Key for the Indian diaspora in the UK sending remittances home, UK students, and UK-India services trade.",
      now: `At ₹${gbp.toFixed(2)}, remittances from the UK convert to ${gbp > 106 ? "more rupees — a silver lining for families receiving money" : "a moderate amount in rupees"}.`,
      investor:
        "NRIs in the UK: a high GBP/INR makes India investing expensive in pound terms but rewarding when converting back.",
      range: "Typical range: ₹100–110",
      tip: "High GBP/INR is beneficial for NRI remittances incoming to India.",
    },
    {
      id: "repo",
      symbol: "%",
      label: "RBI Repo Rate",
      val: repo.toFixed(2) + "%",
      unit: "per annum",
      up: false,
      sentiment:
        repoSig === "tight"
          ? "negative"
          : repoSig === "loose"
            ? "positive"
            : "neutral",
      badge:
        repoSig === "tight"
          ? "Tight Policy"
          : repoSig === "loose"
            ? "Accommodative"
            : "Neutral Stance",
      src: "rbi.org.in",
      freq: "changes ~6×/year",
      what: "The rate at which RBI lends overnight money to commercial banks — the anchor of India's interest rate ecosystem.",
      why: "When RBI raises repo, home loans and EMIs increase to fight inflation. When it cuts, credit becomes cheaper to stimulate growth.",
      now:
        repoSig === "tight"
          ? `At ${repo}%, RBI is restrictive. Home loans are elevated (~8.5–9.5%). Fixed deposits offer attractive returns (~7–8%).`
          : `At ${repo}%, RBI is accommodative. Home loans are cheaper. Rate cuts tend to be a tailwind for equity markets.`,
      investor:
        repoSig === "tight"
          ? "Lock in long-duration fixed deposits now. Short-duration debt funds are attractive. Stay consistent with equity SIPs."
          : "Consider shifting FD allocation to equity. Debt fund returns may soften with further cuts.",
      range: "Last 5 years: 4.0%–6.5%",
      tip:
        repoSig === "tight"
          ? "Ideal time to lock in 3–5 yr FDs at elevated rates before the rate cycle turns."
          : "Equity becomes relatively more attractive when rates are low.",
    },
    {
      id: "cpi",
      symbol: "CPI",
      label: "India CPI Inflation",
      val: cpi.toFixed(1) + "%",
      unit: "% YoY",
      up: false,
      sentiment:
        cpiSig === "low"
          ? "positive"
          : cpiSig === "high"
            ? "negative"
            : "neutral",
      badge:
        cpiSig === "high"
          ? "Above Target"
          : cpiSig === "low"
            ? "Well Controlled"
            : "Near Target",
      src: "World Bank API",
      freq: "annual · lags ~6–12 months",
      what: "Consumer Price Index — how much more everyday goods cost vs a year ago.",
      why: "Inflation is the silent erosion of wealth. If investments return 10% but inflation is 6%, your real return is only 4%. RBI targets 4% CPI (±2% band).",
      now:
        cpiSig === "high"
          ? `At ${cpi}%, inflation exceeds RBI's comfort zone. Your ₹100 today buys only ₹${(100 / (1 + cpi / 100)).toFixed(1)} worth of goods next year.`
          : cpiSig === "low"
            ? `At ${cpi}%, inflation is well-controlled. Real returns on investments are healthy. RBI has room to cut rates.`
            : `At ${cpi}%, inflation is within RBI's 2–6% tolerance. Purchasing power is reasonably protected.`,
      investor: `Your portfolio must return at least ${cpi}% just to preserve value. Equity SIPs targeting 12% deliver ~${(12 - cpi).toFixed(1)}% real return. FDs at 7% yield only ${(7 - cpi).toFixed(1)}% real.`,
      range: "RBI target: 4% (±2% band). Comfort zone: 4–6%",
      tip: `Real return = nominal return − inflation. At ${cpi}% CPI, any investment below this level loses purchasing power.`,
    },
    {
      id: "gdp",
      symbol: "GDP",
      label: "GDP Growth Rate",
      val: gdp.toFixed(1) + "%",
      unit: "% annual",
      up: true,
      sentiment:
        gdpSig === "strong"
          ? "positive"
          : gdpSig === "weak"
            ? "negative"
            : "neutral",
      badge:
        gdpSig === "strong"
          ? "Fastest Major Economy"
          : gdpSig === "moderate"
            ? "Steady Growth"
            : "Slowdown Alert",
      src: "World Bank API",
      freq: "annual · lags ~6–12 months",
      what: "How fast India's total economic output grew vs the previous year.",
      why: "GDP growth drives corporate earnings, job creation, and equity markets. India at 6–8% is among the fastest-growing major economies globally.",
      now:
        gdpSig === "strong"
          ? `At ${gdp}%, India grows faster than China, the US, and most of Europe. This macro backdrop is constructive for equity investors.`
          : gdpSig === "moderate"
            ? `At ${gdp}%, India is growing steadily. Services and domestic consumption are the primary engines.`
            : `At ${gdp}%, growth has moderated. Watch for policy stimulus — rate cuts or fiscal spending could follow.`,
      investor:
        gdpSig === "strong"
          ? "Strong GDP is a tailwind for equity SIPs. Broad-market index funds and flexi-cap funds are well-positioned."
          : "Even in slower phases, disciplined SIPs smooth out cycles. Maintain SIP amounts in slowdowns — you accumulate more units at lower prices.",
      range: "India's avg GDP growth (2000–2024): ~6.5%",
      tip: "High GDP doesn't guarantee immediate market returns — but over 5–10 years, GDP growth and equity returns are strongly correlated.",
    },
  ];
}

function getMFMeta(fund) {
  const p = {
    119598: {
      desc: "India's top 100 companies. Low churn, high stability.",
      strategy:
        "Buy and hold India's blue-chips — Reliance, HDFC, Infosys, TCS.",
      idealFor: "Conservative equity investors, 5+ yr horizon",
      note: "Low expense ratio. Strong for core portfolio allocation.",
    },
    118834: {
      desc: "Mirae's flagship large-cap with a quality-growth tilt.",
      strategy:
        "Focuses on companies with strong ROE, low debt, consistent earnings growth.",
      idealFor: "Core portfolio holding, first-time equity investors",
      note: "Among the lowest expense ratios in the category.",
    },
    120843: {
      desc: "Mid-caps (rank 101–250 by market cap) — higher growth potential.",
      strategy:
        "Captures 'emerging large-caps' — companies growing faster than the index.",
      idealFor: "Aggressive investors, 7+ yr horizon",
      note: "Mid-caps can 2–3× large-cap returns — but carry 2× the drawdowns.",
    },
    125354: {
      desc: "Flexi Cap with up to 35% in international stocks.",
      strategy:
        "Concentrated, high-conviction portfolio. Global diversification built in.",
      idealFor: "Investors who want one fund — Indian + global exposure",
      note: "Value-investing principles, managed by PPFAS team.",
    },
  };
  return (
    p[fund.code] || {
      desc: "Diversified equity mutual fund.",
      strategy: "",
      idealFor: "",
      note: "",
    }
  );
}

function computeOverallSentiment(macros) {
  const scores = macros.map((m) =>
    m.sentiment === "positive" ? 1 : m.sentiment === "negative" ? -1 : 0,
  );
  const total = scores.reduce((a, b) => a + b, 0);
  if (total >= 3)
    return {
      label: "Bullish",
      color: "#059669",
      bg: "rgba(5,150,105,0.06)",
      trend: "up",
    };
  if (total <= -3)
    return {
      label: "Bearish",
      color: "#dc2626",
      bg: "rgba(220,38,38,0.06)",
      trend: "down",
    };
  if (total >= 1)
    return {
      label: "Cautiously Optimistic",
      color: "#2563eb",
      bg: "rgba(37,99,235,0.06)",
      trend: "up",
    };
  if (total <= -1)
    return {
      label: "Cautious",
      color: "#d97706",
      bg: "rgba(217,119,6,0.06)",
      trend: "neutral",
    };
  return {
    label: "Mixed Signals",
    color: "#6d28d9",
    bg: "rgba(109,40,217,0.06)",
    trend: "neutral",
  };
}

// NEW: Real yield calculator
function RealYieldCalculator({ inflation }) {
  const infl = parseFloat(inflation) || 5;
  const instruments = [
    { name: "Savings Account", nominal: 3.5 },
    { name: "FD (1 Year)", nominal: 7.0 },
    { name: "PPF", nominal: 7.1 },
    { name: "Nifty50 SIP (hist.)", nominal: 12.0 },
    { name: "Mid Cap SIP (hist.)", nominal: 15.0 },
  ];
  return (
    <div className="eco-yield-calc">
      <div className="eco-yield-title">
        Real Returns After {infl}% Inflation
      </div>
      <div className="eco-yield-rows">
        {instruments.map((inst) => {
          const real = inst.nominal - infl;
          const positive = real > 0;
          return (
            <div key={inst.name} className="eco-yield-row">
              <span className="eco-yield-name">{inst.name}</span>
              <div className="eco-yield-bar-wrap">
                <div className="eco-yield-bar-track">
                  <div
                    className={`eco-yield-bar-fill ${positive ? "eco-yield-bar--pos" : "eco-yield-bar--neg"}`}
                    style={{ width: `${Math.min(100, Math.abs(real) * 6)}%` }}
                  />
                </div>
              </div>
              <span
                className={`eco-yield-val ${positive ? "eco-yield-val--pos" : "eco-yield-val--neg"}`}
              >
                {positive ? "+" : ""}
                {real.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
      <p className="eco-yield-note">
        Historical SIP returns are illustrative · past performance ≠ future
        results
      </p>
    </div>
  );
}

function SIPCalculator({ fund, inflation }) {
  const [sip, setSip] = useState(5000);
  const [years, setYears] = useState(10);
  const [rate, setRate] = useState(12);

  const months = years * 12;
  const r = rate / 100 / 12;
  const fv = sip * ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
  const invested = sip * months;
  const gains = fv - invested;
  const infl = parseFloat(inflation) || 5;
  const realRate = ((1 + rate / 100) / (1 + infl / 100) - 1) * 100;
  const rr = realRate / 100 / 12;
  const realFV = sip * ((Math.pow(1 + rr, months) - 1) / rr) * (1 + rr);
  const xirr = ((fv / invested) ** (1 / years) - 1) * 100;

  const fmt = (n) => "₹" + Math.round(n).toLocaleString("en-IN");

  return (
    <div className="sip-calc" onClick={(e) => e.stopPropagation()}>
      <div className="sip-title">SIP Calculator</div>
      <div className="sip-controls">
        <div className="sip-control">
          <label>Monthly SIP</label>
          <div className="sip-input-row">
            <span className="sip-prefix">₹</span>
            <input
              type="number"
              value={sip}
              min={500}
              max={500000}
              step={500}
              onChange={(e) => setSip(Number(e.target.value))}
            />
          </div>
          <input
            type="range"
            value={sip}
            min={500}
            max={100000}
            step={500}
            onChange={(e) => setSip(Number(e.target.value))}
            className="sip-range"
          />
        </div>
        <div className="sip-control">
          <label>
            Duration: <strong>{years} yrs</strong>
          </label>
          <input
            type="range"
            value={years}
            min={1}
            max={30}
            step={1}
            onChange={(e) => setYears(Number(e.target.value))}
            className="sip-range"
          />
        </div>
        <div className="sip-control">
          <label>
            Expected return: <strong>{rate}%</strong>
          </label>
          <input
            type="range"
            value={rate}
            min={6}
            max={20}
            step={0.5}
            onChange={(e) => setRate(Number(e.target.value))}
            className="sip-range"
          />
        </div>
      </div>
      <div className="sip-results">
        <div className="sip-result-card sip-invested">
          <div className="sip-r-label">Total Invested</div>
          <div className="sip-r-val">{fmt(invested)}</div>
        </div>
        <div className="sip-result-card sip-gains">
          <div className="sip-r-label">Wealth Gained</div>
          <div className="sip-r-val">{fmt(gains)}</div>
        </div>
        <div className="sip-result-card sip-fv">
          <div className="sip-r-label">Maturity Value</div>
          <div className="sip-r-val sip-r-big">{fmt(fv)}</div>
        </div>
        <div className="sip-result-card sip-real">
          <div className="sip-r-label">Inflation-adjusted</div>
          <div className="sip-r-val sip-r-muted">{fmt(realFV)}</div>
          <div className="sip-r-sub">
            at {infl}% CPI · {realRate.toFixed(1)}% real rate
          </div>
        </div>
      </div>
      {/* NEW: XIRR insight */}
      <div className="sip-xirr-row">
        <span className="sip-xirr-label">Effective CAGR on investment</span>
        <span className="sip-xirr-val">{xirr.toFixed(1)}%</span>
      </div>
      <div className="sip-bar-wrap">
        <div
          className="sip-bar-invested"
          style={{ width: Math.min((invested / fv) * 100, 100) + "%" }}
        />
        <div
          className="sip-bar-gains"
          style={{ width: Math.min((gains / fv) * 100, 100) + "%" }}
        />
      </div>
      <div className="sip-bar-legend">
        <span>
          <span className="sip-dot sip-dot-invested" />
          Invested
        </span>
        <span>
          <span className="sip-dot sip-dot-gains" />
          Gains
        </span>
      </div>
      <p className="sip-disclaimer">
        Illustrative only · past performance does not guarantee future results
      </p>
    </div>
  );
}

function MacroCard({ s, loading }) {
  const [open, setOpen] = useState(false);
  const colors = {
    positive: "#059669",
    negative: "#dc2626",
    neutral: "#6d28d9",
  };
  const bgs = {
    positive: "rgba(5,150,105,0.06)",
    negative: "rgba(220,38,38,0.06)",
    neutral: "rgba(109,40,217,0.06)",
  };
  const color = colors[s.sentiment];
  const isLive = s.freq === "real-time";

  return (
    <div
      className={
        "eco-card" +
        (open ? " eco-card--open" : "") +
        " eco-card--" +
        s.sentiment
      }
      style={{ "--card-color": color, "--card-bg": bgs[s.sentiment] }}
      onClick={() => setOpen((o) => !o)}
    >
      <div className="eco-card-header">
        <div className="eco-card-symbol">{s.symbol}</div>
        <div
          className="eco-card-badge"
          style={{ color, background: bgs[s.sentiment] }}
        >
          {s.sentiment === "positive"
            ? "▲"
            : s.sentiment === "negative"
              ? "▼"
              : "●"}{" "}
          {s.badge}
        </div>
      </div>
      <div className="eco-card-value">
        {loading ? (
          <span className="eco-shimmer eco-shimmer--lg" />
        ) : (
          <span className="eco-card-num" style={{ color }}>
            {s.val}
          </span>
        )}
        <span className="eco-card-unit">{s.unit}</span>
      </div>
      <div className="eco-card-label">{s.label}</div>
      <div className="eco-card-teaser">{s.what}</div>
      <div className="eco-card-footer">
        <span
          className={
            "eco-freq " + (isLive ? "eco-freq--live" : "eco-freq--lag")
          }
        >
          {isLive ? "● LIVE" : s.freq}
        </span>
        <span className="eco-card-toggle">{open ? "Hide" : "Explain"}</span>
      </div>
      {open && (
        <div className="eco-card-detail" onClick={(e) => e.stopPropagation()}>
          <div className="eco-detail-row eco-detail-row--highlight">
            <div className="eco-dl">Current situation</div>
            <div className="eco-dt">{s.now}</div>
          </div>
          <div className="eco-detail-row">
            <div className="eco-dl">Why it matters</div>
            <div className="eco-dt">{s.why}</div>
          </div>
          <div className="eco-detail-row">
            <div className="eco-dl">Portfolio impact</div>
            <div className="eco-dt">{s.investor}</div>
          </div>
          <div className="eco-card-tip">{s.tip}</div>
          <div className="eco-card-meta">
            <span>{s.range}</span>
            <span className="eco-card-src">{s.src}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function WatchlistCard({ item, cat, data, loading }) {
  const [open, setOpen] = useState(false);
  const d = data;
  const isError = d?.error;
  const isLive = cat.freq === "real-time";

  return (
    <div
      className={
        "wl-card" +
        (open ? " wl-card--open" : "") +
        (isError ? " wl-card--error" : d?.up ? " wl-card--up" : " wl-card--dn")
      }
      onClick={() => setOpen((o) => !o)}
    >
      <div className="wl-card-header">
        <span className="wl-card-symbol">{item.symbol}</span>
        <span
          className={
            "eco-freq eco-freq--sm " +
            (isLive ? "eco-freq--live" : "eco-freq--lag")
          }
        >
          {isLive ? "● LIVE" : "~15m"}
        </span>
      </div>
      <div className="wl-card-val">
        {loading || !d ? (
          <span className="eco-shimmer eco-shimmer--md" />
        ) : isError ? (
          <span className="wl-card-err">—</span>
        ) : (
          d.val
        )}
      </div>
      {d?.change && !isError && (
        <div
          className={
            "wl-card-change " + (d.up ? "wl-change--up" : "wl-change--dn")
          }
        >
          {d.up ? "▲" : "▼"} {d.change}
        </div>
      )}
      <div className="wl-card-label">{item.label}</div>
      <div className="wl-card-unit">{d?.unit || item.unit}</div>
      {open && (
        <div className="wl-card-detail" onClick={(e) => e.stopPropagation()}>
          {isError ? (
            <p className="wl-detail-err">API unavailable. Try refreshing.</p>
          ) : (
            <p className="wl-detail-ok">Source: {d?.src || "Public API"}</p>
          )}
        </div>
      )}
    </div>
  );
}

function UserWatchlist({ strategy }) {
  const defaultFor = (s) => (s === "Aggressive" ? ["crypto", "us"] : ["us"]);
  const [selected, setSelected] = useState(() => defaultFor(strategy));
  const [extraData, setExtraData] = useState({});
  const [fetching, setFetching] = useState(false);
  const [lastAt, setLastAt] = useState(null);

  const toggle = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const load = useCallback(async () => {
    if (!selected.length) {
      setExtraData({});
      return;
    }
    setFetching(true);
    const data = await fetchExtraData(selected);
    setExtraData(data);
    setFetching(false);
    setLastAt(
      new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    );
  }, [selected]);

  useEffect(() => {
    load();
  }, [load]);

  const activeCats = WATCHLIST_CATEGORIES.filter((c) =>
    selected.includes(c.id),
  );

  return (
    <div className="wl-wrap">
      <div className="wl-header">
        <div className="wl-header-left">
          <div>
            <div className="wl-title">Market Watchlist</div>
            <div className="wl-sub">Select categories to monitor</div>
          </div>
        </div>
        <div className="wl-header-right">
          {fetching && <span className="eco-fetching">Fetching…</span>}
          {lastAt && !fetching && (
            <button className="wl-refresh" onClick={load}>
              Refresh · {lastAt}
            </button>
          )}
        </div>
      </div>
      <div className="wl-toggles">
        {WATCHLIST_CATEGORIES.map((cat) => {
          const on = selected.includes(cat.id);
          const isLive = cat.freq === "real-time";
          return (
            <button
              key={cat.id}
              className={"wl-toggle" + (on ? " wl-toggle--on" : "")}
              onClick={() => toggle(cat.id)}
            >
              <span className="wl-t-symbol">{cat.symbol}</span>
              <div className="wl-t-info">
                <span className="wl-t-label">{cat.label}</span>
                <span
                  className={
                    "eco-freq eco-freq--xs " +
                    (isLive ? "eco-freq--live" : "eco-freq--lag")
                  }
                >
                  {isLive ? "● live" : "delayed"}
                </span>
              </div>
              {on && <span className="wl-t-check">✓</span>}
            </button>
          );
        })}
      </div>
      {selected.length === 0 ? (
        <div className="wl-empty">
          <p>Select a category to begin tracking</p>
        </div>
      ) : (
        <div className="wl-grid">
          {activeCats.map((cat) =>
            cat.items.map((item) => (
              <WatchlistCard
                key={item.id}
                item={item}
                cat={cat}
                data={extraData[item.id]}
                loading={fetching}
              />
            )),
          )}
        </div>
      )}
    </div>
  );
}

function MFCard({ fund, loading, inflation }) {
  const [open, setOpen] = useState(false);
  const meta = getMFMeta(fund);
  const riskColor =
    fund.risk === "High"
      ? "#d97706"
      : fund.risk === "Low"
        ? "#059669"
        : "#2563eb";

  return (
    <div
      className={"mf-card" + (open ? " mf-card--open" : "")}
      style={{ "--mf-color": fund.color }}
      onClick={() => setOpen((o) => !o)}
    >
      <div className="mf-card-stripe" />
      <div className="mf-card-top">
        <div className="mf-card-left">
          <div className="mf-card-name">{fund.name}</div>
          <div className="mf-card-tags">
            <span className="mf-tag">{fund.type}</span>
            <span
              className="mf-tag mf-tag--risk"
              style={{
                color: riskColor,
                borderColor: riskColor + "40",
                background: riskColor + "10",
              }}
            >
              {fund.risk} Risk
            </span>
          </div>
          <div className="mf-card-desc">{meta.desc}</div>
        </div>
        <div className="mf-card-right">
          {loading || fund.nav === null ? (
            <span className="eco-shimmer eco-shimmer--md" />
          ) : (
            <span className="mf-nav" style={{ color: fund.color }}>
              ₹{fund.nav}
            </span>
          )}
          {fund.change && (
            <span
              className={
                "mf-change " + (fund.up ? "mf-change--up" : "mf-change--dn")
              }
            >
              {fund.up ? "▲" : "▼"} {fund.change}
            </span>
          )}
          <span className="eco-freq eco-freq--lag eco-freq--xs">Daily NAV</span>
          <span className="mf-toggle">{open ? "▲" : "▼"}</span>
        </div>
      </div>
      {open && (
        <div className="mf-detail" onClick={(e) => e.stopPropagation()}>
          <div className="mf-detail-grid">
            <div className="mf-detail-block">
              <div className="mf-dl">Strategy</div>
              <div className="mf-dt">{meta.strategy}</div>
            </div>
            <div className="mf-detail-block mf-detail-block--highlight">
              <div className="mf-dl">Ideal for</div>
              <div className="mf-dt">{meta.idealFor}</div>
            </div>
            <div className="mf-detail-block">
              <div className="mf-dl">Note</div>
              <div className="mf-dt">{meta.note}</div>
            </div>
          </div>
          <SIPCalculator fund={fund} inflation={inflation} />
        </div>
      )}
    </div>
  );
}

export default function EconomicDashboard({
  market,
  loading,
  updatedAt,
  strategy = "Moderate",
}) {
  const macros = getMacroMeta(market);
  const mfs =
    market?.mfs ??
    MF_FUNDS.map((f) => ({ ...f, nav: null, change: null, up: true }));
  const overall = computeOverallSentiment(macros);
  const inflation = market?.inflation || null;

  return (
    <section className="eco-wrap">
      <div className="eco-header">
        <div className="eco-header-left">
          <div>
            <h2 className="eco-title">Economic Pulse</h2>
            <p className="eco-subtitle">
              Live Indian macro indicators · Click any card for portfolio
              implications
            </p>
          </div>
        </div>
        <div className="eco-header-right">
          {loading && <span className="eco-fetching">Fetching…</span>}
          {updatedAt && !loading && (
            <span className="eco-updated">Updated {updatedAt}</span>
          )}
        </div>
      </div>

      {!loading && (
        <div
          className="eco-sentiment-banner"
          style={{ background: overall.bg, borderColor: overall.color + "30" }}
        >
          <div
            className="eco-sent-indicator"
            style={{ background: overall.color }}
          />
          <div>
            <div className="eco-sent-label" style={{ color: overall.color }}>
              Macro Outlook: <strong>{overall.label}</strong>
            </div>
            <div className="eco-sent-sub">
              {macros.filter((m) => m.sentiment === "positive").length} positive
              · {macros.filter((m) => m.sentiment === "neutral").length} neutral
              · {macros.filter((m) => m.sentiment === "negative").length}{" "}
              negative across 6 indicators
            </div>
          </div>
        </div>
      )}

      <div className="eco-macro-grid">
        {macros.map((s) => (
          <MacroCard key={s.id} s={s} loading={loading} />
        ))}
      </div>

      {/* NEW: Real yield comparison */}
      {inflation && <RealYieldCalculator inflation={inflation} />}

      <div className="eco-section-head">
        <div>
          <span className="eco-section-label">Mutual Fund NAVs</span>
          <span className="eco-section-sub">
            {" "}
            · Click to explore and calculate SIP returns
          </span>
        </div>
        <span className="eco-freq eco-freq--lag">Daily · api.mfapi.in</span>
      </div>

      <div className="eco-mf-grid">
        {mfs.map((fund, i) => (
          <MFCard key={i} fund={fund} loading={loading} inflation={inflation} />
        ))}
      </div>

      <UserWatchlist strategy={strategy} />

      <div className="eco-footer">
        <span>
          open.er-api.com · api.mfapi.in · World Bank API · rbi.org.in ·
          CoinGecko · Yahoo Finance
        </span>
        <span className="eco-footer-disc">
          Educational purposes only · not financial advice
        </span>
      </div>
    </section>
  );
}
