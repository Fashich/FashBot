import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleGeminiChat } from "./routes/gemini";
import {
  handleGenerateImage,
  handleGenerateDocument,
  handleGenerateVideo,
} from "./routes/generate";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

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
