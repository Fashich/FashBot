import React, { useState } from "react";
import { puterChat, loadPuter } from "@/lib/puter";

export default function PuterIntegration() {
  const [prompt, setPrompt] = useState(
    "Explain quantum computing in simple terms",
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSend() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      await loadPuter();
      const res = await puterChat(prompt, { model: "claude-sonnet-4.5" });
      // best-effort extraction of text depending on SDK shape
      const text =
        res?.message?.content?.[0]?.text ??
        res?.choices?.[0]?.message?.content?.[0]?.text ??
        res?.message?.text ??
        JSON.stringify(res);
      setResult(String(text));
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-panel p-6 w-full max-w-2xl">
      <h3 className="text-lg font-semibold mb-3">
        Puter.ai — Claude Sonnet demo
      </h3>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="w-full p-2 rounded-md border"
        rows={4}
      />
      <div className="mt-3 flex gap-2">
        <button
          onClick={onSend}
          disabled={loading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          {loading ? "Mengirim..." : "Kirim ke Puter (claude-sonnet-4.5)"}
        </button>
        <button
          onClick={() => {
            setPrompt("Explain quantum computing in simple terms");
            setResult(null);
            setError(null);
          }}
          className="px-3 py-2 border rounded-md"
        >
          Reset
        </button>
      </div>
      {error && <pre className="mt-3 text-destructive">{error}</pre>}
      {result && (
        <div className="mt-3 bg-popover p-3 rounded-md">
          <strong>Response:</strong>
          <div className="mt-2 whitespace-pre-wrap">{result}</div>
        </div>
      )}
    </div>
  );
}
