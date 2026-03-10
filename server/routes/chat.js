const express = require("express");
const router = express.Router();

const OLLAMA_BASE = process.env.OLLAMA_URL || "http://localhost:11434";
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || "llama3.2:latest";

router.get("/health", async (req, res) => {
  try {
    const response = await fetch(`${OLLAMA_BASE}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) throw new Error("Ollama returned non-200");
    const data = await response.json();
    const models = (data.models || []).map((m) => m.name);
    const model =
      models.find((m) => m.startsWith(DEFAULT_MODEL)) ||
      models[0] ||
      DEFAULT_MODEL;
    return res.json({ ok: true, model, available: models });
  } catch {
    return res.json({ ok: false, model: DEFAULT_MODEL, available: [] });
  }
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

  try {
    const ollamaRes = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        stream: true,
        options: {
          temperature: 0.7,
          num_predict: 512,
        },
        messages: [
          ...(system ? [{ role: "system", content: system }] : []),
          ...messages,
        ],
      }),
    });

    if (!ollamaRes.ok) {
      const errText = await ollamaRes.text();
      res.write(JSON.stringify({ error: `Ollama error: ${errText}` }) + "\n");
      return res.end();
    }

    const reader = ollamaRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          const token = parsed?.message?.content || "";
          if (token) {
            res.write(JSON.stringify({ token }) + "\n");
          }
          if (parsed.done) {
            res.write(JSON.stringify({ done: true }) + "\n");
          }
        } catch {}
      }
    }

    if (buffer.trim()) {
      try {
        const parsed = JSON.parse(buffer);
        const token = parsed?.message?.content || "";
        if (token) res.write(JSON.stringify({ token }) + "\n");
        if (parsed.done) res.write(JSON.stringify({ done: true }) + "\n");
      } catch {}
    }

    res.end();
  } catch (err) {
    if (!res.writableEnded) {
      res.write(
        JSON.stringify({ error: "Failed to reach Ollama. Is it running?" }) +
          "\n",
      );
      res.end();
    }
  }
});

module.exports = router;
