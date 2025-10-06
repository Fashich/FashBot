import type { RequestHandler } from "express";
import { spawn } from "node:child_process";
import { Document, Packer, Paragraph, TextRun } from "docx";
import ExcelJS from "exceljs";

function getEnv(key: string) {
  return process.env[key] ?? process.env[`VITE_${key}`];
}

async function fetchJson(url: string, init: RequestInit) {
  const res = await fetch(url, init);
  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  if (!res.ok) {
    const err: any = new Error(`Request failed ${res.status}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

function guessFormatFromPrompt(prompt: string | undefined) {
  const p = String(prompt ?? "").toLowerCase();
  if (/\b(csv)\b/.test(p)) return "csv";
  if (/(excel|xlsx|spreadsheet|tabel)/.test(p)) return "xlsx";
  if (/(word|docx|dokumen|document|proposal|laporan|surat)/.test(p))
    return "docx";
  return "docx";
}

async function makeDocxFromText(text: string) {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: text.split(/\n{2,}/).map(
          (blk) =>
            new Paragraph({
              children: blk.split(/\n/).map(
                (line, idx, arr) =>
                  new TextRun({
                    text: line + (idx < arr.length - 1 ? "\n" : ""),
                  }),
              ),
            }),
        ),
      },
    ],
  });
  const buf = await Packer.toBuffer(doc);
  const b64 = buf.toString("base64");
  return {
    dataUri:
      "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64," +
      b64,
    filename: "document.docx",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  } as const;
}

function parseRows(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.some((l) => l.includes("|"))) {
    return lines
      .map((l) =>
        l
          .replace(/^\s*\|/, "")
          .replace(/\|\s*$/, "")
          .split("|")
          .map((c) => c.trim()),
      )
      .filter((r) => r.length > 0);
  }
  return lines.map((l) => l.split(/\t|,|;\s*/).map((c) => c.trim()));
}

async function makeXlsxFromText(text: string) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Sheet1");
  const rows = parseRows(text);
  if (rows.length === 0) rows.push(["Data", "Value"]);
  rows.forEach((r) => ws.addRow(r));
  const arrBuf = (await wb.xlsx.writeBuffer()) as ArrayBuffer;
  const buf = Buffer.from(new Uint8Array(arrBuf));
  const b64 = buf.toString("base64");
  return {
    dataUri:
      "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64," +
      b64,
    filename: "spreadsheet.xlsx",
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  } as const;
}

async function makeCsvFromText(text: string) {
  const csv = text
    .split(/\r?\n/)
    .map((ln) => ln.replace(/\t/g, ","))
    .join("\n");
  const b64 = Buffer.from(csv).toString("base64");
  return {
    dataUri: `data:text/csv;base64,${b64}`,
    filename: "spreadsheet.csv",
    mime: "text/csv",
  } as const;
}

async function makePlainFromText(text: string) {
  return {
    dataUri: `data:text/plain;base64,${Buffer.from(text).toString("base64")}`,
    filename: "document.txt",
    mime: "text/plain",
  } as const;
}

async function fetchImageAsDataUri(url: string, defaultMime = "image/jpeg") {
  const r = await fetch(url, { redirect: "follow" as RequestRedirect });
  if (!r.ok) throw new Error(`image fetch failed ${r.status}`);
  const mime = r.headers.get("content-type") || defaultMime;
  const buf = Buffer.from(new Uint8Array(await r.arrayBuffer()));
  const b64 = buf.toString("base64");
  return `data:${mime};base64,${b64}`;
}

function buildSvgImageDataUri(prompt: string, width: number, height: number) {
  const w = Math.max(100, Math.min(4096, Math.floor(width)));
  const h = Math.max(100, Math.min(4096, Math.floor(height)));
  const catLike = /(kucing|cat|kitty|meong)/i.test(prompt);
  const emoji = catLike ? "😺" : "🎨";
  const title = String(prompt).slice(0, 80);
  const esc = (s: string) =>
    s.replace(
      /[&<>"]/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
        })[c] as string,
    );
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#60a5fa" />
      <stop offset="50%" stop-color="#a78bfa" />
      <stop offset="100%" stop-color="#f472b6" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <g font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial" fill="#ffffff">
    <text x="50%" y="48%" font-size="${Math.floor(Math.min(w, h) * 0.28)}" text-anchor="middle" dominant-baseline="central">${emoji}</text>
    <text x="50%" y="80%" font-size="${Math.floor(Math.min(w, h) * 0.06)}" text-anchor="middle" opacity="0.9">${esc(title)}</text>
  </g>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function tryPythonPackager(text: string, format?: string) {
  const engine = process.env.PYTHON_BIN || "python3";
  const args = ["python/gen_doc.py"]; // relative path
  const payload = JSON.stringify({ text, format });
  return new Promise<{ dataUri: string; filename: string; mime: string }>(
    (resolve, reject) => {
      try {
        const ps = spawn(engine, args, { stdio: ["pipe", "pipe", "pipe"] });
        let out = "";
        let err = "";
        ps.stdout.on("data", (d) => (out += String(d)));
        ps.stderr.on("data", (d) => (err += String(d)));
        ps.on("error", (e) => reject(e));
        ps.on("close", (code) => {
          if (code !== 0 && !out)
            return reject(new Error(err || `code ${code}`));
          try {
            const parsed = JSON.parse(out);
            if (parsed && parsed.dataUri) return resolve(parsed);
            return reject(
              new Error(parsed?.error || "python packager returned no data"),
            );
          } catch (e) {
            return reject(new Error(`invalid python output: ${out}`));
          }
        });
        ps.stdin.end(payload);
        setTimeout(() => {
          try {
            ps.kill();
          } catch {}
          reject(new Error("python packager timeout"));
        }, 10_000);
      } catch (e) {
        reject(e);
      }
    },
  );
}

async function makeDocumentDataUri(
  content: string,
  format?: string,
  prompt?: string,
  preferPython?: boolean,
) {
  const text = String(content ?? "");
  const fmt = (format ?? guessFormatFromPrompt(prompt)).toLowerCase();

  if (preferPython) {
    try {
      const py = await tryPythonPackager(text, fmt);
      return py;
    } catch {}
  }

  if (fmt === "docx" || fmt === "doc" || fmt === "word")
    return makeDocxFromText(text);
  if (fmt === "xlsx" || fmt === "excel") return makeXlsxFromText(text);
  if (fmt === "csv") return makeCsvFromText(text);
  return makePlainFromText(text);
}

// Provider calls (same as before)
async function tryGeminiGenerate(apiKey: string | undefined, prompt: string) {
  if (!apiKey) throw new Error("Gemini key not configured");
  const models = [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
  ];
  const versions = ["v1beta", "v1"];
  let lastErr: any = null;
  for (const version of versions) {
    for (const model of models) {
      const endpoint = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;
      try {
        const resp = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 1600 },
          }),
        });
        if (!resp.ok) {
          const txt = await resp.text();
          lastErr = { status: resp.status, msg: txt };
          if (
            resp.status === 404 ||
            /not found|is not supported/i.test(String(txt))
          ) {
            continue;
          }
          throw new Error(`Gemini failed ${resp.status}: ${txt}`);
        }
        const j = await resp.json();
        return j;
      } catch (e: any) {
        lastErr = e;
        continue;
      }
    }
  }
  throw lastErr ?? new Error("Gemini generation failed");
}

async function callOpenAIImage(prompt: string, size = "1024x1024") {
  const apiKey = getEnv("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OpenAI key not configured");
  const url = "https://api.openai.com/v1/images/generations";
  const body = {
    model: "gpt-image-1",
    prompt,
    size,
    n: 1,
    response_format: "b64_json",
  } as const;
  const data = await fetchJson(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  const b64 = Array.isArray(data?.data) ? data.data[0]?.b64_json : null;
  if (!b64) throw new Error("OpenAI did not return image data");
  return `data:image/png;base64,${b64}`;
}

async function callOpenAIDocument(prompt: string) {
  const apiKey = getEnv("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OpenAI key not configured");
  const url = "https://api.openai.com/v1/chat/completions";
  const body = {
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant that generates structured documents. Output in markdown when appropriate.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 1600,
  };
  const data = await fetchJson(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  const content =
    data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text;
  if (!content) throw new Error("OpenAI did not return a document");
  return String(content);
}

async function callQwenChat(prompt: string) {
  const apiKey = getEnv("QWEN_API_KEY");
  if (!apiKey) throw new Error("Qwen key not configured");
  const url = "https://api.qwen.ai/v1/chat/completions";
  const body = {
    model: "qwen-quasi",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  } as const;
  const data = await fetchJson(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  const content =
    data?.choices?.[0]?.message?.content ??
    data?.choices?.[0]?.text ??
    data?.result;
  if (!content) throw new Error("Qwen did not return content");
  return String(content);
}

async function callAnthropicComplete(prompt: string) {
  const apiKey = getEnv("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("Anthropic key not configured");
  const url = "https://api.anthropic.com/v1/complete";
  const body = {
    model: "claude-2.1",
    prompt: `\n\nHuman: ${prompt}\n\nAssistant:`,
    max_tokens_to_sample: 1200,
    temperature: 0.7,
  } as const;
  const data = await fetchJson(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  const content = data?.completion ?? data?.text;
  if (!content) throw new Error("Anthropic did not return content");
  return String(content);
}

async function callFalVideo(prompt: string) {
  const apiKey = getEnv("FAL_API_KEY");
  if (!apiKey) throw new Error("FAL.ai key not configured");
  const url = "https://api.fal.ai/generate";
  const body = { model: "vision-video-1", instruction: prompt } as const;
  const data = await fetchJson(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  const urlOrData =
    data?.output?.[0]?.url ?? data?.output?.[0]?.b64 ?? data?.result;
  if (!urlOrData) throw new Error("FAL.ai did not return video data");
  return String(urlOrData);
}

export const handleGenerateImage: RequestHandler = async (req, res) => {
  const { prompt, size } =
    (req.body as { prompt?: string; size?: string }) || {};
  if (!prompt || typeof prompt !== "string")
    return res.status(400).json({ error: "Missing prompt" });
  const providersTried: string[] = [];
  const providerErrors: Record<string, string> = {};
  try {
    providersTried.push("gemini");
    const geminiApiKey = getEnv("GEMINI_API_KEY");
    const g = await tryGeminiGenerate(
      geminiApiKey,
      `Generate an image for the following prompt. Return either a data URL (base64) or an https image URL. Prompt:\n${prompt}`,
    );
    const part = g?.candidates?.[0]?.content?.parts?.[0];
    if (part) {
      if (part.inlineData && part.inlineData.mimeType?.startsWith("image/")) {
        const b64 = part.inlineData.data;
        if (b64)
          return res.json({
            content: `data:${part.inlineData.mimeType};base64,${b64}`,
            provider: "gemini",
          });
      }
      const text = (part as any).text ?? String(part);
      if (typeof text === "string") {
        const maybe = text.trim();
        if (
          /^data:image\//.test(maybe) ||
          /^https?:\/\/.+\.(png|jpg|jpeg|webp|gif)(\?|$)/i.test(maybe)
        ) {
          return res.json({ content: maybe, provider: "gemini" });
        }
      }
    }
  } catch (e) {
    providerErrors["gemini"] = String(e);
  }
  try {
    providersTried.push("openai");
    const img = await callOpenAIImage(prompt, size);
    return res.json({ content: img, provider: "openai" });
  } catch (e) {
    providerErrors["openai"] = String(e);
  }
  try {
    providersTried.push("fal.ai");
    const img = await (async () => {
      const url = "https://api.fal.ai/generate";
      const apiKey = getEnv("FAL_API_KEY");
      if (!apiKey) throw new Error("FAL.ai key not configured");
      const data = await fetchJson(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model: "vision-image-1", instruction: prompt }),
      });
      const out =
        data?.output?.[0]?.url ?? data?.output?.[0]?.b64 ?? data?.result;
      if (!out) throw new Error("FAL.ai did not return image data");
      if (/^([A-Za-z0-9+/=]+)$/.test(String(out)))
        return `data:image/png;base64,${out}`;
      return String(out);
    })();
    return res.json({ content: img, provider: "fal.ai" });
  } catch (e) {
    providerErrors["fal.ai"] = String(e);
  }
  try {
    providersTried.push("qwen");
    const img = await callQwenChat(prompt);
    if (
      typeof img === "string" &&
      (/^data:image\//.test(img) ||
        /^https?:\/\/.+\.(png|jpg|jpeg|webp|gif)(\?|$)/i.test(img))
    ) {
      return res.json({ content: img, provider: "qwen" });
    }
    providerErrors["qwen"] = `non-media response: ${String(img)}`;
  } catch (e) {
    providerErrors["qwen"] = String(e);
  }
  try {
    providersTried.push("anthropic");
    const doc = await callAnthropicComplete(prompt);
    if (
      typeof doc === "string" &&
      (/^data:image\//.test(doc) ||
        /^https?:\/\/.+\.(png|jpg|jpeg|webp|gif)(\?|$)/i.test(doc))
    ) {
      return res.json({ content: doc, provider: "anthropic" });
    }
    providerErrors["anthropic"] = `non-media response: ${String(doc)}`;
  } catch (e) {
    providerErrors["anthropic"] = String(e);
  }
  const unsplashKey =
    getEnv("UNSPLASH_ACCESS_KEY") || getEnv("UNSPLASH_APP_ID");
  if (unsplashKey) {
    try {
      const q = encodeURIComponent(String(prompt).slice(0, 200));
      const u = `https://api.unsplash.com/search/photos?query=${q}&per_page=1`;
      const r = await fetch(u, {
        headers: { Authorization: `Client-ID ${unsplashKey}` },
      });
      if (r.ok) {
        const j = await r.json();
        const hit = j?.results?.[0];
        const url = hit?.urls?.regular ?? hit?.urls?.full ?? hit?.links?.html;
        if (url) {
          try {
            const dataUri = await fetchImageAsDataUri(url);
            return res.json({
              content: dataUri,
              provider: "unsplash",
              tried: providersTried,
              errors: providerErrors,
            });
          } catch {
            return res.json({
              content: url,
              provider: "unsplash-url",
              tried: providersTried,
              errors: providerErrors,
            });
          }
        }
      }
    } catch {}
  }
  const dims =
    typeof size === "string" && /^\d+x\d+$/.test(size)
      ? size.split("x")
      : ["800", "600"];
  const [w, h] = [
    parseInt(dims[0] ?? "800", 10),
    parseInt(dims[1] ?? "600", 10),
  ];

  try {
    const isCat = /(kucing|cat|kitty|meong)/i.test(String(prompt));
    const url = isCat
      ? `https://placekitten.com/${w}/${h}`
      : `https://source.unsplash.com/${w}x${h}/?${encodeURIComponent(String(prompt).split(/\s+/).slice(0, 4).join(","))}`;
    const dataUri = await fetchImageAsDataUri(url);
    return res.json({
      content: dataUri,
      provider: isCat ? "placekitten" : "unsplash-source",
      tried: providersTried,
      errors: providerErrors,
    });
  } catch (e) {
    const dataUri = buildSvgImageDataUri(String(prompt), w, h);
    return res.json({
      content: dataUri,
      provider: "placeholder-svg",
      tried: providersTried,
      errors: providerErrors,
    });
  }
};

