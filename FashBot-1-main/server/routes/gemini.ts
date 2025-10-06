import type { RequestHandler } from "express";

function getEnv(key: string) {
  return process.env[key] ?? process.env[`VITE_${key}`];
}

const MODEL_REGISTRY: Record<string, string> = {
  "FashBot-GM-VRS-25F": "gemini-2.0-flash",
  "FashBot-2024": "gemini-1.5-flash",
  "FashBot-Lite": "gemini-1.5-flash-8b",
};

interface IncomingMessage {
  role: "user" | "assistant";
  content: string;
}

type GeminiContentPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiContentPart[];
}

async function smartGeminiRequest(
  apiKey: string,
  initialModel: string,
  contents: GeminiContent[],
) {
  const modelCandidates = Array.from(
    new Set(
      [
        initialModel,
        initialModel.replace(/-latest$/, ""),
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-flash-8b",
      ].filter((v) => v !== undefined && v !== null && String(v).length > 0),
    ),
  ) as string[];

  const apiVersions = ["v1beta", "v1"];
  let lastError: { status: number; details: string } = {
    status: 500,
    details: "Unknown error",
  };

  for (const version of apiVersions) {
    for (const model of modelCandidates) {
      const endpoint = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.65,
            topP: 0.9,
            topK: 32,
            maxOutputTokens: 2048,
          },
        }),
      });

      if (response.ok) {
        return (await response.json()) as {
          candidates?: Array<{
            content?: { parts?: Array<{ text?: string }> };
          }>;
        };
      }

      const errorText = await response.text();
      lastError = { status: response.status, details: errorText };

      if (
        !(
          response.status === 404 ||
          /not found|is not supported/i.test(errorText)
        )
      ) {
        throw lastError;
      }
    }
  }

  throw lastError;
}

