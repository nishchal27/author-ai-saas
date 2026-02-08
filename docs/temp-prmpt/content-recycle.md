You are working inside an existing production-grade SaaS called AuthorAI.

This is NOT a toy project and NOT a small feature.
You are implementing a FULL MVP that happens to live inside AuthorAI.

Before writing code, you MUST:
- Study the entire codebase
- Understand the architecture, layers, data flow, and design language
- Read the README and implementation documentation carefully
- Understand AuthorAI’s philosophy: product-first, decision-first, honest, signal-based, founder-centric, human-in-the-loop

### Context you must internalize

AuthorAI is a **product-aware marketing intelligence system**.
It adapts marketing decisions based on the PRODUCT being marketed, not generic prompts.

This new MVP is:
👉 **AI-powered Social Media Post Recycler**
But it is NOT a dumb rewrite tool.

It exists to:
- Solve a real pain for indie founders & solo devs
- Act as a public-facing entry point into AuthorAI
- Demonstrate AuthorAI’s thinking quality, not just text generation

This MVP will:
- Be PUBLIC and FREE
- Live on its OWN dedicated public page (outside the dashboard)
- Have capping, rate-limiting, abuse protection, debouncing, and security
- Be fast, smooth, and production-quality
- Have its OWN internal engine/layers, even if it reuses shared utilities

### Critical positioning (VERY IMPORTANT)

This tool is intentionally **context-light**.
It does NOT fully understand the user’s product.
That limitation should be felt.

Its job is to:
- Give immediate value
- Create trust
- Naturally lead users toward the full AuthorAI system (product-aware, strategy-driven)

Do NOT accidentally recreate full AuthorAI functionality here.

### MVP Functional Scope (do not exceed without strong reason)

- User pastes an old social post
- User selects:
  - Platform (X / LinkedIn)
  - Rewrite intent (shorter, punchier, clearer, same tone)
- System returns 2–3 high-quality recycled versions
- Output must respect platform norms and character limits
- Output must preserve original meaning and voice (no invented ideas)

No scheduling.
No analytics.
No login required (unless you strongly justify optional auth).
No content history for anonymous users.

### Architectural Expectations

- Create a clean internal separation:
  - Input layer
  - Rewrite decision layer
  - Generation layer
  - Output formatting layer
- Reuse existing Claude/OpenAI utilities ONLY if appropriate
- Keep this engine isolated so it can evolve independently

### Performance & UX requirements

- Page should feel instant, calm, and focused
- Minimal UI, zero clutter
- Clear affordances
- Thoughtful loading states
- Graceful errors
- Strong perceived performance

### Safety & Abuse Control (mandatory)

- Rate limiting (IP-based at minimum)
- Daily caps for anonymous users
- Input size limits
- Debouncing on submit
- Server-side validation
- No prompt injection vulnerabilities

### Design language

- Match AuthorAI’s calm, professional, founder-first UI
- No influencer language
- No hype
- Honest microcopy that explains limitations

### CTA philosophy

DO NOT use aggressive sales CTAs.

Instead:
- Subtle, contextual prompts like:
  “Want posts that reflect your real product work?”
  “AuthorAI connects this with your product, strategy, and activity.”

### Your responsibility

You are expected to:
- Make architectural decisions
- Create files, routes, components as needed
- Refactor shared utilities if required
- Leave the codebase cleaner than you found it
- Optimize for long-term maintainability

Think deeply.
Think critically.
Be opinionated but aligned.
Ship production-quality code.

Begin by analyzing the codebase and proposing an implementation plan before writing final code.
