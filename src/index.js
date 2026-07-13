import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import { getConfiguredToolNames, getLlmConfiguration } from "./agent/agent.js";
import { getMemoryStatus } from "./agent/memory.js";
import { chatRouter } from "./routes/chat.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();
const port = Number(process.env.PORT) || 3000;
const publicDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), "../public");
const frontendBuildDirectory = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../frontend/dist"
);
const staticDirectory = fs.existsSync(frontendBuildDirectory)
  ? frontendBuildDirectory
  : publicDirectory;

app.disable("x-powered-by");
app.use(cors());
app.use(express.json({ limit: "50kb" }));
app.use((req, res, next) => {
  req.requestId = crypto.randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  next();
});
app.use(express.static(staticDirectory));

app.get("/health", (req, res) => {
  const llm = getLlmConfiguration();
  res.json({
    success: true,
    requestId: req.requestId,
    status: "ok",
    llmConfigured: llm.configured,
    llmProvider: llm.provider,
    llmModel: llm.model,
    toolsConfigured: getConfiguredToolNames(),
    memory: getMemoryStatus(),
    timestamp: new Date().toISOString(),
  });
});

app.use("/chat", chatRouter);
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`StyleFlow BD API running on http://localhost:${port}`);
});
