# StyleFlow BD Business Specification

## Business and scope

StyleFlow BD is a fictional Facebook clothing boutique created for the AI Agent assignment. The agent helps customers discover products, check exact stock, understand policies, calculate prices, remember preferences, and request a human seller.

It does **not** take payment, confirm an order, access real Facebook messages, or claim real delivery status. Those actions require a verified business system and a human confirmation.

## Trusted demo data

The 40-product catalogue and its colour/size stock quantities live in `src/data/store.js`. It covers kurtis, three-piece sets, sarees, abayas, shirts, panjabis, dresses, and tops. The same file is the source of truth for delivery, payment, return, exchange, ordering, and contact policies. Editing this one file is enough to replace the fictional data with a real store later.

## Agent tools

| Tool | When the agent uses it | Controlled result |
|---|---|---|
| `catalogue_search` | Product discovery, price, category, colour, size, budget, occasion | Only products from the local catalogue |
| `inventory_check` | Exact size/colour availability | Listed variant and stock quantity |
| `product_compare` | Compare two to four exact catalogue products | Trusted price, style, colour, size and stock fields |
| `outfit_recommendation` | Personalized outfit discovery | Up to three matches using supplied preferences |
| `size_guide` | Measurement and sizing questions | Demo chart, starting size and fit disclaimer |
| `wishlist` | Save, remove, list or clear favourites | Conversation-isolated demo wishlist |
| `order_draft` | Prepare or edit a non-binding shopping summary | Variant-checked items, subtotal, delivery and total; never a placed order |
| `store_policy` | Delivery, payment, return, exchange, order or contact questions | Policy from the local source of truth |
| `calculator` | Discounts, quantities and totals | Deterministic arithmetic |
| `human_handoff` | Human request, payment/order/damage issue, unsafe uncertainty | Demo reference and next step |
| `tavily_search` | Optional current external information only | Live web observation; never store facts |

## Safety rules

- Never invent products, prices, stock, policies, payments, orders, or delivery status.
- Never use Tavily as the source for StyleFlow BD business facts.
- Never ask for passwords, PINs, OTPs, or card numbers.
- Clearly state that a human must confirm an order.
- Ask a concise clarifying question when important shopping details are missing.
- Match the customer in English, Bangla, or Banglish.

## Optional Facebook integration

The repository includes a credential-gated Meta Messenger webhook that maps a Facebook sender ID to `conversationId`, invokes the same agent, and replies through the Graph Send API. It remains inactive in the public demo because live operation requires a real Page, app credentials, webhook configuration, permissions, and Meta review.
