const express = require("express");
const router = express.Router();

const DEFAULT_MODEL = "groq/compound-mini";

router.get("/health", async (req, res) => {
  const hasKey = Boolean(process.env.GROQ_API_KEY);
  return res.json({
    ok: hasKey,
    model: DEFAULT_MODEL,
    provider: "Groq Cloud LPU",
    available: [
      "groq/compound-mini",
      "groq/compound",
      "qwen/qwen3.6-27b",
    ],
  });
});

router.post("/", async (req, res) => {
  const { messages = [], system = "" } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array required" });
  }

  res.setHeader("Content-Type", "application/x-ndjson");
  res.setHeader("Transfer-Encoding", "chunked");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    res.write(
      JSON.stringify({
        token:
          "⚠️ **GROQ_API_KEY missing.**\n\nAdd `GROQ_API_KEY=gsk_...` to your `server/.env` file to enable lightning-fast streaming with Groq Cloud!",
      }) + "\n",
    );
    res.write(JSON.stringify({ done: true }) + "\n");
    return res.end();
  }

  try {
    const groqRes = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          stream: true,
          temperature: 0.7,
          max_tokens: 512,
          messages: [
            ...(system ? [{ role: "system", content: system }] : []),
            ...messages,
          ],
        }),
      },
    );

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      res.write(
        JSON.stringify({ error: `Groq error (${groqRes.status}): ${errText}` }) +
          "\n",
      );
      return res.end();
    }

    const reader = groqRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let insideThink = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;

        const dataStr = trimmed.slice(6);
        if (dataStr === "[DONE]") {
          res.write(JSON.stringify({ done: true }) + "\n");
          continue;
        }

        try {
          const parsed = JSON.parse(dataStr);
          let token = parsed?.choices?.[0]?.delta?.content || "";
          
          if (token.includes("<think>")) {
            insideThink = true;
            token = token.replace(/<think>[\s\S]*/, "");
          }
          if (insideThink) {
            if (token.includes("</think>")) {
              insideThink = false;
              token = token.replace(/[\s\S]*?<\/think>/, "");
            } else {
              token = "";
            }
          }

          if (token) {
            res.write(JSON.stringify({ token }) + "\n");
          }
        } catch {}
      }
    }

    res.write(JSON.stringify({ done: true }) + "\n");
    res.end();
  } catch (err) {
    if (!res.writableEnded) {
      res.write(
        JSON.stringify({ error: `Failed to reach Groq API: ${err.message}` }) +
          "\n",
      );
      res.end();
    }
  }
});

module.exports = router;
