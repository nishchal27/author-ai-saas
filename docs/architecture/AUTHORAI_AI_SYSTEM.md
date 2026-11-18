# Varabhi AI System V2

**Status:** Authoritative AI system contract (approved direction)  
**Date:** 2026-11-18  
**Audience:** Engineers and AI coding agents implementing or changing AI behavior  
**Related documents:**

- Product direction: [`../product/AUTHORAI_PRODUCT_DIRECTION_V2.md`](../product/AUTHORAI_PRODUCT_DIRECTION_V2.md)
- Technical architecture: [`./AUTHORAI_TECHNICAL_ARCHITECTURE.md`](./AUTHORAI_TECHNICAL_ARCHITECTURE.md)
- Docs index: [`../README.md`](../README.md)
- Codebase audit: [`../../AUTHORAI_V2_PRODUCT_AND_CODEBASE_AUDIT.md`](../../AUTHORAI_V2_PRODUCT_AND_CODEBASE_AUDIT.md)

**Status labels:** **Current** = verified in code today · **Planned (MVP)** = required for V2 · **Later** = deferred · **Out of scope** = do not build

This document is the **source of truth for how AI capabilities must work**. Product direction decides which AI features belong in MVP. Live code decides what runs today.

---

## 1. AI principles

1. **Brand-aware, not generic chat.** Every generation is grounded in the user’s brand context, not a blank conversation.
2. **Approved context only for factual claims.** Prefer user-approved summary and facts. If a fact is not approved, the model must not invent it.
3. **Never invent** certifications, prices, results, testimonials, guarantees, customer names, or metrics that are not in approved context or the user’s explicit brief.
4. **Human review before publishing.** Drafts are suggestions. Varabhi must not auto-publish as an MVP behavior.
5. **Useful and specific over high volume.** Prefer a few strong pillars/ideas/drafts over generic spam.
6. **Explainable constraints.** Strategy “avoid” / anti-patterns are first-class inputs to generation when present.
7. **Cost and latency matter.** One primary model call per action by default; no multi-agent swarms.
8. **Untrusted inputs stay untrusted.** Pasted website text, uploads, briefs, and prior model output cannot escalate privilege.

---

## 2. Current implementation vs intended system

### Current (verified)

| Aspect | Reality |
|--------|---------|
| Entry point | `callAI(systemPrompt, userPrompt, model, maxTokens)` in `lib/claude.ts` |
| Providers | Anthropic preferred if `ANTHROPIC_API_KEY` set; else OpenAI. **No OpenRouter** |
| Clients | Constructed at module load; **throws at import** if neither AI key is set |
| Model IDs | Hardcoded in `getModelForTier`, `getModelForContent`, `lib/strategy.ts`, and `lib/content-evaluation.ts` (e.g. `claude-3-5-opus-20241022`, `claude-3-5-sonnet-20241022`, `claude-3-5-haiku-20241022`, `gpt-4o`) — **not verified against live provider catalogs** |
| Prompts | Inline template strings; **not versioned** |
| Structured output | Regex JSON extract + `JSON.parse` + TypeScript cast; **not Zod-validated** |
| Request validation | Zod on many HTTP bodies via `lib/validation.ts` |
| Evaluation | `evaluateContent` runs on **content generate only** (best-effort second LLM call); regenerate/repurpose skip it |
| Context assembly | Ad hoc in API routes (product fields, strategy JSON, `User.brandVoice`, founder bio, tech stack) |
| Rate limit | In-memory 20 req/min/user on generate/regenerate/repurpose/extract; strategy routes uncapped |
| Token/cost ledger | **Missing** |
| `lib/openai.ts` | Orphaned client export; image generation explicitly removed; throws if `OPENAI_API_KEY` missing on import |

### Intended (Planned MVP)

Product features request **named tasks**. Orchestration owns routing, providers, validation, quality policy, and usage logging. Domain services (Draft, Strategy, Ideas) never import provider SDKs directly.

---

## 3. Central AI orchestration

### Conceptual flow

```
Product feature / API route
  → named task request (e.g. content.generate)
  → BrandContextAssembler (task-scoped)
  → task router (registry: provider, model, limits, schema, QC policy)
  → provider adapter
  → normalized response
  → Zod schema validation
  → deterministic quality checks
  → optional AI review (only if policy requires)
  → persistence / HTTP response
  → usage + observability logging
```

