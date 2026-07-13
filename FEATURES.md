# StyleFlow BD enhanced commerce features

## Customer-facing capabilities

- Visual product cards with trusted catalogue prices, variants, and local editorial images
- Personalized top-three recommendations by occasion, budget, size, color, and category
- Two-to-four product comparison by price, description, occasions, colors, sizes, and stock
- Demo size chart with chest-based starting-size recommendation and fit disclaimer
- Conversation-scoped wishlist with add, remove, list, and clear operations
- Conversation-scoped order draft with variant validation, quantity, subtotal, delivery, and total
- Human handoff reference with a structured next step and no collection of payment secrets
- Date-stamped Tavily search for current information; catalogue facts remain grounded locally
- English, Bangla, and Banglish responses with LangGraph conversation memory

## Experience and evaluation

- Helpful/not-helpful feedback controls
- In-memory demo analytics for request success, latency, tools, products, handoffs, and feedback
- Rich response metadata for product cards, handoffs, wishlists, and order drafts
- Regression coverage for provider-supplied empty optional fields and generic category filters

## Facebook Messenger

`/webhooks/facebook` includes verification, signed-event checking, sender-isolated memory, agent invocation, and Send API replies. Live activation requires credentials and permissions from a Meta developer app and Facebook Page.

## Safety boundaries

The wishlist and order draft are demonstrations. They do not create an account, reserve stock, collect an address, accept payment, or place an order. A human seller must confirm the final transaction.
