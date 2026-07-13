# StyleFlow BD enhanced commerce features

StyleFlow BD is a backend-first JavaScript agent, not a turnkey or UI-only chatbot. LangChain controls model/tool iterations, Express exposes the request-response API, and LangGraph SQLite checkpoints isolate and persist conversations.

## Customer-facing capabilities

- Visual product cards with trusted catalogue prices, variants, and 40 product-ID-specific outfit photographs
- Personalized top-three recommendations by occasion, budget, size, color, and category
- Two-to-four product comparison by price, description, occasions, colors, sizes, and stock
- Demo size chart with chest-based starting-size recommendation and fit disclaimer
- Conversation-scoped wishlist with add, remove, list, and clear operations
- Conversation-scoped order draft with variant validation, quantity, subtotal, delivery, and total
- Human handoff reference with a structured next step and no collection of payment secrets
- Date-stamped Tavily search for current information; catalogue facts remain grounded locally
- Explicit-intent routing guards require Tavily for requested web searches and the comparison workflow for requested product comparisons
- English, Bangla, and Banglish responses with LangGraph conversation memory
- Direct answers and concise clarification questions when no tool is appropriate
- Structured request IDs, tool metadata, timings, safe errors, and memory counts

## Experience and evaluation

- Helpful/not-helpful feedback controls
- In-memory demo analytics for request success, latency, tools, products, handoffs, and feedback
- Rich response metadata for product cards, handoffs, wishlists, and order drafts
- Regression coverage for provider-supplied empty optional fields and generic category filters
- React/Vite interface plus independent curl and Postman access
- Persistent memory inspection, clearing, summary status, and restart recovery
- Public Render deployment and local Cloudflare/ngrok tunnel instructions

## Agent tools

`catalogue_search`, `inventory_check`, `product_compare`, `outfit_recommendation`, `size_guide`, `wishlist`, `order_draft`, `store_policy`, `calculator`, `human_handoff`, and optional `tavily_search`.

## Model and orchestration

The local default and public deployment use OpenAI `gpt-4.1-mini` through LangChain's `ChatOpenAI` integration. The LLM is one component of the system: it does not replace Express validation, LangChain orchestration, deterministic tools, SQLite memory, structured parsing, or error handling. Explicit Tavily and comparison requests have deterministic routing guards; other tool selection remains probabilistic. Provider quota limits and model-generated long-history summaries are documented limitations.

## Facebook Messenger

`/webhooks/facebook` includes verification, signed-event checking, sender-isolated memory, agent invocation, and Send API replies. Live activation requires credentials and permissions from a Meta developer app and Facebook Page.

## Safety boundaries

The wishlist and order draft are demonstrations. They do not create an account, reserve stock, collect an address, accept payment, or place an order. A human seller must confirm the final transaction.
