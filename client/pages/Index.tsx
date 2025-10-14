import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import AttachMenu from "@/components/ui/AttachMenu";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AppShell } from "@/components/layout/AppShell";
import { cn } from "@/lib/utils";
import { FASHBOT_LOGO_URL } from "@/lib/constants";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  BarChart3,
  Code2,
  GraduationCap,
  Orbit,
  Palette,
  Paperclip,
  Mic,
  Send,
  Sparkles,
  Workflow,
  Edit3,
  X,
  Video,
  Headphones,
  Cpu,
} from "lucide-react";

const HISTORY_KEY = "fashbot-gm-vrs-25f-history";

// Integration categories for MCP Server submenu
const INTEGRATION_CATEGORIES: Record<string, string[]> = {
  "Databases & Storage": [
    "Supabase",
    "Neon",
    "Postgres",
    "MySQL",
    "MongoDB",
    "MongoDB Atlas",
    "Redis",
    "MinIO",
    "S3",
    "Firebase",
  ],
  "AI & Models": [
    "OpenAI",
    "Anthropic",
    "Gemini",
    "Qwen",
    "FAL",
    "JSON2Video",
    "Kie.ai",
    "Bytez",
    "Puter.js",
    "Claude (via Puter)",
  ],
  "Hosting & CI/CD": [
    "Netlify",
    "Vercel",
    "Railway",
    "Render",
    "Heroku",
    "GitHub Actions",
    "CircleCI",
  ],
  "Monitoring & Observability": [
    "Sentry",
    "Datadog",
    "NewRelic",
    "Prometheus",
    "Grafana",
    "Honeycomb",
  ],
  "Media & Streaming": [
    "Cloudinary",
    "Mux",
    "Vimeo",
    "YouTube",
    "Cloudflare Images",
    "Cloudflare Stream",
  ],
  "Productivity & Docs": ["Notion", "Confluence", "Google Drive", "Dropbox"],
  "Payments & Commerce": ["Stripe", "PayPal", "Shopify"],
  Others: [
    "Zapier",
    "IFTTT",
    "n8n",
    "Airbyte",
    "Algolia",
    "Prisma Postgres",
    "Builder.io",
  ],
};

interface ExplanationSegment {
  id: string;
  label: string;
  detail: string;
  confidence: number;
}

type ChatRole = "user" | "assistant";

interface AttachmentMeta {
  id: string;
  name: string;
  mimeType: string;
  size: number;
}

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  pending?: boolean;
  explanation?: ExplanationSegment[];
  createdAt: string;
  attachments?: AttachmentMeta[];
}

const capabilities = [
  "Membaca & menganalisis dokumen PDF",
  "Menyusun laporan & proposal profesional",
  "Menghasilkan video sesuai permintaan",
  "Analisis gambar multimodal dengan akurasi tinggi",
  "Coding lintas bahasa pemrograman",
  "Visualisasi data statistik komprehensif",
  "Membangun agen otomatisasi AI mandiri",
];

const multimodalBannerText =
  "Kekuatan Multimodal FashBot Membaca & menganalisis dokumen PDF Menyusun laporan & proposal profesional Menghasilkan video sesuai permintaan Analisis gambar multimodal dengan akurasi tinggi Coding lintas bahasa pemrograman Visualisasi data statistik komprehensif Membangun agen otomatisasi AI mandiri";

const moreActions = [
  {
    id: "research",
    title: "Penelitian Akademis",
    description:
      "Rancang eksperimen, kelola literatur, dan sintesis riset dengan referensi yang tervalidasi.",
    icon: GraduationCap,
  },
  {
    id: "development",
    title: "Pengembangan Aplikasi",
    description:
      "Bangun arsitektur aplikasi, tulis kode multi-platform, dan lakukan review otomatis.",
    icon: Code2,
  },
  {
    id: "business",
    title: "Analisis Bisnis",
    description:
      "Modelkan KPI, analisis pasar, dan buat dashboard interaktif dengan insight yang mudah dipahami.",
    icon: BarChart3,
  },
  {
    id: "creative",
    title: "Eksplorasi Kreatif",
    description:
      "Ciptakan storyboard, konsep visual, dan generasi konten multimedia dengan arahan artistik modern.",
    icon: Palette,
  },
];

const defaultAssistantMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Haloo namaku FashBot. aku siap menjadi partner pengembangan serba bisa kamu dengan pipeline multimodal Gemini terkini. Sampaikan tujuan kamu, dan aku akan menganalisis konteks, merancang strategi, lalu menghadirkan solusi yang menyeluruh dan transparan.",
  createdAt: new Date().toISOString(),
  explanation: [
    {
      id: "pipeline",
      label: "Pipeline Gemini",
      detail: "Memetakan permintaan ke modul multimodal (teks, visual, data).",
      confidence: 0.88,
    },
    {
      id: "analysis",
      label: "Analisis Konteks",
      detail: "Mengidentifikasi tujuan utama dan dependensi lintas bidang.",
      confidence: 0.84,
    },
    {
      id: "delivery",
      label: "Strategi Respons",
      detail: "Menyusun jawaban terstruktur dengan langkah tindak lanjut.",
      confidence: 0.9,
    },
  ],
};

