# Varabhi Product Direction V2

**Status:** Official product direction (approved)  
**Date:** 2026-11-17  
**Audience:** Product and engineering contributors  
**Related documents:**

- Docs index / authority hierarchy: [`docs/README.md`](../README.md)
- Technical architecture: [`docs/architecture/AUTHORAI_TECHNICAL_ARCHITECTURE.md`](../architecture/AUTHORAI_TECHNICAL_ARCHITECTURE.md)
- AI system contract: [`docs/architecture/AUTHORAI_AI_SYSTEM.md`](../architecture/AUTHORAI_AI_SYSTEM.md)
- Technical/product audit (preserve; do not overwrite): [`AUTHORAI_V2_PRODUCT_AND_CODEBASE_AUDIT.md`](../../AUTHORAI_V2_PRODUCT_AND_CODEBASE_AUDIT.md)
- Folder index: [`docs/product/README.md`](./README.md)
- Historical strategy thinking (reference only): [`docs/very-important.mdx`](../very-important.mdx)

**How to read status labels in this document:**

| Label | Meaning |
|-------|---------|
| **Current** | Exists in the codebase today (may be partial or unverified end-to-end) |
| **Planned (MVP)** | Required for the V2 beta; not fully present yet |
| **Later** | Intentionally deferred; may be built after demand is shown |
| **Out of scope** | Do not build unless product direction is explicitly revised |

This document is the **source of truth for product vision and scope**. The audit remains the source of truth for what the codebase currently implements. When they conflict on *what to build*, this document wins. When they conflict on *what already works*, the audit and live code win.

---

## 1. Product overview

**Varabhi** is a brand-aware AI marketing workspace for micro-businesses, small product brands, solo founders, and creators.

**Core promise:**

> Teach Varabhi about your brand. Let it help you decide what to create and produce consistent marketing content.

Varabhi helps people without a dedicated marketer:

1. Capture and correct what their brand is.
2. Decide what content to create (pillars, ideas, suitable platforms).
3. Turn ideas into platform-specific, brand-consistent drafts they can review, edit, and reuse.

Varabhi is **not** a full marketing suite, publishing network, CRM, or autonomous marketing agent.

### Current vs intended product shape

| Aspect | Current (codebase) | Intended V2 |
|--------|--------------------|-------------|
| Center of gravity | Product profile + Activity → Insight → Draft → Schedule/Publish | Brand Intelligence → Marketing Intelligence → Content Studio → simple Content Planner |
| Primary user story | Founder / build-in-public oriented | Brand owner who needs ideas and drafts |
| Domain noun | `Product` (+ required `Insight` for drafts) | Brand Profile / Brand Studio (evolve from Product) |
| Output | Strategy + drafts (Insight-gated) | Approved brand context + pillars/ideas + platform drafts + weekly plan |
| Publishing | Partially implemented; not MVP | Out of MVP; human export/copy first |
| Images | Removed / empty routes | Later modular capability |

---

## 2. Product vision and positioning

### Vision

Become the practical place where a small brand teaches the AI once, then repeatedly gets:

- clear guidance on *what* to create,
- drafts that sound like *them*,
- and a simple plan to stay consistent —

without needing marketing expertise or a team.

### Positioning statement

**For** micro-businesses, small product brands, solo founders, and creators  
**who** struggle to decide what to post and to produce consistent, on-brand content  
**Varabhi** is a brand-aware AI marketing workspace  
**that** remembers approved brand facts and helps generate ideas and platform-specific drafts  
**unlike** generic chat tools (which forget context) or social schedulers (which assume you already know what to say).

### Positioning rules

- Lead with **brand understanding + content decisions + drafts**, not automation.
- Compete on **persistence of brand context** and **practical recommendations**, not on feature count.
- Never claim Varabhi replaces a marketer, agency, or full social stack.
- Prefer one strong weekly loop over many shallow features.

---