export const handleGenerateDocument: RequestHandler = async (req, res) => {
  const { prompt, format, engine, usePython } =
    (req.body as {
      prompt?: string;
      format?: string;
      engine?: string;
      usePython?: boolean;
    }) || {};
  if (!prompt || typeof prompt !== "string")
    return res.status(400).json({ error: "Missing prompt" });

  const preferPython = Boolean(
    usePython || (engine && engine.toLowerCase() === "python"),
  );

  const providersTried: string[] = [];
  const providerErrors: Record<string, string> = {};

  try {
    providersTried.push("gemini");
    const geminiApiKey = getEnv("GEMINI_API_KEY");
    const g = await tryGeminiGenerate(
      geminiApiKey,
      `Generate a structured document for the following prompt. Return the document content in plain text or markdown. Prompt:\n${prompt}`,
    );
    const part = g?.candidates?.[0]?.content?.parts
      ?.map((p: any) => (p as any).text ?? "")
      .join("\n\n")
      .trim();
    if (part && part.length > 0) {
      try {
        const docOut = await makeDocumentDataUri(
          part,
          format,
          prompt,
          preferPython,
        );
        return res.json({
          content: docOut.dataUri,
          filename: docOut.filename,
          mime: docOut.mime,
          provider: preferPython ? "gemini+python" : "gemini",
        });
      } catch (packErr) {
        providerErrors["packager"] = String(packErr);
      }
    }
  } catch (e) {
    providerErrors["gemini"] = String(e);
  }

  try {
    providersTried.push("openai");
    const doc = await callOpenAIDocument(prompt);
    const out = await makeDocumentDataUri(doc, format, prompt, preferPython);
    return res.json({
      content: out.dataUri,
      filename: out.filename,
      mime: out.mime,
      provider: preferPython ? "openai+python" : "openai",
    });
  } catch (e) {
    providerErrors["openai"] = String(e);
  }

  try {
    providersTried.push("qwen");
    const doc = await callQwenChat(prompt);
    const out = await makeDocumentDataUri(doc, format, prompt, preferPython);
    return res.json({
      content: out.dataUri,
      filename: out.filename,
      mime: out.mime,
      provider: preferPython ? "qwen+python" : "qwen",
    });
  } catch (e) {
    providerErrors["qwen"] = String(e);
  }

  try {
    providersTried.push("anthropic");
    const doc = await callAnthropicComplete(prompt);
    const out = await makeDocumentDataUri(doc, format, prompt, preferPython);
    return res.json({
      content: out.dataUri,
      filename: out.filename,
      mime: out.mime,
      provider: preferPython ? "anthropic+python" : "anthropic",
    });
  } catch (e) {
    providerErrors["anthropic"] = String(e);
  }

  res.status(502).json({
    error: "All providers failed to generate document",
    tried: providersTried,
    errors: providerErrors,
  });
};