export const handleGeminiChat: RequestHandler = async (req, res) => {
  const apiKey = getEnv("GEMINI_API_KEY");

  if (!apiKey) {
    res.status(500).json({ error: "Gemini API key is not configured" });
    return;
  }

  const { model, messages, attachments } = req.body as {
    model?: string;
    messages?: IncomingMessage[];
    attachments?: Array<{ mimeType: string; dataBase64: string }>;
  };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "Invalid request payload" });
    return;
  }

  const geminiModel = MODEL_REGISTRY[model ?? ""] ?? "gemini-2.0-flash";

  const contents: GeminiContent[] = messages.map((message) => ({
    role: message.role === "user" ? "user" : "model",
    parts: [{ text: message.content }],
  }));

  // If attachments are present, include them as inlineData for the last user message when supported
  if (attachments && attachments.length > 0) {
    const lastUserIndex = [...messages]
      .reverse()
      .findIndex((m) => m.role === "user");
    if (lastUserIndex !== -1) {
      const actualIndex = messages.length - 1 - lastUserIndex;
      const parts = contents[actualIndex].parts;
      for (const att of attachments) {
        const supported = /^(image|audio|video)\//.test(att.mimeType);
        if (supported && att.dataBase64 && att.dataBase64.length > 0) {
          parts.push({
            inlineData: { mimeType: att.mimeType, data: att.dataBase64 },
          });
        } else {
          parts.push({
            text: `Attachment: ${att.mimeType} (${Math.round(att.dataBase64.length * 0.75)} bytes)`,
          });
        }
      }
    }
  }

  try {
    const result = await smartGeminiRequest(apiKey, geminiModel, contents);

    const messageText = result.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("\n")
      .trim();

    if (!messageText) {
      res.status(502).json({ error: "Gemini response did not include text" });
      return;
    }

    res.json({
      message: messageText,
      explanation: deriveExplanationSegments(messages, messageText),
    });
  } catch (error: any) {
    const status = typeof error?.status === "number" ? error.status : 502;
    const details =
      typeof error?.details === "string" ? error.details : String(error);

    // If Gemini is unavailable or API disabled, attempt fallback to other providers
    const shouldFallback =
      status === 403 ||
      /service_disabled|not configured|is not configured|disabled/i.test(
        details,
      );

    if (shouldFallback) {
      const prompt = messages
        .filter((m) => m.role === "user")
        .map((m) => m.content)
        .join("\n\n");
      const tried: string[] = [];

      async function tryOpenAI() {
        const key = getEnv("OPENAI_API_KEY");
        if (!key) throw new Error("OpenAI key not configured");
        tried.push("openai");
        const url = "https://api.openai.com/v1/chat/completions";
        const body = {
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.6,
          max_tokens: 1400,
        };
        const resp = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify(body),
        });
        if (!resp.ok) throw new Error(`OpenAI failed ${resp.status}`);
        const j = await resp.json();
        const text = j?.choices?.[0]?.message?.content ?? j?.choices?.[0]?.text;
        if (!text) throw new Error("OpenAI returned no content");
        return String(text);
      }

      async function tryQwen() {
        const key = getEnv("QWEN_API_KEY");
        if (!key) throw new Error("Qwen key not configured");
        tried.push("qwen");
        const url = "https://api.qwen.ai/v1/chat/completions";
        const body = {
          model: "qwen-quasi",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        };
        const resp = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify(body),
        });
        if (!resp.ok) throw new Error(`Qwen failed ${resp.status}`);
        const j = await resp.json();
        const text =
          j?.choices?.[0]?.message?.content ??
          j?.choices?.[0]?.text ??
          j?.result;
        if (!text) throw new Error("Qwen returned no content");
        return String(text);
      }

      async function tryAnthropic() {
        const key = getEnv("ANTHROPIC_API_KEY");
        if (!key) throw new Error("Anthropic key not configured");
        tried.push("anthropic");
        const url = "https://api.anthropic.com/v1/complete";
        const body = {
          model: "claude-2.1",
          prompt: `\n\nHuman: ${prompt}\n\nAssistant:`,
          max_tokens_to_sample: 800,
          temperature: 0.7,
        };
        const resp = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify(body),
        });
        if (!resp.ok) throw new Error(`Anthropic failed ${resp.status}`);
        const j = await resp.json();
        const text = j?.completion ?? j?.text;
        if (!text) throw new Error("Anthropic returned no content");
        return String(text);
      }

      async function tryFal() {
        const key = getEnv("FAL_API_KEY");
        if (!key) throw new Error("FAL.ai key not configured");
        tried.push("fal.ai");
        const url = "https://api.fal.ai/generate";
        const body = { model: "gpt-1", instruction: prompt };
        const resp = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify(body),
        });
        if (!resp.ok) throw new Error(`FAL.ai failed ${resp.status}`);
        const j = await resp.json();
        const text =
          j?.output?.[0]?.text ??
          j?.output?.[0]?.content ??
          j?.result ??
          j?.output?.[0]?.url;
        if (!text) throw new Error("FAL.ai returned no content");
        return String(text);
      }

      const attempts = [tryOpenAI, tryQwen, tryAnthropic, tryFal];
      for (const fn of attempts) {
        try {
          const reply = await fn();
          const explanation = deriveExplanationSegments(messages, reply);
          res.json({
            message: reply,
            explanation,
            provider: tried[tried.length - 1] ?? "fallback",
          });
          return;
        } catch (e) {
          console.warn("Fallback provider failed", e);
        }
      }

      res.status(502).json({ error: "All fallback providers failed", tried });
      return;
    }

    res.status(status).json({ error: "Gemini API request failed", details });
  }
};

function deriveExplanationSegments(
  history: IncomingMessage[],
  response: string,
) {
  const contextPreview = history
    .filter((item) => item.role === "user")
    .slice(-2)
    .map((item) => item.content)
    .join(" \u2022 ");

  const structuredResponse = response.split(/\n{2,}/).slice(0, 3);

  const insights = [
    {
      id: "context",
      label: "Kontekstualisasi",
      detail:
        contextPreview.length > 0
          ? `Menafsirkan konteks terbaru: ${truncate(contextPreview, 120)}`
          : "Menyiapkan konteks percakapan awal.",
      confidence: 0.82,
    },
    {
      id: "analysis",
      label: "Analisis Strategis",
      detail: structuredResponse[0]
        ? truncate(structuredResponse[0], 140)
        : "Mengurai permintaan menjadi sub-tugas terukur.",
      confidence: 0.87,
    },
    {
      id: "delivery",
      label: "Rencana Eksekusi",
      detail: structuredResponse[1]
        ? truncate(structuredResponse[1], 140)
        : "Menghasilkan output terstruktur beserta langkah tindak lanjut.",
      confidence: 0.9,
    },
  ];

  return insights;
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}