## 3. Target audience and user personas

Varabhi supports **different brand categories in one product**, using shared Brand Intelligence fields (category, offerings, audience, voice, facts) rather than separate apps per industry.

### Primary segments (initial)

#### A. Micro-businesses and online sellers

Examples: organic food businesses, clothing brands, accessories and jewellery, lifestyle and handmade products, small online stores.

**Needs:** Clear product storytelling, captions/posts, consistent voice, ideas beyond “new arrival” spam.

#### B. Digital product businesses

Examples: micro-SaaS founders, indie hackers, solo founders, small software product companies.

**Needs:** Positioning clarity, platform fit (what to skip), credible posts without hype, reuse of one idea across channels.

#### C. Adjacent audiences (welcome, not exclusive focus)

Independent creators, freelancers, small personal brands.

**Needs:** Simple brand profile, ideas, drafts; avoid enterprise workflow.

### Personas (lightweight)

| Persona | Example | Job to be done | Success looks like |
|---------|---------|----------------|--------------------|
| Shop owner | Handmade jewellery seller | Know what to post this week and write captions that sound like the brand | 3–5 usable drafts/week from one Brand Profile |
| Micro-SaaS founder | Solo builder of a small B2B tool | Explain the product clearly and stay visible without a marketer | Strategy “do/don’t” + LinkedIn/X drafts grounded in approved facts |
| Creator / freelancer | Coach or consultant | Stay consistent without reinventing messaging | Pillars + reusable drafts in one voice |

### Explicit non-targets for MVP

- Marketing teams needing collaboration workflows
- Agencies needing client white-label suites
- Enterprises needing SSO, roles, CRM, and campaign ops

---

## 4. Problems Varabhi will solve

Focused problems only:

1. **Blank-page problem** — “I don’t know what content to create for *my* business.”
2. **Explanation problem** — “I struggle to explain products, differentiators, and audience clearly.”
3. **Voice consistency** — “My posts don’t sound like one brand.”
4. **Idea generation** — “I run out of useful ideas that fit my brand.”
5. **Draft production** — “Turning a rough idea into good, platform-specific copy is slow.”
6. **Consistency of effort** — “I don’t stick to a simple content rhythm.”

Varabhi addresses these by combining **Brand Intelligence** (teach once, correct often), **Marketing Intelligence** (pillars, ideas, platforms), and **Content Studio** (generate, regenerate, repurpose, save).

---

## 5. Problems Varabhi will NOT attempt to solve

Do not market or build these as core promises:

| Problem | Why out of scope (for now / permanently unless revised) |
|---------|----------------------------------------------------------|
| Auto-posting to every social network | Scheduler/publisher complexity; OAuth fragility; not required for first value |
| Proving ROI with deep analytics | Requires reliable publish + platform APIs; distracts from writing quality |
| Running full campaigns / ads | Different product category |
| CRM / lead pipelines | Not content workspace |
| Replacing human judgment before publish | Users must review; Varabhi must not invent product facts |
| “Autonomous marketing agent” that acts without review | Reliability and trust risk |
| Industry-specific separate products | One modular brand model is enough |
| Design suite / Canva replacement | Visuals are a later add-on to content, not the product center |
| Enterprise marketing ops | Collaboration, permissions, SLAs — later only if demanded |

---

## 6. Core product capabilities

Four named capabilities. Status is relative to the current repo as of the V2 audit.

### 6.1 Brand Intelligence / Brand Studio

**Intent:** User teaches Varabhi about the brand; AI proposes understanding; user corrects and approves facts.

| Capability | Status |
|------------|--------|
| Capture brand/product basics (name, type, audience, stage, description, website) | **Current** (as `Product` onboarding) |
| Generate marketing strategy from profile | **Current** (`lib/strategy.ts` + `MarketingStrategy`) |
| Free-text brand voice | **Current** (weak; on `User.brandVoice`) |
| Approved business summary / fact sheet user can correct | **Planned (MVP)** |
| Category-friendly Brand Studio UX for sellers + SaaS | **Planned (MVP)** |
| Knowledge sources (URL/PDF ingest) | **Later** |