export const handleGenerateVideo: RequestHandler = async (req, res) => {
  const { prompt } = (req.body as { prompt?: string }) || {};
  if (!prompt || typeof prompt !== "string")
    return res.status(400).json({ error: "Missing prompt" });
  const providersTried: string[] = [];
  const providerErrors: Record<string, string> = {};
  try {
    providersTried.push("gemini");
    const geminiApiKey = getEnv("GEMINI_API_KEY");
    const g = await tryGeminiGenerate(
      geminiApiKey,
      `Generate a short video or provide a link for the following prompt. If possible, return a URL to a generated video or a base64 data URI. Prompt:\n${prompt}`,
    );
    const part = g?.candidates?.[0]?.content?.parts?.[0];
    if (part) {
      if (
        (part as any).inlineData &&
        (part as any).inlineData.mimeType?.startsWith("video/")
      ) {
        const b64 = (part as any).inlineData.data;
        if (b64)
          return res.json({
            content: `data:${(part as any).inlineData.mimeType};base64,${b64}`,
            provider: "gemini",
          });
      }
      const text = (part as any).text ?? String(part);
      if (typeof text === "string") {
        const maybe = text.trim();
        if (
          /^data:video\//.test(maybe) ||
          /^https?:\/\/.+\.(mp4|webm|mov)(\?|$)/i.test(maybe)
        ) {
          return res.json({ content: maybe, provider: "gemini" });
        }
      }
    }
  } catch (e) {
    providerErrors["gemini"] = String(e);
  }
  try {
    providersTried.push("fal.ai");
    const url = await callFalVideo(prompt);
    return res.json({ content: url, provider: "fal.ai" });
  } catch (e) {
    providerErrors["fal.ai"] = String(e);
  }
  try {
    providersTried.push("openai");
    res.status(501).json({
      error: "OpenAI video generation not supported in this endpoint",
    });
    return;
  } catch (e) {
    providerErrors["openai"] = String(e);
  }
  res.status(502).json({
    error: "All providers failed to generate video",
    tried: providersTried,
    errors: providerErrors,
  });
};
