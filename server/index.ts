import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { handleDemo } from "./routes/demo";
import { handleGeminiChat } from "./routes/gemini";
import {
  handleGenerateImage,
  handleGenerateDocument,
  handleGenerateVideo,
} from "./routes/generate";

export function createServer() {
  const app = express();

  // Optional Sentry init if DSN provided
  try {
    const SENTRY_DSN = process.env.SENTRY_DSN;
    if (SENTRY_DSN) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Sentry = require("@sentry/node");
      Sentry.init({ dsn: SENTRY_DSN });
      console.log("Sentry initialized");
      app.use((req, _res, next) => {
        // optional request handler
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require("@sentry/node").configureScope((scope: any) =>
          scope.setTag("service", "fusion-starter"),
        );
        next();
      });
    }
  } catch (e) {
    console.warn("Sentry init failed or not configured");
  }

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "8mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Serve generated images directory if exists
  const generatedDir = path.join(process.cwd(), "generated_images");
  if (!fs.existsSync(generatedDir))
    fs.mkdirSync(generatedDir, { recursive: true });
  app.use("/generated", express.static(generatedDir));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);
  app.post("/api/gemini/chat", handleGeminiChat);
  app.post("/api/generate/image", handleGenerateImage);
  app.post("/api/generate/document", handleGenerateDocument);
  app.post("/api/generate/video", handleGenerateVideo);

  return app;
}