### 6.2 Marketing Intelligence

**Intent:** Recommend pillars, ideas, platforms; explain why; warn what to avoid.

| Capability | Status |
|------------|--------|
| Platform recommend / avoid + tone + anti-patterns | **Current** (strategy engine) |
| Content pillars | **Planned (MVP)** |
| Content ideas without Activity logging | **Planned (MVP)** (today often Insight/Activity-shaped) |
| Practical, plain-language explanations | **Planned (MVP)** (improve copy; engine exists) |

### 6.3 Content Studio

**Intent:** Produce and manage platform-specific drafts using approved brand context.

| Capability | Status |
|------------|--------|
| Generate posts, blogs, threads, captions, carousels | **Current** (Insight-gated) |
| Regenerate with feedback | **Current** |
| Repurpose across audience/format/platform | **Current** |
| Save, edit, copy drafts | **Current** |
| Generate from Brand/Idea without required Insight | **Planned (MVP)** |
| Always ground prompts in approved facts | **Planned (MVP)** |

### 6.4 Content Planner

**Intent:** Simple weekly plan and progress — not a publishing calendar product.

| Capability | Status |
|------------|--------|
| Schedule + publish calendar UI | **Current** but **not** the V2 MVP planner |
| Weekly plan of ideas/drafts with status | **Planned (MVP / early post-MVP)** — prefer checklist over scheduler |
| Automated publishing | **Out of scope** for MVP (**Later** only with clear demand) |

---

## 7. Brand Intelligence concept and data requirements

### Concept

Brand Intelligence is the durable context Varabhi uses for every recommendation and draft.

**Principle:** Prefer user-approved facts over model improvisation. If a fact is not approved, the model must not invent it.

### Logical data (not a schema migration — guidance only)

Evolve from today’s `Product` + `User.brandVoice` + `MarketingStrategy` toward:

| Field / concept | Required for MVP? | Notes |
|-----------------|-------------------|-------|
| Brand name | Yes | Exists as `Product.name` |
| Category / business type | Yes | Exists as `Product.type` (extend labels for sellers, not only SaaS) |
| Offerings (products/services) | Yes | May start as description + structured list JSON |
| Audience | Yes | `audience` + `audienceDetail` |
| Positioning / differentiators | Yes | Text; user-editable |
| Brand voice / tone | Yes | Move toward brand-scoped JSON, not only user-level |
| Website / about text (manual paste OK) | Recommended | Ingest automation is Later |
| **Approved summary** | Yes | AI draft → user edit → `approvedAt` |
| **Approved facts** (bullet list) | Yes | Grounding block for prompts |
| Competitors (optional) | Optional | Already on Product |
| Strategy snapshot | Yes (lite) | Reuse `MarketingStrategy` |
| Content pillars | Yes | New concept |
| Content ideas | Yes | New concept (may supersede Insight as default path) |

### User correction loop (required UX)

1. User enters brand basics (and optional paste from website/about page).
2. AI proposes a short business summary + facts.
3. User edits and marks **Approved**.
4. All generation uses approved context.
5. User can reopen Brand Studio and re-approve after changes.

### Multi-category support (without multi-app)

Use shared fields + category-specific **defaults** (example pillars, platform heuristics), similar in spirit to `STRATEGY_PATTERNS` in `lib/strategy.ts` and the profiles in `docs/very-important.mdx`. Do not fork the codebase per industry.

---

## 8. Marketing Intelligence workflow

### Target workflow (Planned MVP)

```
Brand Profile (approved)
  → Strategy lite (platforms to use / avoid, tone, cadence hint)
  → Content pillars (3–5)
  → Content ideas (batch of practical ideas)
  → User accepts / edits / discards ideas
  → Hand off to Content Studio
```