### Rules

1. Features request **task IDs**, not model IDs.
2. Only provider adapters talk to Anthropic / OpenRouter / OpenAI SDKs or HTTP APIs.
3. Orchestration returns typed results or structured errors — never raw provider payloads to the UI.
4. No multi-agent framework. Plain async functions and a task registry are enough.
5. Import-time hard failures for missing keys should be replaced with **lazy init** and clear runtime errors when a task actually needs a provider (**Planned**).

### Example task request (illustrative)

```ts
// Conceptual contract — implementation may live under lib/ai/ when built
await ai.execute({
  task: "content.generate",
  userId: user.id,
  brandId: product.id,
  input: {
    ideaId, // Planned: optional vs required insightId today
    platform: "linkedin",
    format: "post",
    brief: userBrief, // untrusted
  },
})
```

---

## 4. Provider abstraction

### Supported text providers (approved)

| Provider | Role | Current | Planned |
|----------|------|---------|---------|
| **Anthropic** | Primary-quality path via official SDK | Used in `callAI` | Keep behind `AnthropicAdapter` |
| **OpenAI** | Direct OpenAI API | Used in `callAI` when Anthropic key absent | Keep behind `OpenAIAdapter` |
| **OpenRouter** | Multi-model gateway | **Not present** | Add `OpenRouterAdapter` |

### Adapter responsibilities

Each adapter must encapsulate:

- SDK or HTTP client construction
- Auth headers and API base URL
- Model identifier format for that provider
- Request/response mapping to a **normalized internal result**
- Error normalization (timeout, rate limit, auth, context length, content filter)
- Token usage extraction when the provider returns it

Product code must not switch on provider-specific error shapes.

### Normalized result (minimum fields)

```ts
type AiNormalizedResult = {
  text: string
  provider: "anthropic" | "openrouter" | "openai"
  model: string
  usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number }
  latencyMs: number
  rawFinishReason?: string
}
```

Exact TypeScript names may differ; the fields are the contract.

### OpenRouter requirements (verified against current OpenRouter docs)

OpenRouter exposes an **OpenAI-compatible** Chat Completions API:

- Endpoint base: `https://openrouter.ai/api/v1`
- Auth: `Authorization: Bearer <OPENROUTER_API_KEY>`
- Optional attribution headers: `HTTP-Referer`, `X-OpenRouter-Title` (also documented as `X-Title` in places)
- Model IDs are provider-prefixed slugs (e.g. `openai/gpt-4o-mini`, `anthropic/claude-...`)
- The existing `openai` npm package **may** be reused inside the OpenRouter adapter with `baseURL` set to OpenRouter — still a **separate adapter and API key**, never silently confused with direct OpenAI

Do **not** install additional SDKs until an implementation task explicitly needs them. Prefer reusing `openai` for OpenRouter compatibility if that remains valid at implementation time; re-check OpenRouter docs then.

### Key handling

| Env key | Purpose | Status |
|---------|---------|--------|
| `ANTHROPIC_API_KEY` | Anthropic | **Current** |
| `OPENAI_API_KEY` | Direct OpenAI | **Current** |
| `OPENROUTER_API_KEY` | OpenRouter | **Planned** — not referenced in repo today |

Never log these values. Never commit them.

---

## 5. Task-based routing

### Task registry (Planned MVP)

Central registry maps task IDs → configuration. **Never scatter model IDs across routes and services.**

Proposed task IDs (align names to existing jobs; rename only with a migration note):

| Task ID | Purpose | Current code anchor | Notes |
|---------|---------|---------------------|-------|
| `brand.summarize` | Propose business summary + facts for user approval | **Missing** | MVP Brand Studio |
| `strategy.generate` | Marketing strategy JSON | `generateMarketingStrategy` | Exists |
| `ideas.generate` | Pillars + content ideas | **Missing** | Replaces Activity-first default |
| `content.generate` | Platform draft from brand/idea context | `generateContent` / `runContentEngine` | Today requires Insight |
| `content.regenerate` | Revise draft with feedback | regenerate route → `generateContent` | Exists |
| `content.repurpose` | New draft from source draft | repurpose route | Exists |
| `content.review` | Optional semantic quality / risk review | `evaluateContent` (partial) | **Selective**, not default |
| `suggestions.generate` | Lightweight next-action / copy suggestions | Guide API is heuristic today | Keep cheap; AI only if needed |
| `insight.extract` | Activity → insight | `extractInsight` | **Compatibility / Later intake** — not default V2 spine |

