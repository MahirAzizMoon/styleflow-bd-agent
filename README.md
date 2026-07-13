# StyleFlow BD — Facebook Boutique AI Agent

StyleFlow BD is a backend-first LangChain sales and inventory agent for a fictional Bangladeshi Facebook clothing boutique. It decides when to search the trusted catalogue, verify stock, retrieve store policy, calculate a total, create a human handoff, or optionally search the current web. It returns structured JSON and stores conversations in persistent LangGraph SQLite checkpoints.

See `BUSINESS_SPECIFICATION.md` for the business scope and safety rules, and `ASSIGNMENT_TESTS.md` for the exact faculty requirement test matrix.

## Architecture

```text
React / Postman / curl
        ↓
Express validation (POST /chat)
        ↓
conversationId → LangGraph thread_id
        ↓
SqliteSaver loads persistent checkpoint
        ↓
LangChain agent + OpenAI model
        ├─ direct answer
        ├─ catalogue_search
        ├─ inventory_check
        ├─ product_compare / outfit_recommendation
        ├─ size_guide / wishlist / order_draft
        ├─ store_policy
        ├─ calculator
        ├─ human_handoff
        ├─ tavily_search (when configured)
        └─ clarification question
        ↓
SqliteSaver writes checkpoint
        ↓
Structured JSON response
```

See `ARCHITECTURE.md` for a file-by-file walkthrough and Q&A guide.

## Features

- LangChain v1 `createAgent` orchestration
- OpenAI `gpt-4.1-mini` through LangChain's official OpenAI integration
- Zod-validated catalogue, inventory, policy, calculator, and handoff tools
- Product comparison, personalized recommendations, size guidance, wishlist, and safe order drafts
- 40 demo products across eight clothing categories with colour, size, and stock variants
- Optional Tavily web search for current external information
- Persistent, isolated conversation threads with LangGraph `SqliteSaver`
- Automatic long-history summarization with observable status
- Memory inspection and deletion endpoints
- Structured validation, provider, tool, and server errors
- Request IDs, timing, tool-use, and failure logs
- React + Vite frontend plus Postman/curl support
- Visual product cards with 40 product-ID-specific outfit photographs, quick actions, customer feedback, and demo analytics
- Credential-gated Meta Messenger webhook adapter

## Project structure

```text
src/                 Express backend and agent
test/                business-tool, calculator, and SQLite memory tests
frontend/            separate React + Vite JavaScript app
public/              fallback static UI before frontend build
data/                local SQLite database (gitignored)
ARCHITECTURE.md       request flow and Q&A study guide
MEMORY_SETUP.md       persistence and summarization guide
CHAT_API_CONTRACT.md  endpoint contract
DEMO_DAY.md           public URL and live demo runbook
render.yaml           backup Render deployment
postman_collection.json
```

## Requirements

- Node.js 20 or newer (Node.js 22 LTS recommended; `.nvmrc` is included)
- An OpenAI API key
- Optional Tavily key for live web search

## Backend setup

Run these commands in the directory containing the root `package.json`:

```bash
npm install
cp .env.example .env
```

Configure `.env`:

```env
PORT=3000
LLM_PROVIDER=openai
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4.1-mini

# Optional current-information search
TAVILY_API_KEY=your_tavily_key

MEMORY_DB_PATH=./data/memory.db
MEMORY_SUMMARY_TRIGGER_TOKENS=6000
MEMORY_RECENT_MESSAGES_TO_KEEP=12
```

Never commit `.env`. Start and verify:

```bash
npm run check
npm test
npm run dev
```

Open `http://localhost:3000/health`.

## Frontend

Install and run the frontend development server:

```bash
cd frontend
npm install
npm run dev
```

Vite opens at `http://localhost:5173` and proxies `/chat` and `/health` to the backend at port 3000. To use a different backend:

```env
VITE_API_URL=https://your-backend.example.com
```

Build the production frontend:

```bash
cd frontend
npm run build
```

Restart the backend after the build. Express detects `frontend/dist` at startup and serves the complete React application at `http://localhost:3000`. If the build does not exist, it serves the lightweight `public/` fallback.

The React UI provides conversation continuity through `sessionStorage`, product cards, wishlist and stock actions, order-draft and handoff panels, feedback controls, demo analytics, tool badges, loading and error states, and a collapsible persistent-memory panel.

## API endpoints

```text
GET    /health
POST   /chat
GET    /chat/:conversationId/memory
DELETE /chat/:conversationId/memory
POST   /api/feedback
GET    /api/analytics
GET    /webhooks/facebook
POST   /webhooks/facebook
```

Example:

```bash
curl -X POST http://localhost:3000/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"Calculate 35 percent of 1200."}'
```

Successful responses preserve the documented contract and include `metadata.toolsUsed`. The memory inspection response adds `summarized` and optional `summaryPreview` fields.

## Verification

```bash
npm run check
npm test
cd frontend && npm run build
```

The automated suite covers all calculator operations, invalid values, SQLite thread accumulation, isolation, deletion, validation, and reading a checkpoint through a second saver instance to simulate restart.

Import `postman_collection.json` for direct-answer, calculator, ambiguity, memory, invalid-input, and Tavily requests.

### Faculty model note

The local default and public Render deployment use OpenAI `gpt-4.1-mini` through LangChain's `ChatOpenAI` integration. This follows the faculty FAQ's recommended provider choice. LangChain—not the model alone—controls reasoning, registered tool calls, observations, and the final response. Express validation, deterministic tools, SQLite memory, structured parsing, and error handling remain separate components. A narrow LangChain middleware guard requires Tavily or the comparison workflow only when the user explicitly requests those capabilities; ordinary tool selection remains model-directed. Model limitations include provider quota/rate limits, occasional imperfect tool selection for non-explicit intents, and probabilistic long-history summaries.

## Optional Facebook Messenger connection

The webhook adapter is implemented but stays inactive until Meta credentials are supplied. Set `FACEBOOK_VERIFY_TOKEN`, `FACEBOOK_PAGE_ACCESS_TOKEN`, and `FACEBOOK_APP_SECRET`, then register `https://your-domain/webhooks/facebook` in the Meta developer dashboard. The GET route handles webhook verification, the POST route verifies signed events, conversation memory is isolated by Facebook sender ID, and replies are sent through the Graph Send API. Meta app permissions and review are external requirements and are not bypassed by this demo.

## Render deployment

The included `render.yaml` creates a free Singapore-region Node web service named `styleflow-bd-agent`, builds the React frontend, starts Express, checks `/health`, and exposes the application at an `onrender.com` address. In Render, create a new Blueprint from the connected Git repository and enter `OPENAI_API_KEY` plus `TAVILY_API_KEY` when prompted.

Render free services can sleep after inactivity and their local filesystem is ephemeral. SQLite memory works while the instance remains active, but may reset after a restart, redeploy, or sleep cycle. Local development retains file-backed SQLite memory.

## Demo day

Follow `DEMO_DAY.md` for the local+tunnel public URL, Render backup, exact five-case demo script, restart-persistence finale, and pre-demo checklist.

With the backend running, create a temporary public URL in a second terminal without installing a global command:

```bash
npm run tunnel
```