### Rules

- Recommendations must be **explainable** in plain language.
- Always include **what not to do** when confidence is high (existing strength of the strategy engine).
- Keep volume modest: better 5 good ideas than 50 generic ones.
- Do not require GitHub activity or “build in public” logging to get ideas.
- Activity / Insight / GitHub may remain as **optional Later intake**, not the default path.

### Mapping to existing code

| Step | Reuse |
|------|--------|
| Strategy | `lib/strategy.ts` `generateMarketingStrategy`, strategy UI |
| Audience/platform heuristics | `lib/content-intelligence.ts`, `lib/content-decision.ts` |
| Idea generation | New thin service; can borrow prompt discipline from `extractInsight` without requiring `Activity` |

---

## 9. Content Studio workflow

### Target workflow (Planned MVP)

```
Selected Content Idea (or short user brief)
  + Brand Context (approved summary, facts, voice, strategy constraints)
  → Decide format/platform (heuristics + user override)
  → Generate draft text
  → Optional quality note (lightweight)
  → User reviews / edits
  → Regenerate with feedback OR Repurpose to another platform
  → Save draft (copy/export)
```

### Current workflow (for contrast)

```
Insight (from Activity extract OR manual Insight create)
  → /api/content/generate (requires insightId)
  → ContentDraft
  → regenerate / repurpose / schedule
```

V2 must **relax the Insight requirement** so Brand + Idea is enough. Keep Insight as optional compatibility during migration.

### Content Studio responsibilities

- Platform-specific copy (LinkedIn, X/Twitter, Facebook, blog, captions, threads, etc.)
- Regenerate and improve
- Repurpose
- Draft CRUD, copy, status
- Preserve brand context on every call via a single **Brand Context assembler**

### Non-responsibilities (MVP)

- Auto-publish
- Image generation (see §11)
- Deep SEO tooling
- Ad copy networks

---

## 10. Content Planner scope

### In scope (simple)

- A **weekly view** of suggested or accepted ideas
- Link ideas to draft status: idea → drafting → ready → used/exported
- Light progress (“3 of 5 drafts ready”)
- Cadence hints from strategy (e.g. 2–3 posts/week) as guidance, not enforcement

### Out of scope (MVP)

- Complex drag-and-drop publishing calendars as the product center
- Time-zone multi-account scheduling
- Automated posting via LinkedIn/Twitter integrations
- Analytics dashboards as planner dependency

### Relationship to current Calendar feature

Current `/dashboard/calendar` + `Schedule` + Inngest publish path is **implementation that exists** but is **not** the V2 MVP Content Planner. Do not invest in it until Planner checklist value is proven. Prefer a simpler plan model (JSON or thin table) over expanding Schedule/publish.

---

## 11. Future AI image generation capability and extension points

**Status:** **Later** — document only. Do **not** implement now. Do **not** install image providers or packages for this capability in the current phase.

### Intended value (future)

Generate images relevant to content: social post images, product campaign visuals, promotional creatives, brand-consistent visual concepts, images associated with a draft.

### Target pipeline (future)

```
Brand Context
  → Content Idea
  → Text Generation (Content Studio)
  → Optional Image Generation (Visual Studio module)
  → Review
  → Export
```

### Extension points (design without premature abstraction)

Keep image generation **out of** the text generation core. Practical separation:

| Concern | Owner | Guidance |
|---------|--------|----------|
| Brand visual hints | Brand Intelligence | Optional fields later: palette words, style notes, “no stock clichés” — store as data, not as an image SDK |
| Text draft | Content Studio / `DraftService` | Remains text-only; may store optional `visualBrief` string generated from the draft |
| Image request | Future `VisualService` (new module) | Input: brand visual hints + draft id + platform + brief; Output: image asset metadata |
| Storage | Future `MediaAsset` records | Link `contentDraftId`, urls, prompt used, status — do not overload `ContentDraft.content` |
| API | Future `/api/visuals/...` | Separate routes; do not entangle `/api/content/generate` |
| Provider | Adapter behind `VisualService` | Swap OpenAI/others later; Content Studio must not import providers directly |
| UI | “Add image” on draft review | Optional step; text-only path must remain complete |