// client-only attachment structure for uploads while editing
interface PendingAttachment {
  id: string;
  file: File;
  name: string;
  mimeType: string;
  size: number;
  dataUrl?: string; // base64 for inline send
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB per image
const MAX_VIDEO_TOTAL_BYTES = 100 * 1024 * 1024; // 100 MB total for videos
const MAX_DOC_BYTES = 20 * 1024 * 1024; // 20 MB per document
const MAX_AUDIO_BYTES = 5 * 1024 * 1024; // 5 MB per audio file

const ACCEPTED_MIME_PREFIXES = ["image/", "audio/", "video/"];
const ACCEPTED_MIME_EXACT = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

export default function Index() {
  const [model, setModel] = useState("FashBot-GM-VRS-25F");
  const [messages, setMessages] = useState<ChatMessage[]>([
    defaultAssistantMessage,
  ]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);
  const [isTermsOpen, setTermsOpen] = useState(false);
  const [integrationQuery, setIntegrationQuery] = useState("");
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);
  // simplified attach menu handled by a dedicated component

  // edit mode state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const saved = window.localStorage.getItem(HISTORY_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ChatMessage[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      } catch (error) {
        console.error("Failed to parse stored history", error);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing]);

  const notifications = useMemo(
    () => [
      {
        id: "xai",
        title: "Explainable AI aktif",
        description:
          "FashBot menyajikan jejak keputusan yang transparan dengan visualisasi reasoning berlapis.",
        status: "info" as const,
      },
      {
        id: "latency",
        title: "Optimasi latensi real-time",
        description:
          "Pipeline streaming Gemini menjaga percakapan tetap responsif bahkan pada konteks panjang.",
        status: "success" as const,
      },
    ],
    [],
  );

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });

  const totalAttachBytes = useMemo(
    () => attachments.reduce((acc, a) => acc + a.size, 0),
    [attachments],
  );

  const handleAttachFiles = async (
    files: FileList | null,
    kind?: "image" | "video" | "doc" | "audio",
  ) => {
    if (!files || files.length === 0) return;
    const selected = Array.from(files);

    const accepted = selected.filter(
      (f) =>
        ACCEPTED_MIME_PREFIXES.some((p) => f.type.startsWith(p)) ||
        ACCEPTED_MIME_EXACT.includes(f.type),
    );

    if (accepted.length === 0) {
      alert("Tipe file tidak didukung.");
      return;
    }

    // Per-kind validation
    if (kind === "image") {
      const tooLarge = accepted.find((f) => f.size > MAX_IMAGE_BYTES);
      if (tooLarge) {
        alert(`Gambar "${tooLarge.name}" melebihi batas 5MB.`);
        return;
      }
    }

    if (kind === "doc") {
      const tooLarge = accepted.find((f) => f.size > MAX_DOC_BYTES);
      if (tooLarge) {
        alert(`Dokumen "${tooLarge.name}" melebihi batas 20MB.`);
        return;
      }
    }

    if (kind === "audio") {
      const tooLarge = accepted.find((f) => f.size > MAX_AUDIO_BYTES);
      if (tooLarge) {
        alert(`Audio "${tooLarge.name}" melebihi batas 5MB.`);
        return;
      }
    }

    if (kind === "video") {
      const currentVideoBytes = attachments
        .filter((a) => a.mimeType.startsWith("video/"))
        .reduce((acc, a) => acc + a.size, 0);
      const newVideoBytes = accepted.reduce((acc, f) => acc + f.size, 0);
      if (currentVideoBytes + newVideoBytes > MAX_VIDEO_TOTAL_BYTES) {
        alert("Total ukuran video melebihi batas 100MB.");
        return;
      }
    }

    const enriched = await Promise.all(
      accepted.map(async (file) => ({
        id: crypto.randomUUID(),
        file,
        name: file.name,
        mimeType: file.type,
        size: file.size,
        dataUrl: await readFileAsDataUrl(file),
      })),
    );

    setAttachments((prev) => [...prev, ...enriched]);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const exitEditMode = () => {
    setEditingMessageId(null);
    setInput("");
    setAttachments([]);
  };

  const startEdit = (message: ChatMessage) => {
    if (message.role !== "user") return;
    setEditingMessageId(message.id);
    setInput(message.content);
    setAttachments([]);
  };

  const deleteUserMessage = (messageId: string) => {
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.id === messageId);
      if (idx === -1) return prev;
      const next = [...prev];
      // remove the user message
      next.splice(idx, 1);
      // if there is an assistant message immediately after, remove it too
      if (next[idx] && next[idx].role === "assistant") {
        next.splice(idx, 1);
      }
      return next.length ? next : [defaultAssistantMessage];
    });
  };

  const clearAllChat = () => {
    setMessages([defaultAssistantMessage]);
    setInput("");
    setAttachments([]);
    setEditingMessageId(null);
    try {
      abortRef.current?.abort();
    } catch {}
    setIsProcessing(false);
  };

  const stopResponse = () => {
    try {
      abortRef.current?.abort();
    } catch (e) {
      console.error("Failed to abort", e);
    }
    setIsProcessing(false);
    setMessages((prev) => prev.filter((m) => !m.pending));
  };

  const buildAssistantPending = () => ({
    id: crypto.randomUUID(),
    role: "assistant" as const,
    content: "",
    pending: true,
    createdAt: new Date().toISOString(),
  });

  const buildOutgoingPayload = async (
    history: ChatMessage[],
    attach: PendingAttachment[],
  ) => {
    const lastUser = [...history].reverse().find((m) => m.role === "user");

    let attachmentsPayload: { mimeType: string; dataBase64: string }[] = [];
    if (attach.length > 0 && lastUser) {
      attachmentsPayload = attach.map((a) => {
        const base64 = (a.dataUrl ?? "").split(",")[1] ?? "";
        return { mimeType: a.mimeType, dataBase64: base64 };
        // server will inline supported types and fallback to textual mentions otherwise
      });
    }

    return {
      model,
      messages: history.map(({ role, content }) => ({ role, content })),
      attachments: attachmentsPayload,
    } as const;
  };

  const handleSend = useCallback(async () => {
    // helper to safely read response without double-reading body
    const safeReadResponse = async (response: Response) => {
      try {
        const json = await response.json();
        return { json, text: JSON.stringify(json) } as const;
      } catch (err) {
        // fallback to text or clone
        try {
          const text = await response.text();
          try {
            const json = JSON.parse(text);
            return { json, text } as const;
          } catch {
            return { json: null, text } as const;
          }
        } catch {
          try {
            const text = await response.clone().text();
            try {
              const json = JSON.parse(text);
              return { json, text } as const;
            } catch {
              return { json: null, text } as const;
            }
          } catch {
            return { json: null, text: "" } as const;
          }
        }
      }
    };

    const trimmed = input.trim();
    if (!trimmed || isProcessing) {
      return;
    }

    const isImage = /\b(generat(e|ion)|buat|buatkan|gambar|image)\b/i.test(
      trimmed,
    );
    const isVideo = /\b(video|buat video|generate video)\b/i.test(trimmed);
    const isDocument =
      /\b(dokumen|document|buat dokumen|generate document|buat doc)\b/i.test(
        trimmed,
      );

    const callGenerate = async (
      type: "image" | "video" | "document",
      prompt: string,
    ) => {
      const controller = new AbortController();
      abortRef.current = controller;
      const resp = await fetch(`/api/generate/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          engine:
            type === "document" && /python/i.test(prompt)
              ? "python"
              : undefined,
          local: type === "image",
        }),
        signal: controller.signal,
      });
      const { json, text } = await safeReadResponse(resp);
      return {
        ok: resp.ok,
        status: resp.status,
        statusText: resp.statusText,
        json,
        text,
      } as const;
    };

    // edit flow: replace selected user message, drop messages after it, send
    if (editingMessageId) {
      const index = messages.findIndex((m) => m.id === editingMessageId);
      if (index === -1) {
        alert("Pesan untuk diedit tidak ditemukan.");
        return;
      }

      const updatedUser: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
        attachments: attachments.map(({ id, name, mimeType, size }) => ({
          id,
          name,
          mimeType,
          size,
        })),
      };

      const base = messages.slice(0, index); // everything before the edited message
      const newConversation = [...base, updatedUser];
      const thinking = buildAssistantPending();

      setMessages((prev) => [...newConversation, thinking]);
      setIsProcessing(true);

      try {
        // If this is a multimodal intent, call generate endpoints instead of Gemini
        if (isImage || isVideo || isDocument) {
          const type = isImage ? "image" : isVideo ? "video" : "document";
          const result = await callGenerate(type, updatedUser.content);
          if (result.ok) {
            const resultData =
              result.json ??
              (result.text
                ? (() => {
                    try {
                      return JSON.parse(result.text);
                    } catch {
                      return { message: result.text };
                    }
                  })()
                : {});
            const assistant = {
              id: crypto.randomUUID(),
              role: "assistant" as const,
              content:
                resultData.content ??
                resultData.message ??
                String(resultData ?? ""),
              explanation: defaultAssistantMessage.explanation,
              createdAt: new Date().toISOString(),
            };
            setMessages((prev) =>
              prev.map((m) => (m.id === thinking.id ? assistant : m)),
            );
            return;
          } else {
            const errData = result.json ?? result.text ?? null;
            const details = result.status
              ? `status ${result.status} ${result.statusText}`
              : "no status";
            const msgDetail = errData
              ? typeof errData === "string"
                ? errData
                : JSON.stringify(errData)
              : (result.text ?? "no details");
            setMessages((prev) =>
              prev.map((m) =>
                m.id === thinking.id
                  ? {
                      id: crypto.randomUUID(),
                      role: "assistant",
                      content: `FashBot gagal menghasilkan ${type}. Provider error: ${msgDetail} (${details})`,
                      explanation: defaultAssistantMessage.explanation,
                      createdAt: new Date().toISOString(),
                    }
                  : m,
              ),
            );
            return;
          }
        }

        const payload = await buildOutgoingPayload(
          newConversation,
          attachments,
        );
        const controller = new AbortController();
        abortRef.current = controller;
        const response = await fetch("/api/gemini/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        const { json: parsedJson, text: raw } =
          await safeReadResponse(response);

        if (!response.ok) {
          let errorDetail = "Failed to contact Gemini interface.";
          if (raw) {
            try {
              const payloadErr = parsedJson ?? (raw ? JSON.parse(raw) : null);
              errorDetail = payloadErr?.error ?? errorDetail;
              if (payloadErr?.details) {
                errorDetail += ` Detail: ${payloadErr.details}`;
              }
            } catch {
              errorDetail = raw;
            }
          }

          setMessages((prev) =>
            prev.map((m) =>
              m.id === thinking.id
                ? {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content:
                      `FashBot mengalami kendala saat menghubungkan ke pipeline Gemini. ${errorDetail}`.trim(),
                    explanation: defaultAssistantMessage.explanation,
                    createdAt: new Date().toISOString(),
                  }
                : m,
            ),
          );
          abortRef.current = null;
          return;
        }

        const data = parsedJson ?? (raw ? { message: raw } : {});

        setMessages((prev) =>
          prev.map((m) =>
            m.id === thinking.id
              ? {
                  id: crypto.randomUUID(),
                  role: "assistant",
                  content: data.message,
                  explanation: data.explanation?.length
                    ? data.explanation
                    : defaultAssistantMessage.explanation,
                  createdAt: new Date().toISOString(),
                }
              : m,
          ),
        );
      } catch (error) {
        console.error(error);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === thinking.id
              ? {
                  id: crypto.randomUUID(),
                  role: "assistant",
                  content:
                    "FashBot mengalami kendala jaringan internal. Silakan coba lagi atau periksa konfigurasi Gemini API key.",
                  explanation: defaultAssistantMessage.explanation,
                  createdAt: new Date().toISOString(),
                }
              : m,
          ),
        );
      } finally {
        setIsProcessing(false);
        exitEditMode();
      }

      return;
    }

    // default send flow
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
      attachments:
        attachments.length > 0
          ? attachments.map(({ id, name, mimeType, size }) => ({
              id,
              name,
              mimeType,
              size,
            }))
          : undefined,
    };

    const assistantPendingId = crypto.randomUUID();

    const thinkingMessage: ChatMessage = {
      id: assistantPendingId,
      role: "assistant",
      content: "",
      pending: true,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage, thinkingMessage]);
    setInput("");
    setIsProcessing(true);

    // multimodal quick path
    if (isImage || isVideo || isDocument) {
      try {
        const type = isImage ? "image" : isVideo ? "video" : "document";
        const controller = new AbortController();
        abortRef.current = controller;
        const resp = await fetch(`/api/generate/${type}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: trimmed,
            engine:
              type === "document" && /python/i.test(trimmed)
                ? "python"
                : undefined,
            local: type === "image",
          }),
          signal: controller.signal,
        });
        const { json: payloadJson, text: payloadText } =
          await safeReadResponse(resp);
        const payload =
          payloadJson ??
          (payloadText
            ? (() => {
                try {
                  return JSON.parse(payloadText);
                } catch {
                  return { message: payloadText };
                }
              })()
            : {});
        if (!resp.ok) {
          const details = `${resp.status} ${resp.statusText}`;
          const providerErrors = payload?.errors ?? payload?.errors ?? null;
          const msgDetail = providerErrors
            ? JSON.stringify(providerErrors)
            : payload && Object.keys(payload).length
              ? JSON.stringify(payload)
              : (payloadText ?? "no details");
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantPendingId
                ? {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content: `FashBot gagal menghasilkan ${type}. ${msgDetail} (status ${details})`,
                    explanation: defaultAssistantMessage.explanation,
                    createdAt: new Date().toISOString(),
                  }
                : m,
            ),
          );
        } else {
          const out =
            payload?.content ?? payload?.message ?? payloadText ?? null;
          // If this is a document data URI with filename, trigger download
          if (
            type === "document" &&
            typeof out === "string" &&
            out.startsWith("data:")
          ) {
            try {
              const filename =
                (payload && (payload.filename || payload.name)) || "document";
              const a = document.createElement("a");
              a.href = out;
              a.download = filename;
              document.body.appendChild(a);
              a.click();
              a.remove();
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantPendingId
                    ? {
                        id: crypto.randomUUID(),
                        role: "assistant",
                        content: `Dokumen siap diunduh: ${filename}`,
                        explanation: defaultAssistantMessage.explanation,
                        createdAt: new Date().toISOString(),
                      }
                    : m,
                ),
              );
            } catch (e) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantPendingId
                    ? {
                        id: crypto.randomUUID(),
                        role: "assistant",
                        content: out ?? String(payload ?? ""),
                        explanation: defaultAssistantMessage.explanation,
                        createdAt: new Date().toISOString(),
                      }
                    : m,
                ),
              );
            }
          } else {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantPendingId
                  ? {
                      id: crypto.randomUUID(),
                      role: "assistant",
                      content: out ?? String(payload ?? ""),
                      explanation: defaultAssistantMessage.explanation,
                      createdAt: new Date().toISOString(),
                    }
                  : m,
              ),
            );
          }
        }
      } catch (err: any) {
        console.error(err);
        const info = err?.message ?? String(err ?? "unknown error");
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantPendingId
              ? {
                  id: crypto.randomUUID(),
                  role: "assistant",
                  content: `FashBot gagal menghasilkan media—terjadi kesalahan: ${info}`,
                  explanation: defaultAssistantMessage.explanation,
                  createdAt: new Date().toISOString(),
                }
              : m,
          ),
        );
      } finally {
        setIsProcessing(false);
        abortRef.current = null;
      }

      return;
    }

    try {
      const controller = new AbortController();
      abortRef.current = controller;
      let response: Response;
      if (attachments.length > 0) {
        const payload = await buildOutgoingPayload(
          [...messages, userMessage],
          attachments,
        );
        response = await fetch("/api/gemini/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } else {
        response = await fetch("/api/gemini/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [...messages, userMessage].map(({ role, content }) => ({
              role,
              content,
            })),
          }),
          signal: controller.signal,
        });
      }

      const { json: parsedJson, text: raw } = await safeReadResponse(response);

      if (!response.ok) {
        let errorDetail = "Failed to contact Gemini interface.";
        if (raw) {
          try {
            const payloadErr = parsedJson ?? (raw ? JSON.parse(raw) : null);
            errorDetail = payloadErr?.error ?? errorDetail;
            if (payloadErr?.details) {
              errorDetail += ` Detail: ${payloadErr.details}`;
            }
          } catch {
            errorDetail = raw;
          }
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantPendingId
              ? {
                  id: crypto.randomUUID(),
                  role: "assistant",
                  content:
                    `FashBot mengalami kendala saat menghubungkan ke pipeline Gemini. ${errorDetail}`.trim(),
                  explanation: defaultAssistantMessage.explanation,
                  createdAt: new Date().toISOString(),
                }
              : m,
          ),
        );
        abortRef.current = null;
        return;
      }

      const data = parsedJson ?? (raw ? { message: raw } : {});

      const assistantResolvedId = crypto.randomUUID();
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantPendingId
            ? {
                id: assistantResolvedId,
                role: "assistant",
                content: data.message,
                explanation: data.explanation?.length
                  ? data.explanation
                  : defaultAssistantMessage.explanation,
                createdAt: new Date().toISOString(),
              }
            : m,
        ),
      );
    } catch (error: any) {
      if (error?.name === "AbortError") {
        // ignore abort
        setMessages((prev) => prev.filter((m) => !m.pending));
      } else {
        console.error(error);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantPendingId
              ? {
                  id: crypto.randomUUID(),
                  role: "assistant",
                  content:
                    "FashBot mengalami kendala jaringan internal. Silakan coba lagi atau periksa konfigurasi API key.",
                  explanation: defaultAssistantMessage.explanation,
                  createdAt: new Date().toISOString(),
                }
              : m,
          ),
        );
      }
    } finally {
      setIsProcessing(false);
      abortRef.current = null;
      setAttachments([]);
    }
  }, [input, isProcessing, messages, model, editingMessageId, attachments]);

  const lastAssistantExplanation = useMemo(() => {
    const reversed = [...messages].reverse();
    const found = reversed.find(
      (msg) => msg.role === "assistant" && msg.explanation?.length,
    );
    return found?.explanation ?? defaultAssistantMessage.explanation;
  }, [messages]);

  const isEditing = Boolean(editingMessageId);

  return (
    <>
      <AppShell
        model={model}
        onModelChange={setModel}
        onMoreActions={() => setIsActionsOpen(true)}
        onOpenPolicy={() => setIsPolicyOpen(true)}
        onOpenTerms={() => setTermsOpen(true)}
        notifications={notifications}
      >
        <div className="relative z-10 grid h-full grid-rows-[1fr_auto] gap-0 lg:grid-rows-1 lg:grid-cols-[minmax(0,1.9fr)_minmax(320px,1fr)] lg:gap-8">
          <div className="relative flex flex-1 flex-col overflow-hidden">
            <ScrollArea className="flex-1 px-6 pb-6 pt-6 lg:px-8">
              <div className="space-y-6">
                <div className="rounded-3xl border border-white/40 bg-white/80 p-5 text-sm font-medium text-foreground/80 shadow-soft dark:border-white/10 dark:bg-white/10">
                  {multimodalBannerText}
                </div>
                {messages.map((message) => (
                  <ChatBubble
                    key={message.id}
                    message={message}
                    onEdit={() => startEdit(message)}
                    onDelete={() => deleteUserMessage(message.id)}
                  />
                ))}
                {isProcessing && <ThinkingAnimation />}
                <div ref={endOfMessagesRef} />
              </div>
            </ScrollArea>
            <div className="relative border-t border-white/30 bg-white/60 px-6 py-5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60 lg:px-8">
              <form
                className="flex w-full flex-col gap-3 rounded-3xl border border-white/40 bg-white/80 p-4 shadow-soft transition dark:border-white/10 dark:bg-slate-900/70"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleSend();
                }}
              >
                {isEditing && (
                  <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-foreground/80">
                    <div className="flex items-center gap-2">
                      <Edit3 className="h-4 w-4 text-primary" />
                      <span>
                        Mode edit aktif. Anda dapat mengubah prompt dan menambah
                        lampiran.
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-foreground/60">
                        {attachments.length} file ·{" "}
                        {(totalAttachBytes / 1024).toFixed(0)} KB
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-8 rounded-full px-3 text-xs"
                        onClick={exitEditMode}
                      >
                        Batal
                      </Button>
                    </div>
                  </div>
                )}
                <Textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Mintalah FashBot untuk merancang arsitektur aplikasi, menganalisis laporan, atau membuat prototipe multimodal..."
                  className="min-h-[120px] resize-none rounded-2xl border border-transparent bg-white/70 px-4 py-3 text-base leading-relaxed text-foreground shadow-inner focus-visible:border-primary focus-visible:ring-0 dark:bg-white/5"
                />

                <div className="flex flex-col gap-2">
                  <input
                    ref={imageInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleAttachFiles(e.target.files, "image")}
                  />
                  <input
                    ref={videoInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    accept="video/*"
                    onChange={(e) => handleAttachFiles(e.target.files, "video")}
                  />
                  <input
                    ref={docInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={(e) => handleAttachFiles(e.target.files, "doc")}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <AttachMenu
                      onImage={() => imageInputRef.current?.click()}
                      onVideo={() => videoInputRef.current?.click()}
                      onDoc={() => docInputRef.current?.click()}
                      onAudio={() => toast("Voice attachment coming soon")}
                    />

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="secondary"
                          className="rounded-full px-3 text-xs"
                        >
                          MCP Server
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onSelect={async () => {
                            if (!input.trim()) {
                              toast(
                                "Masukkan prompt di textarea sebelum generate",
                              );
                              return;
                            }
                            setIsProcessing(true);
                            try {
                              const resp = await fetch("/api/generate/image", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  prompt: input.trim(),
                                  size: "1024x768",
                                  local: true,
                                }),
                              });
                              const data = await resp.json();
                              const content =
                                data?.saved ??
                                data?.content ??
                                data?.message ??
                                null;
                              const assistant = {
                                id: crypto.randomUUID(),
                                role: "assistant",
                                content: content || "Gagal menghasilkan gambar",
                                explanation:
                                  defaultAssistantMessage.explanation,
                                createdAt: new Date().toISOString(),
                              };
                              setMessages((prev) => [...prev, assistant]);
                            } catch (e: any) {
                              toast("Fitur belum tersedia — coming soon");
                            } finally {
                              setIsProcessing(false);
                            }
                          }}
                        >
                          Generate Image
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onSelect={() => {
                            toast("Fitur belum tersedia — coming soon");
                          }}
                        >
                          Generate Video
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onSelect={() => {
                            toast("Fitur belum tersedia — coming soon");
                          }}
                        >
                          Generate Music
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onSelect={() => {
                            toast("Fitur belum tersedia — coming soon");
                          }}
                        >
                          Generate Sound
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onSelect={() => {
                            toast("Fitur belum tersedia �� coming soon");
                          }}
                        >
                          Connect Supabase
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onSelect={() => {
                            toast("Fitur belum tersedia — coming soon");
                          }}
                        >
                          Connect Notion
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onSelect={() => {
                            toast("Fitur belum tersedia — coming soon");
                          }}
                        >
                          Connect MongoDB
                        </DropdownMenuItem>

                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            Show more integrations (100+)
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <div className="p-2">
                              <input
                                type="text"
                                value={integrationQuery}
                                onChange={(e) =>
                                  setIntegrationQuery(e.target.value)
                                }
                                placeholder="Search integrations..."
                                className="w-full rounded-md border bg-popover px-3 py-1 text-sm outline-none"
                              />
                              <div className="max-h-64 w-80 overflow-auto mt-2">
                                {Object.entries(INTEGRATION_CATEGORIES).map(
                                  ([cat, items]) => {
                                    const filtered = items.filter((name) =>
                                      name
                                        .toLowerCase()
                                        .includes(
                                          integrationQuery.trim().toLowerCase(),
                                        ),
                                    );
                                    if (
                                      integrationQuery &&
                                      filtered.length === 0
                                    )
                                      return null;
                                    const toShow = integrationQuery
                                      ? filtered
                                      : items;
                                    return (
                                      <div key={cat} className="mb-2">
                                        <div className="px-2 py-1 text-xs font-semibold text-foreground/70">
                                          {cat}
                                        </div>
                                        {toShow.map((name) => (
                                          <DropdownMenuItem
                                            key={name}
                                            onSelect={() =>
                                              toast(
                                                "Fitur belum tersedia — coming soon",
                                              )
                                            }
                                          >
                                            {name}
                                          </DropdownMenuItem>
                                        ))}
                                      </div>
                                    );
                                  },
                                )}
                              </div>
                            </div>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-full px-3 text-xs cursor-not-allowed opacity-60"
                          onClick={() => toast("Fitur belum tersedia")}
                          aria-disabled
                        >
                          <Mic className="h-4 w-4" /> Voice note
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        Voice note (disabled)
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-full px-3 text-xs cursor-not-allowed opacity-60"
                          onClick={() => toast("Fitur belum tersedia")}
                          aria-disabled
                        >
                          <Headphones className="h-4 w-4" /> Voice Chat
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        Voice Chat (disabled)
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-full px-3 text-xs cursor-not-allowed opacity-60"
                          onClick={() => toast("Fitur belum tersedia")}
                          aria-disabled
                        >
                          <Video className="h-4 w-4" /> Video Call
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        Video Call (disabled)
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-full px-3 text-xs cursor-not-allowed opacity-60"
                          onClick={() => toast("Fitur belum tersedia")}
                          aria-disabled
                        >
                          <Cpu className="h-4 w-4" /> Agent Mode
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        Agent Mode (disabled)
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((a) => (
                        <span
                          key={a.id}
                          className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/70 px-3 py-1.5 text-xs text-foreground/80 shadow-inner dark:border-white/10 dark:bg-white/5"
                        >
                          <Paperclip className="h-3.5 w-3.5 text-primary" />
                          <span className="max-w-[180px] truncate">
                            {a.name}
                          </span>
                          <span className="text-foreground/50">
                            {Math.max(1, Math.round(a.size / 1024))} KB
                          </span>
                          <button
                            type="button"
                            onClick={() => removeAttachment(a.id)}
                            className="ml-1 rounded-full p-1 text-foreground/60 hover:bg-foreground/10"
                            aria-label="Hapus lampiran"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-foreground/60">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Konteks percakapan dijaga otomatis dengan memori adaptif
                    berlapis.
                  </div>
                  <div className="flex items-center gap-2">
                    {isProcessing ? (
                      <Button
                        type="button"
                        size="lg"
                        variant="outline"
                        onClick={stopResponse}
                        className="rounded-full px-4"
                        aria-label="Stop response"
                      >
                        Stop response
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        size="lg"
                        disabled={isProcessing}
                        className="group relative flex items-center gap-2 rounded-full border border-primary/20 bg-gradient-to-r from-primary to-glow-blue px-6 text-sm font-semibold text-primary-foreground shadow-crystal transition duration-500 ease-outglow hover:-translate-y-0.5 hover:shadow-halo disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                        {isEditing ? "Simpan & Kirim" : "Kirim"}
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="lg"
                      variant="ghost"
                      onClick={clearAllChat}
                      className="rounded-full px-4"
                    >
                      Clear all chat
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
          <div className="hidden rounded-3xl border border-white/30 bg-white/50 p-6 shadow-soft backdrop-blur-3xl dark:border-white/10 dark:bg-white/5 lg:block">
            <ExplainabilityPanel segments={lastAssistantExplanation} />
            <div className="mt-6 rounded-2xl border border-white/30 bg-white/50 p-5 shadow-inner dark:border-white/10 dark:bg-white/5">
              <h3 className="font-display text-lg text-foreground">
                Spektrum Keahlian
              </h3>
              <p className="mt-2 text-sm text-foreground/70">
                Setiap respons memperkuat keunggulan FashBot sebagai developer
                serba bisa yang mampu meramu solusi lintas domain secara
                simultan.
              </p>
              <ul className="mt-4 grid gap-2 text-sm text-foreground/80">
                {capabilities.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </AppShell>
      <Sheet open={isActionsOpen} onOpenChange={setIsActionsOpen}>
        <SheetContent className="glass-panel mx-auto w-full max-w-xl border border-white/20 bg-white/80 p-8 shadow-crystal backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/80">
          <SheetHeader>
            <SheetTitle className="font-display text-2xl text-foreground">
              FashBot More Actions
            </SheetTitle>
            <SheetDescription className="text-sm text-foreground/70">
              Manfaatkan seluruh potensi FashBot-GM-VRS-25F untuk kebutuhan
              strategis dengan alur yang terarah.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-5">
            {moreActions.map((action) => (
              <div
                key={action.id}
                className="rounded-2xl border border-white/30 bg-white/60 p-5 shadow-inner transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-crystal dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <action.icon className="h-5 w-5" />
                  </span>
                  <h4 className="font-semibold text-foreground">
                    {action.title}
                  </h4>
                </div>
                <p className="mt-2 text-sm text-foreground/70">
                  {action.description}
                </p>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
      <Sheet open={isPolicyOpen} onOpenChange={setIsPolicyOpen}>
        <SheetContent className="glass-panel mx-auto w-full max-w-2xl border border-white/20 bg-white/85 p-8 shadow-crystal backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/85">
          <SheetHeader>
            <SheetTitle className="font-display text-2xl text-foreground">
              privacy policy
            </SheetTitle>
            <SheetDescription className="text-sm text-foreground/70">
              Validasi kepatuhan otomatis untuk setiap solusi yang dibangun
              bersama FashBot.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-foreground/80">
            <p>
              privacy policy memindai konteks percakapan, permintaan akses, dan
              alur kerja agar selalu sejalan dengan kebijakan internal serta
              regulasi global seperti GDPR dan ISO 42001.
            </p>
            <ul className="space-y-3">
              <li className="rounded-2xl border border-white/30 bg-white/70 p-4 shadow-inner dark:border-white/10 dark:bg-white/5">
                <p className="font-semibold text-foreground">
                  Audit kepatuhan instan
                </p>
                <p className="mt-1 text-foreground/70">
                  Setiap deliverable dilengkapi jejak audit yang dapat diunduh
                  kapan saja.
                </p>
              </li>
              <li className="rounded-2xl border border-white/30 bg-white/70 p-4 shadow-inner dark:border-white/10 dark:bg-white/5">
                <p className="font-semibold text-foreground">
                  Pencegahan kebocoran data
                </p>
                <p className="mt-1 text-foreground/70">
                  Analisis multimodal memastikan tidak ada informasi sensitif
                  yang terbagi tanpa otorisasi.
                </p>
              </li>
              <li className="rounded-2xl border border-white/30 bg-white/70 p-4 shadow-inner dark:border-white/10 dark:bg-white/5">
                <p className="font-semibold text-foreground">
                  Sinyal risiko real-time
                </p>
                <p className="mt-1 text-foreground/70">
                  Peringatan proaktif muncul saat alur pengerjaan berpotensi
                  melenceng dari standar perusahaan.
                </p>
              </li>
            </ul>
          </div>
        </SheetContent>
      </Sheet>
      <Sheet open={isTermsOpen} onOpenChange={setTermsOpen}>
        <SheetContent className="glass-panel mx-auto w-full max-w-2xl border border-white/20 bg-white/85 p-8 shadow-crystal backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/85">
          <SheetHeader>
            <SheetTitle className="font-display text-2xl text-foreground">
              Terms & Conditions
            </SheetTitle>
            <SheetDescription className="text-sm text-foreground/70">
              Ketentuan penggunaan layanan FashBot-GM-VRS-25F untuk kolaborasi
              yang aman dan transparan.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-foreground/80">
            <p>
              Dengan menggunakan FashBot, kamu menyetujui pemrosesan data sesuai
              izin yang diberikan dan menjaga integritas kredensial integrasi
              pihak ketiga yang digunakan.
            </p>
            <p>
              Seluruh hasil generatif wajib ditinjau sebelum dipublikasikan, dan
              pengguna bertanggung jawab atas kepatuhan hukum di yurisdiksi
              masing-masing.
            </p>
            <p>
              Permintaan dukungan premium dapat diajukan kapan saja, sementara
              penghentian layanan dilakukan lewat pengaturan akun dengan
              pemberitahuan minimal tujuh hari sebelumnya.
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function ChatBubble({
  message,
  onEdit,
  onDelete,
}: {
  message: ChatMessage;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const isUser = message.role === "user";
  return (
    <motion.div
      className={cn(
        "flex w-full gap-3",
        isUser ? "justify-end" : "justify-start",
      )}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {!isUser && (
        <Avatar className="shadow-crystal">
          <AvatarImage src={FASHBOT_LOGO_URL} alt="FashBot logo" />
          <AvatarFallback className="bg-gradient-to-br from-primary via-glow-blue to-glow-magenta text-primary-foreground">
            FB
          </AvatarFallback>
        </Avatar>
      )}
      <div className={cn("relative max-w-xl")}>
        <div
          className={cn(
            "rounded-3xl border px-5 py-4 text-sm leading-relaxed shadow-soft",
            isUser
              ? "bg-primary/20 text-foreground/90 backdrop-blur-xl"
              : "bg-white/80 text-foreground/90 backdrop-blur-xl dark:bg-white/10",
          )}
        >
          {(() => {
            const c = String(message.content ?? "").trim();
            const isImg =
              /^data:image\//.test(c) ||
              /^https?:\/\/.+\.(png|jpg|jpeg|webp|gif)(\?|$)/i.test(c);
            const isVid =
              /^data:video\//.test(c) ||
              /^https?:\/\/.+\.(mp4|webm|mov)(\?|$)/i.test(c);
            if (isImg) {
              return (
                <img
                  src={c}
                  alt="generated"
                  className="mt-1 max-w-full rounded-xl border border-white/30 shadow-inner dark:border-white/10"
                />
              );
            }
            if (isVid) {
              return (
                <video
                  controls
                  src={c}
                  className="mt-1 max-w-full rounded-xl border border-white/30 shadow-inner dark:border-white/10"
                />
              );
            }
            return <p className="whitespace-pre-wrap">{message.content}</p>;
          })()}
          {isUser && message.attachments && message.attachments.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {message.attachments.map((a) => (
                <span
                  key={a.id}
                  className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/70 px-2.5 py-1 text-[11px] text-foreground/80 shadow-inner dark:border-white/10 dark:bg-white/5"
                >
                  <Paperclip className="h-3 w-3 text-primary" />
                  <span className="max-w-[140px] truncate">{a.name}</span>
                </span>
              ))}
            </div>
          )}
        </div>
        {isUser && (
          <div className="absolute -top-3 -right-3 flex gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="rounded-full border border-white/40 bg-white/80 p-2 text-xs text-foreground/80 shadow-soft transition hover:-translate-y-0.5 hover:bg-primary/20 dark:border-white/10 dark:bg-white/10"
              aria-label="Edit pesan"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="rounded-full border border-white/40 bg-white/80 p-2 text-xs text-foreground/80 shadow-soft transition hover:-translate-y-0.5 hover:bg-destructive/20 dark:border-white/10 dark:bg-white/10"
              aria-label="Delete this response"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
      {isUser && (
        <Avatar className="shadow-soft">
          <AvatarFallback className="bg-primary/20 text-primary">
            Anda
          </AvatarFallback>
        </Avatar>
      )}
    </motion.div>
  );
}

function ExplainabilityPanel({ segments }: { segments: ExplanationSegment[] }) {
  return (
    <div className="rounded-3xl border border-white/30 bg-white/60 p-5 shadow-inner backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg text-foreground">
          Explainable Flow
        </h3>
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          XAI ACTIVE
        </span>
      </div>
      <p className="mt-2 text-sm text-foreground/70">
        Visualisasi alur reasoning yang digunakan FashBot untuk menyusun respons
        relevan dan terpercaya.
      </p>
      <div className="mt-4 space-y-4">
        {segments.map((segment) => (
          <div
            key={segment.id}
            className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/70 p-4 dark:bg-white/10"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Workflow className="h-4 w-4 text-primary" />
                <p className="font-semibold text-foreground">{segment.label}</p>
              </div>
              <span className="text-xs font-semibold text-foreground/70">
                {Math.round(segment.confidence * 100)}% confidence
              </span>
            </div>
            <p className="mt-2 text-xs text-foreground/70">{segment.detail}</p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-foreground/10">
              {/* eslint-disable-next-line no-inline-styles */}
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary via-glow-blue to-glow-magenta"
                style={{ width: `${Math.min(segment.confidence * 100, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/30 bg-white/60 p-3 text-xs text-foreground/80 dark:border-white/10 dark:bg-white/10">
        <Orbit className="h-4 w-4 text-primary" />
        Visualisasi partikel menandakan modul reasoning aktif yang menganalisis
        konteks percakapan Anda.
      </div>
    </div>
  );
}

function ThinkingAnimation() {
  return (
    <div className="flex items-center gap-3 text-sm text-foreground/70">
      <div className="relative h-12 w-12">
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-dashed border-primary/50" />
        <span className="absolute inset-2 animate-pulse rounded-full bg-gradient-to-br from-primary/30 via-glow-blue/30 to-glow-magenta/30 blur-md" />
        <span className="absolute inset-[10px] animate-orbit rounded-full bg-primary/80" />
      </div>
      <div className="space-y-1">
        <p className="font-medium text-foreground">FashBot sedang menalar</p>
        <p className="text-xs text-foreground/70">
          Modul multimodal memproses konteks untuk menyiapkan respons mendalam.
        </p>
      </div>
    </div>
  );
}
