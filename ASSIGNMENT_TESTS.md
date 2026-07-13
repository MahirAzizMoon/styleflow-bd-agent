# Faculty Requirement Test Matrix

## Required live scenarios

Run the server with `npm start`, open `http://localhost:3000`, and use a new conversation for each independent scenario.

| Faculty requirement | Message | Expected evidence |
|---|---|---|
| No tool required | `Hi, what kind of shop is this?` | Helpful direct response; no tool badge |
| Tool required: catalogue | `Show me a blue Eid outfit under 2500 taka in size L.` | `catalogue_search`; Nilima Kurti at BDT 1,850 |
| Tool required: stock | `Is the Nilima Kurti available in blue size M?` | `catalogue_search` then `inventory_check`; stock based on tool output |
| Tool required: policy | `What is delivery outside Dhaka?` | `store_policy`; BDT 130 and 3–5 business days |
| Tool required: calculation | `What is the price of two Nilima Kurtis plus outside-Dhaka delivery?` | Catalogue, policy and calculator tools; BDT 3,830 |
| Ambiguous request | `Help me choose the best one.` | One concise question about budget, occasion or type; no invented recommendation |
| Controlled handoff | `My payment was taken but my order is missing. I need a person.` | `human_handoff`; demo reference; no fake order lookup |
| Invalid API input | Send `{}` to `POST /chat` in Postman | Structured 400 validation error; server stays running |
| Persistent memory | `My size is L and budget is 2500 taka.` then `Recommend an Eid outfit for me.` | Second answer uses remembered size and budget in same thread |
| Optional current web | `Search the web for a current Bangladeshi fashion trend.` | `tavily_search` only when a Tavily key is configured |

## Automated verification

```bash
npm run check
npm test
npm run build
```

The automated suite covers calculator operations and failures, catalogue filtering, exact inventory, missing products/variants, store policy, safe human handoff, SQLite persistence, isolation, deletion, validation, and restart simulation.

## Rubric mapping

- **Architecture and structure (30%)**: explain `React → Express /chat → LangChain createAgent → selected tool → observation → final answer → SQLite checkpoint` using `ARCHITECTURE.md` and `BUSINESS_SPECIFICATION.md`.
- **Live agent/tool/LLM demo (50%)**: rehearse the scenarios above and expose the same application with `npm run tunnel`.
- **Q&A (20%)**: explain why tool observations prevent fabricated business facts, why `conversationId` maps to a SQLite thread, and why live Meta ordering is outside the safe demo scope.