`insight.extract` may remain for compatibility but is **not** the V2 primary idea path.

### Per-task configuration

Each registry entry should support:

| Field | Meaning |
|-------|---------|
| `provider` | `anthropic` \| `openrouter` \| `openai` |
| `model` | Provider-specific model id |
| `maxOutputTokens` | Hard cap |
| `timeoutMs` | Hard timeout |
| `temperature` / generation params | Task-appropriate defaults |
| `outputSchema` + `schemaVersion` | Zod schema identity |
| `promptVersion` | Versioned prompt id |
| `qualityPolicy` | Deterministic checks ± optional AI review |
| `usageCategory` | Billing/limit bucket (e.g. `strategy`, `draft`, `review`) |
| `fallback` | Optional explicit single fallback (provider/model) |

Support a **default model profile** with **task-specific overrides**.

### Fallback rules

- Fallbacks are **explicit** in the registry, **bounded** (typically one), and **logged**.
- Do not endlessly retry.
- Do not automatically roam the entire model catalog to hide misconfiguration.
- If the primary and fallback fail, return a clear error to the user and log provider/model/task.

### Model ID policy

- **Current hardcoded IDs are suspect** relative to public Anthropic naming and must be verified against live APIs in a dedicated implementation task before beta reliance.
- UI copy must not claim model names that code does not call.
- Changing a model means editing the registry (or env-backed registry values), not hunting through routes.

---

## 6. BrandContextAssembler

### Role

One centralized **server-side** assembler builds the context object for a task. It is the only place that decides which brand fields enter a prompt.

### Principles

1. Include **only** what the task needs.
2. Prefer **approved** summary/facts over AI-proposed or raw onboarding text once approval exists.
3. Never dump entire Prisma rows or unrelated tables into the prompt.
4. Mark untrusted segments explicitly for the prompt layer (brief, pasted site text, imported docs).
5. AI-proposed brand facts remain **unapproved** until the user explicitly approves them.

### Context slices (logical)

| Slice | Typical tasks | Notes |
|-------|---------------|-------|
| Brand identity + category | Most | name, type/category, industry |
| Approved summary | generate, ideas, strategy | Required grounding when present |
| Approved facts | generate, review | Bullet allow-list |
| Offerings / differentiators | summarize, strategy, ideas, generate | |
| Audience | strategy, ideas, generate | |
| Approved voice + examples | generate, regenerate, repurpose | Evolve from `User.brandVoice` toward brand-scoped |
| Strategy constraints | generate, ideas | platforms, tone, antiPatterns, proofTypes |
| Selected pillar / idea | generate | Planned entities |
| Platform + format | generate, regenerate, repurpose | |
| Source draft | regenerate, repurpose, review | |
| User brief | generate | Untrusted |
| External paste / URL text | summarize | Untrusted; Later ingest automation |

### Current gap

Routes manually assemble `ProductContext` / `StrategyContext` / brand voice. V2 work that adds Brand Studio fields must introduce the assembler rather than copying more ad hoc blocks.

---

## 7. Prompt architecture

### Requirements (Planned)

1. **Versioned, task-specific prompts** (`promptVersion` stored with generation metadata when available).
2. **Shared grounding rules** module (no invented facts; use approved context; refuse unknown claims).
3. **Explicit output contracts** in the prompt matching Zod schemas.
4. Clear separation:
   - **Trusted:** system instructions, grounding rules, output schema instructions
   - **Untrusted:** user brief, pasted website/about text, GitHub/activity text, previous model drafts
5. Prompt-injection-aware framing: untrusted content is data to analyze, never instructions to follow if they conflict with system rules.
6. No duplicated giant prompts copy-pasted across files — compose shared sections + task sections.

### Current

Prompts live as large template strings inside `lib/claude.ts`, `lib/strategy.ts`, and `lib/content-evaluation.ts` with no versions and weak separation of trusted vs untrusted content.