### What already exists (caution)

- `lib/openai.ts` notes image generation removed.
- Empty `app/api/visuals` path observed in audit — do not treat as a live feature.
- README still mentions DALL·E — outdated relative to code and to this direction.

### Anti-patterns to avoid now

- Building a generic plugin framework “for images someday”
- Coupling `generateContent` return type to image blobs
- Reintroducing visuals as a launch blocker

---

## 12. Proposed application navigation

### Target primary nav (V2)

| Nav item | Purpose |
|----------|---------|
| Home | Next best action; progress toward this week’s plan |
| Brand | Brand Studio (profile, approved summary, voice, facts) |
| Strategy | Marketing Intelligence summary (platforms, avoid, pillars entry) |
| Ideas | Pillars + content ideas |
| Content | Content Studio (drafts, create, regenerate, repurpose) |
| Plan | Simple weekly planner |
| Settings | Account, limits, integrations (advanced) |

### Current nav (code)

Primary: Home, Strategy, Content, Settings. Secondary: Calendar, Analytics. Activities/Insights pages exist but are not primary nav items.

### Navigation rules

- Hide or demote Activities, Calendar (publish), Analytics, Integrations until needed.
- Prefer one clear CTA on Home (existing `/api/guide/next` idea is useful if rewritten for Brand → Ideas → Draft).
- Mobile: same destinations; no dense icon rows.

---

## 13. UX/UI design principles

### Prioritize

- Clean, uncluttered layouts
- Friendly language (avoid insider marketing jargon and engineer-only taxonomy in default UI)
- Clear navigation and hierarchy
- Smooth, purposeful interactions (not decoration)
- Fast perceived performance
- Strong loading, empty, and error states
- Responsive desktop and mobile
- Shared design tokens and reusable UI (`components/ui`)
- Minimal steps from open → first useful result (strategy summary or first draft)

### Avoid

- Overloaded dashboards and “Background jobs” theater with no data
- Too many settings and advanced knobs on first run (intent/persona can be advanced)
- Charts and analytics as vanity UI
- Excessive animation
- Unnecessary background processes
- Features that look impressive but do not help create content

### Tone of UI copy

- “Tell us about your brand” not “Configure sales motion taxonomy”
- “What to post this week” not “Invoke content intelligence pipeline”
- Always remind: review before publishing; Varabhi should not invent facts

---

## 14. Modular architecture principles

Continue a **modular monolith** on the existing stack:

- Next.js 14 App Router
- Clerk auth
- Prisma + PostgreSQL
- API routes
- AI via thin server modules (`lib/*`)
- Orchestrated function calls — **not** microservices, **not** multi-agent frameworks

### Recommended module boundaries

```
BrandContextAssembler     # approved summary, facts, voice, category
StrategyService           # existing lib/strategy.ts
PillarIdeaService         # new
DraftService              # wrap/adapt content-engine + generateContent
RepurposeService          # existing repurpose flow
UsageMeter                # durable limits
VisualService             # LATER — optional images
```

### Rules

1. One user action ≈ one API route ≈ one primary model call (+ optional cheap check).
2. No overlapping generators for the same job.
3. Shared Brand Context object passed into strategy, ideas, and drafts.
4. Feature flags or simple route/nav gating > plugin frameworks.
5. Prefer deleting unused publish/analytics surface area from the *product experience* even if code remains frozen.

### Avoid

- Unnecessary microservices
- Premature agent frameworks
- Excessive abstraction layers
- Multiple competing “insight” and “idea” pipelines without a migration plan
- Generic plugin systems without a concrete requirement

