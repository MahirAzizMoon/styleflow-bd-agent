# ChatFlow Demo-Day Runbook

## Clean-machine setup (under 15 minutes)

```bash
git clone YOUR_REPOSITORY_URL
cd YOUR_REPOSITORY_DIRECTORY
nvm use
npm install
npm --prefix frontend install
cp .env.example .env
```

Add the selected model-provider key and optional Tavily key to `.env`, then:

```bash
npm run check
npm test
npm --prefix frontend run build
npm start
```

Open `http://localhost:3000` and confirm `http://localhost:3000/health` reports `status: "ok"`, `llmConfigured: true`, `LangGraph SqliteSaver`, and `survivesServerRestart: true`.

## Primary public URL: local server + Cloudflare Tunnel

Keep `npm start` running and open another terminal. The project command downloads the correct Cloudflare binary automatically when needed:

```bash
npm run tunnel
```

No Cloudflare account is required for a temporary Quick Tunnel. Copy the printed `https://...trycloudflare.com` URL and open it on another device. The React build and API use the same origin, so the UI, `/chat`, `/health`, and memory endpoints travel through one URL.

### ngrok alternative

After installing and authenticating ngrok:

```bash
ngrok http 3000
```

Open the HTTPS forwarding URL. Do not close the backend or tunnel terminals during the demonstration.

## Backup: Render

`render.yaml` defines a Node web service that installs the backend and frontend, builds React, starts Express, and checks `/health`. Create the service from the repository Blueprint and enter secrets in Render's environment settings.

Render free instances use an ephemeral filesystem. The SQLite database can reset when the service redeploys or the instance restarts. This is acceptable for a short browser demo, but use the local+tunnel path to demonstrate persistence across a controlled Node process restart.

## Five-case demo script

Run these in order through the React UI. Keep the Network/console closed unless asked; the tool badges and memory panel provide visible evidence.

### 1. No tool

Message:

```text
Explain what an AI agent is in simple language.
```

Expected: a direct explanation and no tool badge (`toolsUsed: []`).

### 2. Calculator tool

Message:

```text
Calculate 35 percent of 1200.
```

Expected: `420` and a `🔧 calculator` badge.

### 3. Ambiguous request

Message:

```text
Help me choose the best one.
```

Expected: one clarification question asking for options and criteria; no fabricated recommendation.

### 4. Invalid input

Use Postman/curl because the UI correctly prevents empty submission:

```bash
curl -i -X POST "$PUBLIC_URL/chat" \
  -H 'Content-Type: application/json' \
  -d '{}'
```

Expected: HTTP 400 and `INVALID_INPUT` structured JSON.

### 5. Persistent memory finale

1. Start a new conversation and send `My name is Rashik.`
2. Copy the conversation ID from the header.
3. Open the memory sidebar, click **Inspect**, and show the stored turn.
4. Stop only the Node server. Leave `data/memory.db` intact.
5. Run `npm start` again. If the quick tunnel URL changes, reopen the new URL.
6. Refresh the page; `sessionStorage` keeps the conversation ID in the same tab.
7. Send `What is my name?`
8. Expected: `Your name is Rashik.`

Optional Tavily proof:

```text
Search the web for a recent AI agent development and include its source.
```

Expected: a sourced answer and `🔧 tavily_search` badge.

## PRE_DEMO_CHECKLIST

- [ ] Agent role and scope clearly defined in README and system prompt
- [ ] `npm run check`, `npm test`, and frontend build pass
- [ ] `/health` reports the model, calculator, Tavily when configured, and persistent SQLite memory
- [ ] Direct-answer, calculator, ambiguity, invalid-input, and memory-restart cases rehearsed
- [ ] Logs and controlled error responses demonstrated
- [ ] Public tunnel URL opens on a second device
- [ ] No secrets appear in Git, screenshots, terminal history, or shared files
- [ ] Every presenter can explain the flow in `ARCHITECTURE.md`
- [ ] Backup Render service or ngrok path is understood
