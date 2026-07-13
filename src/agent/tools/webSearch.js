import { TavilySearch } from "@langchain/tavily";
import { tool } from "langchain";
import { z } from "zod";

export function createWebSearchTool() {
  if (!process.env.TAVILY_API_KEY) {
    throw new Error("TAVILY_API_KEY is missing from the environment.");
  }

  const tavily = new TavilySearch({
    maxResults: 5,
    topic: "general",
    searchDepth: "basic",
    includeAnswer: true,
  });

  // Expose a deliberately narrow schema to the model. Some OpenAI-compatible
  // providers emit null for optional domain arrays in Tavily's full schema,
  // which fails strict tool-call validation before Tavily can run.
  return tool(
    async ({ query }) => {
      const searchedAt = new Date().toISOString();
      const currentDate = searchedAt.slice(0, 10);
      const result = await tavily.invoke({ query: `Current date: ${currentDate}. ${query}` });
      return JSON.stringify({ searchedAt, result });
    },
    {
      name: "tavily_search",
      description:
        "Search the web for current, recent, or externally verifiable information. Provide a concise search query.",
      schema: z.object({
        query: z.string().min(2).max(500).describe("The web search query."),
      }),
    }
  );
}