---

## 15. Existing codebase reuse strategy

Aligned with audit verdict **Option B — partial rebuild on this codebase**.

### Preserve and evolve

| Asset | Role in V2 |
|-------|------------|
| Next.js + Tailwind + `components/ui` | App shell |
| Clerk + `lib/users.ts` | Auth and user isolation |
| `Product` / `MarketingStrategy` | Seed Brand Studio + strategy lite |
| `lib/strategy.ts` | Marketing Intelligence core |
| `lib/claude.ts`, `content-engine`, `content-decision`, `content-intelligence` | Content Studio core |
| Draft APIs and content UI | Content Studio |
| Zod validation, `api-error` | Reliability patterns |
| Onboarding modal | Simplify into Brand Studio onboarding |

### Refactor (planned engineering; not done by this doc)

- Brand-first domain; approved summary/facts
- Optional Insight FK on drafts
- Durable usage limits; lock client-writable premium tier
- Simplify create UX; demote Activity-first flows
- Verify AI model IDs and cost controls

### Freeze / do not center product on

- Inngest auto-publish and analytics sync as MVP pillars
- GitHub activity as required input
- Landing pricing claims without billing
- Empty visuals/webhooks/job-status UI

### Postpone

- OAuth social publishing
- Deep analytics
- Team collaboration
- Heavy website crawlers (manual paste first)
- Image generation module (§11)

---

## 16. Security, privacy and reliability principles

Contributors must follow these (details and findings: audit §5 / §7):

1. **User isolation** — every query scoped to the authenticated app user.
2. **Validate inputs** — Zod (or equivalent) on mutating routes.
3. **No invented facts** — generation grounded in approved Brand Intelligence.
4. **Human review** — drafts are suggestions; publishing remains user-owned.
5. **Secrets** — never log API keys or tokens; encrypt stored third-party tokens when integrations exist; do not put access tokens in job event payloads.
6. **Abuse and cost control** — durable per-user generation limits; do not allow clients to self-upgrade model tier.
7. **Rate limiting** — in-memory limits are insufficient alone for multi-instance production; use durable counters.
8. **Fail clearly** — user-safe errors; server-side logging without leaking internals.
9. **Privacy / retention** — brand data and drafts are user-owned; be explicit before any training-data use (none by default).
10. **Prompt injection awareness** — treat pasted website/user text as untrusted content inside prompts.

---

## 17. MVP versus later releases

### MVP (beta) — must have

1. Simple Brand Studio onboarding (multi-category friendly)
2. AI business summary + facts with user correction/approval
3. Strategy lite (platforms, avoid, tone, short explanation)
4. Content pillars + ideas (no Activity required)
5. Platform-specific generation, regenerate, save/edit/copy
6. Brand context preserved across generation
7. Soft usage limits
8. Focused navigation (Brand / Strategy / Ideas / Content / Plan-or-Home)

### Soon after MVP (high value)

- Repurpose prominently in UI (code largely exists)
- Simple weekly Content Planner checklist
- Stronger brand voice examples
- Optional Quick Tools (anonymous, tightly limited) — only if it aids acquisition

### Later

- Website fetch → draft summary
- Brand knowledge sources table
- Optional Activity/GitHub as idea intake
- Stronger “unsupported claims” checks
- AI image generation module (§11)
- Billing (e.g. Stripe) when limits alone are insufficient
- Social publishing / analytics **only with demonstrated demand**

### Explicitly not MVP

- Automated social publishing
- Complex analytics
- Enterprise collaboration
- CRM
- Full marketing automation
- Complex campaign management
- Autonomous multi-agent marketing
- AI image generation

---

## 18. Feature inclusion/exclusion decision framework

Before adding a feature, answer all of the following. If any answer is “no,” defer.

