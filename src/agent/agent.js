import { ChatOpenAI } from "@langchain/openai";
import {
  createAgent,
  summarizationMiddleware,
  toolRetryMiddleware,
} from "langchain";
import { SYSTEM_PROMPT } from "./prompts.js";
import { getMemoryCheckpointer } from "./memory.js";
import { calculatorTool } from "./tools/calculator.js";
import { catalogueSearchTool } from "./tools/catalogue.js";
import { humanHandoffTool } from "./tools/humanHandoff.js";
import { inventoryCheckTool } from "./tools/inventory.js";
import { storePolicyTool } from "./tools/storePolicy.js";
import { createWebSearchTool } from "./tools/webSearch.js";

let cachedAgent;
let cachedToolNames = [];

export function getLlmConfiguration() {
  const provider = (process.env.LLM_PROVIDER || "groq").toLowerCase();
  if (provider === "groq") {
    return {
      provider,
      configured: Boolean(process.env.GROQ_API_KEY),
      model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
    };
  }
  return {
    provider: "openai",
    configured: Boolean(process.env.OPENAI_API_KEY),
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
  };
}

function buildTools() {
  const tools = [catalogueSearchTool, inventoryCheckTool, storePolicyTool, calculatorTool, humanHandoffTool];

  if (process.env.TAVILY_API_KEY) {
    tools.push(createWebSearchTool());
  }

  return tools;
}

function readPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function getAgent() {
  if (cachedAgent) return cachedAgent;

  const llm = getLlmConfiguration();
  if (!llm.configured) {
    const variable = llm.provider === "groq" ? "GROQ_API_KEY" : "OPENAI_API_KEY";
    throw new Error(`${variable} is missing from the environment.`);
  }

  const model = new ChatOpenAI({
    model: llm.model,
    apiKey: llm.provider === "groq" ? process.env.GROQ_API_KEY : process.env.OPENAI_API_KEY,
    ...(llm.provider === "groq" && {
      configuration: { baseURL: "https://api.groq.com/openai/v1" },
    }),
    temperature: 0.2,
    timeout: 30_000,
    maxRetries: 2,
  });

  const tools = buildTools();
  cachedToolNames = tools.map((registeredTool) => registeredTool.name);

  const summaryTriggerTokens = readPositiveInteger(
    process.env.MEMORY_SUMMARY_TRIGGER_TOKENS,
    6000
  );
  const recentMessagesToKeep = readPositiveInteger(
    process.env.MEMORY_RECENT_MESSAGES_TO_KEEP,
    12
  );

  cachedAgent = createAgent({
    name: "styleflow_boutique_sales_agent",
    model,
    tools,
    systemPrompt: SYSTEM_PROMPT,
    // LangChain stores the complete message state under a thread_id.
    // The singleton checkpointer is deliberately created outside this function.
    checkpointer: getMemoryCheckpointer(),
    middleware: [
      toolRetryMiddleware({ maxRetries: 1 }),
      // Prevent very long conversations from growing without limit while
      // retaining the latest turns and a summary of older context.
      summarizationMiddleware({
        model,
        trigger: { tokens: summaryTriggerTokens },
        keep: { messages: recentMessagesToKeep },
      }),
    ],
  });

  return cachedAgent;
}

export function getConfiguredToolNames() {
  if (cachedToolNames.length > 0) return cachedToolNames;
  const tools = ["catalogue_search", "inventory_check", "store_policy", "calculator", "human_handoff"];
  return process.env.TAVILY_API_KEY ? [...tools, "tavily_search"] : tools;
}