---

## 8. Structured outputs

### Rules

1. Define a Zod schema per structured task output (strategy, ideas, brand summary, review).
2. Parse model text → JSON carefully (fenced code blocks, truncated JSON).
3. **Validate with Zod.** Do not trust JSON merely because the prompt asked for JSON.
4. On failure:
   - Log task, schema version, finish reason, and a safe error code
   - Optionally **one** bounded repair attempt only if the task registry allows it
   - Otherwise return a structured failure to the API layer
5. Soft defaults that invent business facts are forbidden. Soft defaults that preserve UX for non-factual scores (as today’s evaluation fallback) must be explicit and non-authoritative.

### Current

HTTP inputs: Zod. LLM outputs: regex + `JSON.parse` + cast. Strategy has a heuristic fallback object on AI failure (acceptable as non-LLM backup only if clearly not presented as model judgment without labeling).

---

## 9. Hybrid quality control

### Decision

**Deterministic validation by default. Additional AI review only for selected tasks/policies.**

### Deterministic checks (default)

Run after schema validation as applicable:

- Required fields present
- Output length and format bounds (platform caps, empty detection)
- Duplicate / near-empty rejection
- Explicit prohibited claims patterns (guarantees, “certified”, fabricated metrics) when detectable
- Unsupported factual claims **when they can be checked reliably** against approved facts (string/entity allow-list style — not a fantasy NLI stack)
- Brand exclusions / strategy anti-patterns mentioned as hard avoid when configured
- Language/script sanity if needed

### AI review (`content.review`) — selective

Use when:

- User explicitly requests review
- High-value workflows (e.g. long-form blog) configured in quality policy
- Semantic risk assessment beyond deterministic rules
- Offline evaluation workflows

Do **not** add an expensive second LLM call to every generation by default.

**Current conflict to resolve in implementation:** `POST /api/content/generate` always attempts `evaluateContent` (extra Haiku call). Hybrid policy says this should become **opt-in / policy-driven**, not mandatory.

### AI review output rules

- Return **actionable suggestions** and optional scores
- Must **not silently replace** user or generated content without an explicit product action
- Persist review as metadata when useful (`evaluationScore` / `evaluationNote` exist on `ContentDraft` today)

---

## 10. Security and prompt injection

1. Treat as **untrusted data:** user briefs, pasted website text, documents, GitHub/activity payloads, prior model outputs, integration content.
2. System prompt must instruct the model to ignore instruction-like content inside untrusted data.
3. Model output must never:
   - Authorize privileged actions
   - Alter account tiers or quotas
   - Bypass permissions
   - Trigger publish/schedule without an authenticated user-initiated API that performs its own authz
4. Strip secrets from any job/event payloads.
5. Do not return stack traces or provider secrets to clients.

---

## 11. Cost and observability

### UsageMeter (Planned MVP)

- Server-side durable counters per user (and optionally per usage category)
- Checked before task execution; consume on accepted start or success — pick one policy and apply consistently
- Complement, do not rely solely on, the in-memory `checkRateLimit` map
- Strategy generation must be metered (currently uncapped)

### Per-call logging (Planned)

Record when available:

- task id
- provider, model
- latency
- token usage
- outcome (success, validation_fail, provider_error, quality_fail)
- estimated cost or cost category
- promptVersion / schemaVersion

### Bounds

- Registry `maxOutputTokens` and `timeoutMs`
- Context size budgets in BrandContextAssembler
- Bounded retries only

### Logging redaction

Do not log secrets or raw prompts/responses by default.

### Current gaps

No token ledger; tier is client-writable via settings; evaluation always adds cost on generate; model tier mapping for OpenAI is effectively `gpt-4o` for both tiers.

---

## 12. Evaluation strategy

### Goals

Measure whether Varabhi beats generic chat for brand-specific usefulness without inventing facts.

### Persona fixtures

Maintain representative cases for:

- Small online sellers (e.g. handmade goods)
- Small product brands
- Micro-SaaS founders
- Creators / freelancers

Each fixture includes: brand inputs, approved summary/facts, disallowed claims, target platforms, and graded expectations.

### Dimensions