1. **User problem:** Does it directly help decide what to create or produce better on-brand drafts?
2. **Audience fit:** Does it help micro-businesses *or* digital product brands without harming the other?
3. **Brand-first:** Does it use or improve approved Brand Intelligence?
4. **Simplicity:** Can a non-marketer use it without training?
5. **Evidence:** Is there user demand or clear beta friction — not just a competitor checklist?
6. **Cost/risk:** Are AI cost, security, and maintenance acceptable for a solo/small team?
7. **Modularity:** Can it be added without rewriting Brand/Content cores?
8. **MVP honesty:** Are we willing to leave it out of marketing until it works?

**Default bias:** Prefer improving Brand Studio → Ideas → Drafts over adding adjacent systems (publish, analytics, agents, images).

---

## 19. Success metrics for the initial beta

Track a small set. Prefer behavior over vanity.

| Metric | Why it matters |
|--------|----------------|
| Time to first approved Brand Profile | Onboarding friction |
| Time to first saved draft | Core loop speed |
| % users who approve brand summary | Trust / grounding adoption |
| Drafts created per active user / week | Habit / weekly return |
| Regenerates or edits per draft | Quality iteration (qualitative too) |
| Week-2 return rate | Retention signal |
| Qualitative: “better than ChatGPT for my brand?” | Differentiation hypothesis |
| AI cost per active user / week | Viability |

**Non-goals as primary beta KPIs:** posts published via Varabhi, follower growth, dashboard chart engagement.

**Abandon / pivot signals** (from audit, still valid):

- Users still prefer raw ChatGPT after trying Brand Profile → drafts
- Users refuse to maintain a short approved summary
- Weekly ideas do not drive return
- Cost per retained user exceeds sustainable pricing after caps

---

## 20. Product principles that future contributors must follow

1. **Brand-first** — understand and approve business context before generating content.
2. **Simple** — no marketing expertise required for the default path.
3. **Modular** — clear services; features easy to add, replace, disable, or remove.
4. **Lightweight** — avoid unnecessary dependencies and infrastructure.
5. **Fast** — responsive UI; efficient backend (minimize chained model calls).
6. **Friendly UX** — clean, modern, intuitive, mobile-responsive.
7. **AI-native** — AI must solve a specific user problem, not decorate the product.
8. **Reliable** — validate inputs, handle failures, protect user data.
9. **Maintainable** — clear modules and simple orchestration over clever frameworks.
10. **Focused** — no feature without a demonstrated user need.
11. **Honest** — do not document or market capabilities that are not implemented.
12. **Human-in-the-loop** — users review content; Varabhi does not invent product facts.
13. **One product, many categories** — extend Brand Intelligence; do not fork apps per industry.
14. **Audit + direction** — use this file for *where we are going*; use the audit for *what the code is*; verify in code when unsure.

---

## Appendix A — Alignment notes with the technical audit

The audit recommended partial rebuild, Brand Profile → ideas → drafts, freeze publish/analytics, and postpone visuals. This direction **accepts** that engineering recommendation and **extends** the product audience beyond solo founders to micro-businesses and creators.

| Topic | Audit | This direction |
|-------|-------|----------------|
| Reuse vs rewrite | Partial rebuild | Confirmed |
| MVP center | Brand + ideas + drafts | Confirmed (+ named Brand Studio / Content Studio / Planner) |
| Audience | Narrowed to solo SaaS-like first | Broader: sellers + digital products + creators (one app) |
| Weekly plan | P1 | In capability set; keep simple |
| Images | P3 do not build | Later modular capability with extension points documented |
| Publishing | Do not build for MVP | Confirmed out of MVP |

## Appendix B — Document control

| Item | Value |
|------|-------|
| Owner | Product direction for Varabhi V2 |
| Change process | Update this file when scope decisions change; do not silently expand MVP in code |
| Code changes | This document alone must not be treated as permission to implement; implementation starts only after review of this direction |