| Dimension | Question |
|-----------|----------|
| Factual grounding | Does output stay within approved facts? |
| Usefulness | Would the user post/edit this? |
| Specificity | Concrete to this brand vs generic filler? |
| Brand voice | Matches approved voice? |
| Platform fit | Appropriate length/form for platform? |
| Latency | Within task budget? |
| Cost | Tokens/cost within category budget? |

### Test policy

- Ordinary CI: **mocked providers** returning fixtures
- Live model evals: **opt-in** only
- Track regressions when changing prompts, models, or schemas

**Current:** no automated eval harness.

---

## 13. Future image generation (Later only)

**Do not implement now. Do not install image-generation packages for this capability in the current phase.**

### Boundary

| Concern | Owner |
|---------|--------|
| Text drafts | DraftService / Content Studio |
| Image generation | Future **VisualService** |
| Assets | Future **MediaAsset** records linked to drafts |
| API | Future `/api/visuals/...` separate from `/api/content/generate` |

### Rules

- Keep image generation out of the text generation core
- Content Studio must not import image providers
- Text-only path must remain complete without visuals
- `lib/openai.ts` already states image generation was removed; empty `app/api/visuals` is not a live feature

Product direction §11 remains the product-level extension point description.

---

## 14. Mapping existing functions → future tasks

| Existing function / module | Future home |
|----------------------------|-------------|
| `callAI` | Replace with orchestration + adapters |
| `getModelForTier` / `getModelForContent` | Task registry |
| `generateMarketingStrategy` | `strategy.generate` via StrategyService |
| `extractInsight` | `insight.extract` (compat) |
| `runContentEngine` + `generateContent` | `content.generate` via DraftService |
| regenerate route logic | `content.regenerate` |
| repurpose route logic | `content.repurpose` |
| `evaluateContent` | `content.review` under selective policy |
| `decideContentOptions` | Deterministic helper called by DraftService (not an LLM task) |
| Ad hoc route context building | BrandContextAssembler |
| `checkRateLimit` | Keep as short-window shield; UsageMeter for durable caps |

---

## 15. Rules for AI coding agents (AI-specific)

1. Do not add provider SDK calls outside provider adapters once the AI layer exists; until then, do not create a third parallel client module without need.
2. Do not hardcode new model IDs in API routes or React components.
3. Do not make a second LLM review call the default for all generations.
4. Do not send entire DB records to the model.
5. Do not treat AI-proposed brand facts as approved.
6. Do not implement VisualService, agents, or OpenRouter **until** an explicit implementation task says so (OpenRouter is approved architecture; still not “implement now” in a docs-only or unrelated task).
7. When changing prompts, bump `promptVersion` and update eval fixtures.
8. When changing output shape, bump `schemaVersion` and Zod schemas together.
9. Verify model IDs against the live provider before relying on them in production.
10. Prefer fixing `callAI` import-time throws toward lazy initialization when touching that module for orchestration work.

---

## 16. Explicit AI non-goals (MVP)

- Autonomous multi-agent marketing systems
- Unattended publishing from model output
- Vector-DB semantic memory platforms
- Fine-tuning pipelines
- Image generation
- Hidden automatic provider cascading
- Training on user brand data by default

---

## Appendix A — Quality policy examples

```text
content.generate (standard post):
  qualityPolicy: deterministic_only

content.generate (blog) [optional later config]:
  qualityPolicy: deterministic_then_optional_review

content.review:
  qualityPolicy: n/a (this task IS the review)

brand.summarize:
  qualityPolicy: deterministic_only
  note: output is a PROPOSAL until user approval
```

## Appendix B — Open questions / unresolved decisions

These are known gaps; resolve in implementation tasks, not by guessing in feature PRs:

1. Final verified model IDs per provider (Current IDs look historically incorrect for Anthropic).
2. Whether OpenRouter becomes the default gateway or a selectable alternative beside direct Anthropic/OpenAI.
3. Exact persistence for usage ledger (new table vs counters on `User`).
4. Whether draft generation metadata stores `promptVersion` / `taskId` on `ContentDraft` or a side table.
5. Timing of removing mandatory `evaluateContent` from generate (should align with hybrid QC).
6. Brand-scoped voice migration off `User.brandVoice`.
