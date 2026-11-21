# Varabhi Technical Architecture V2

**Status:** Authoritative engineering architecture (approved direction)  
**Date:** 2026-11-18  
**Audience:** Engineers and AI coding agents  
**Related documents:**

- Product direction (what to build): [`../product/AUTHORAI_PRODUCT_DIRECTION_V2.md`](../product/AUTHORAI_PRODUCT_DIRECTION_V2.md)
- AI system contract: [`./AUTHORAI_AI_SYSTEM.md`](./AUTHORAI_AI_SYSTEM.md)
- Docs index: [`../README.md`](../README.md)
- Codebase audit (what exists today): [`../../AUTHORAI_V2_PRODUCT_AND_CODEBASE_AUDIT.md`](../../AUTHORAI_V2_PRODUCT_AND_CODEBASE_AUDIT.md)

**How to read status labels**

| Label | Meaning |
|-------|---------|
| **Current** | Present in the repository today (verified by inspecting code) |
| **Planned (MVP)** | Required architecture for V2 beta; not fully present yet |
| **Later** | Intentionally deferred |
| **Out of scope** | Do not build unless product direction is revised |

This document is the **source of truth for how the application should be engineered**. It does not replace product scope decisions. It does not claim Planned capabilities already ship.

---

## 1. Purpose, scope, and source-of-truth hierarchy

### Purpose

Define the non-negotiable engineering shape of Varabhi V2 so contributors implement features consistently: modular, secure, cost-aware, and maintainable by a small team.

### Scope

In scope:

- Application architecture and module boundaries
- Server/client boundaries in Next.js App Router
- Client state ownership (TanStack Query vs Zustand vs local state)
- API request lifecycle
- Persistence and migration rules
- Security, reliability, logging, testing, and change policy

Out of scope for this document:

- Product vision and MVP feature lists → product direction
- Prompt contracts, provider adapters, task routing details → AI system doc
- Live “does this endpoint work today?” claims → audit + code inspection

### Authority hierarchy

1. **Product direction** decides *what* to build.
2. **This technical architecture** decides *how* the app should be engineered.
3. **AI System** decides *how AI capabilities* must work.
4. **Audit + live code** decide *what currently exists and works*.

When product and architecture conflict on *scope*, product wins. When architecture and code conflict on *current behavior*, code wins and docs must be updated. When an AI coding agent is unsure, read the relevant docs first, then inspect code.

---

## 2. Engineering goals

Every change should improve, or at least not harm, these goals:

| Goal | Practical meaning for Varabhi |
|------|--------------------------------|
| **Fast** | Short path from user action → useful draft; minimize chained model calls and unnecessary round trips |
| **Smooth** | Clear loading/empty/error states; predictable mutations; no silent failures |
| **Secure** | Clerk auth, user-scoped queries, Zod validation, no secrets in logs/events, treat user/imported text as untrusted in prompts |
| **Robust** | Explicit error handling; bounded retries; durable usage limits; fail closed on authz |
| **Maintainable** | Thin modules; one primary service per job; avoid speculative frameworks |
| **Scalable enough** | Modular monolith on Vercel + Postgres; no microservices for MVP |
| **Cost-aware** | Task-based model routing; usage metering; no default second LLM call on every generate |

---

## 3. Modular monolith

### Decision

**Approved:** keep a **modular monolith** on the existing Next.js App Router application.

Do **not** introduce:

- Microservices
- Multi-agent frameworks
- Vector databases
- Kafka / event buses
- Speculative plugin frameworks “for later”

### Intended module map (Planned MVP)

```
app/                          # UI + HTTP adapters (thin)
  (dashboard)/...             # Client pages + server layout
  api/...                     # Auth, validate, call services, respond
lib/ or services/             # Domain + AI orchestration (server-only)
  brand/                      # Brand domain persistence helpers
  brand-context/              # BrandContextAssembler
  strategy/                   # StrategyService (evolve lib/strategy.ts)
  ideas/                      # PillarIdeaService (new)
  drafts/                     # DraftService / RepurposeService
  usage/                      # UsageMeter
  ai/                         # Orchestration, task registry, providers, prompts
components/                   # UI
prisma/                       # Schema + migrations
```

Exact folder names may evolve; **boundaries and responsibilities must not**. Prefer evolving existing `lib/*` modules over inventing parallel stacks.

### Current reality (verified)

| Area | Current state |
|------|---------------|
| App shell | Next.js 14 App Router, Tailwind, Radix/shadcn-style `components/ui` |
| Auth | Clerk (`middleware.ts`, dashboard layout, API `auth()`) |
| Data | Prisma + PostgreSQL; **no committed `prisma/migrations`**; sync historically via `db push` |
| AI | `lib/claude.ts` `callAI` prefers Anthropic, falls back to OpenAI; hardcoded model IDs |
| Strategy | `lib/strategy.ts` heuristics + AI refine |
| Content | `lib/content-engine.ts`, `content-decision.ts`, `content-intelligence.ts`, `content-evaluation.ts` |
| Jobs | Inngest publish/analytics present but **not** V2 MVP center |
| Tests | None found |
| Package name | `varabhi` in `package.json` |

---

## 4. Approved technology stack and responsibilities

Inspect `package.json` before adding anything. **Do not add a dependency merely because this architecture mentions a capability.**

| Concern | Approved stack | Current status | Responsibility |
|---------|----------------|----------------|----------------|
| UI framework | Next.js 14 App Router + React 18 | **Current** | Pages, layouts, API routes |
| Styling | Tailwind + existing UI primitives | **Current** | Design system consistency |
| Auth | Clerk | **Current** | Identity; app user provisioning via `ensureUserForClerkId` |
| Persistence | PostgreSQL + Prisma | **Current** | Durable domain data |
| Validation | Zod | **Current** (request bodies); **Planned** for AI outputs | Inputs + structured model outputs |
| Server state (client) | TanStack Query | **Current** and actively used | Fetch, cache, mutate, invalidate remote data |
| Client-only shared state | Zustand | **Dependency present, unused** | Selective shared UI/workflow state only |
| AI providers | Anthropic, OpenRouter, OpenAI | Anthropic + OpenAI **Current** via `callAI`; OpenRouter **Planned** | Text generation behind adapters |
| Background jobs | Prefer sync request/response for MVP | Inngest **Current** for publish/analytics | Freeze expansion until Planner value is proven |
| Analytics (product) | Vercel Analytics present | **Current** package | App analytics ≠ social analytics product |

### Dependency policy

- Prefer the libraries already in the manifest.
- Zustand may be used when justified; do not remove it solely for unused-status without an explicit cleanup task.
- Do not install image-generation SDKs, vector DBs, agent frameworks, or Redis unless a concrete approved task requires them.
- OpenRouter may reuse the existing `openai` SDK pointed at OpenRouter’s base URL inside an **OpenRouter adapter** — still treat it as a separate provider. See [`AUTHORAI_AI_SYSTEM.md`](./AUTHORAI_AI_SYSTEM.md).

---

## 5. Next.js server / client boundaries

### Rules

1. **Secrets and AI calls stay on the server.** Never import provider SDKs, Prisma, or `CLERK_SECRET_KEY` into client components.
2. **API routes are adapters**, not business logic dumping grounds. Auth → validate → authorize → usage check → service → safe response.
3. **Server Components** are appropriate for auth gates, layouts, and static shells.
4. **Client Components** own interactive dashboards, forms, and editors that need Query/Zustand/local state.

### Current pattern (verified)

- Root `app/layout.tsx`: `ClerkProvider` + `QueryProvider`.
- `app/(dashboard)/dashboard/layout.tsx`: **server** — `auth()`, `ensureUserForClerkId()`, shell.
- Dashboard pages under `app/(dashboard)/dashboard/*`: almost all **`"use client"`** and load data via TanStack Query → `fetch("/api/...")`.
- Domain writes and AI run in `app/api/*` Route Handlers.

### Planned guidance

Keep the client → `/api` → service pattern for mutating/AI work. Do not move Prisma into Client Components. Prefer extracting fat route bodies into domain services as V2 features land. RSC data loading for read-only pages is optional later; do not rewrite the whole dashboard to RSC as a prerequisite for MVP.

---

## 6. TanStack Query vs Zustand

### Decision

| Layer | Owner |
|-------|-------|
| Remote / server state | **TanStack Query** |
| Shared client-only UI / workflow state | **Zustand** (selective) |
| Truly local UI state | **React `useState` / `useReducer`** |

### TanStack Query — required uses

- API data fetching (`products`, `drafts`, `settings`, etc.)
- Remote cache and `staleTime` / refetch policy
- Mutations and cache invalidation
- Loading and error states for server data

**Current:** `components/providers/query-provider.tsx` wraps the app (`staleTime: 60s`, `refetchOnWindowFocus: false`). Dashboard pages and several components use `useQuery` / `useMutation`.

### Zustand — allowed uses

- Shared client-only UI state that would be painful to prop-drill (e.g. multi-step Brand Studio wizard progress that is not yet persisted)
- Temporary complex editor state shared across sibling panels
- Ephemeral UI flags that are not server truth

### Zustand — forbidden uses

- Duplicating TanStack Query cached API entities
- Storing auth/session as a parallel source of truth
- Persisting durable brand/draft data only in Zustand
- Creating a global “god store” for the whole app

### Default preference

1. Local React state for single-component concerns  
2. TanStack Query for anything loaded from or saved to the API  
3. Zustand only when multiple distant client components must share non-server state

**Current gap:** `zustand` is in `package.json` but has **zero imports**. That is acceptable until a justified shared client workflow appears. Do not invent stores preemptively.

---

## 7. API request lifecycle

Every mutating or AI-backed route must follow this sequence:

```
1. Authenticate        Clerk auth() → 401 if missing
2. Resolve app user    ensureUserForClerkId(clerkId)
3. Authorize           Scope all reads/writes to user.id (and brand/product ownership)
4. Validate input      Zod parseBody / schema
5. Enforce usage       Rate limit + UsageMeter (Planned durable daily caps)
6. Execute service     Domain / AI orchestration — not provider SDKs in the route
7. Persist if needed   Prisma through domain helpers
8. Respond safely      User-safe JSON; log server details separately
```

### Current vs Planned

| Step | Current | Planned (MVP) |
|------|---------|---------------|
| Auth + user ensure | Common pattern on most APIs | Keep |
| Zod request validation | Many mutating routes via `lib/validation.ts` | Keep and extend |
| Rate limit | In-memory 20/min on generate/regenerate/repurpose/extract only | Keep short-window limit; add durable UsageMeter for AI tasks including strategy |
| Service layer | Logic often inline in routes + `lib/*` | Thin routes calling named services |
| Error helper | `apiError` / `logServerError` partially adopted | Standardize on safe client errors |
| Tier | Client can PATCH `tier` via settings | Lock; admin/script only |

### Example target shape (illustrative)

```ts
// Conceptual — not a claim that this file exists today
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await ensureUserForClerkId(userId)
  const body = parseBody(await req.json(), contentGenerateSchema) // Zod
  if (body instanceof NextResponse) return body

  const limited = await usageMeter.checkAndConsume(user.id, "content.generate")
  if (limited) return limited

  const result = await draftService.generate({ userId: user.id, ...body })
  return NextResponse.json(result)
}
```

---

## 8. Domain service boundaries

Services are **server-side modules**. Product features and API routes request capabilities from them. They must not import React.

| Service | Responsibility | Current anchor | Status |
|---------|----------------|-----------------|--------|
| **Brand domain** | CRUD for brand/product profile, approval state for summary/facts | `Product` model + `/api/products` | Evolve Product → Brand Studio fields (**Planned**) |
| **BrandContextAssembler** | Build task-specific approved context for AI | Ad hoc assembly in API routes | **Planned (MVP)** — mandatory before new AI tasks |
| **StrategyService** | Opinionated platform/tone/avoid recommendations | `lib/strategy.ts` `generateMarketingStrategy` | **Current** core; wrap/keep |
| **PillarIdeaService** | Content pillars + ideas without Activity requirement | Missing | **Planned (MVP)** |
| **DraftService** | Platform draft generate/regenerate from brand/idea context | `runContentEngine` + `generateContent` + generate/regenerate routes | **Current** Insight-gated; relax Insight requirement (**Planned**) |
| **RepurposeService** | Create lineage draft for new platform/audience | `/api/content/repurpose` | **Current**; formalize |
| **UsageMeter** | Durable per-user AI usage caps + categories | `lib/rate-limit.ts` in-memory only | **Planned (MVP)** |
| **AI orchestration** | Named tasks → router → provider → validate → QC | `callAI` + scattered prompts | **Planned (MVP)** — see AI system doc |
| **Provider adapters** | Anthropic / OpenRouter / OpenAI specifics | Anthropic+OpenAI inside `lib/claude.ts`; `lib/openai.ts` orphaned | **Planned** adapters |

### Boundary rules

1. One user action ≈ one API route ≈ one primary service call ≈ one primary model call (optional cheap review only when policy says so).
2. No overlapping generators for the same job.
3. Routes must not call `@anthropic-ai/sdk` or `openai` directly once adapters exist.
4. Publishing, analytics sync, and GitHub intake are **frozen as product center**; keep code if needed but do not expand for MVP.

---

## 9. Prisma / database ownership and migration rules

### Ownership

- Prisma schema is the contract for durable domain data.
- Only server code talks to the database (`lib/db.ts` Prisma client).
- All queries that return user data must filter by authenticated app `user.id` (and ownership of related rows).

### Current reality (verified)

- Schema: `prisma/schema.prisma` — `User`, `Product`, `MarketingStrategy`, `Integration`, `Activity`, `Insight`, `ContentDraft` (required `insightId`), `Schedule`, `Analytics`.
- Scripts: `db:generate`, `db:push`, `db:studio`, `db:verify`.
- **No migrations directory in the tree**; `.gitignore` currently ignores `/prisma/migrations`.
- Local `DATABASE_URL` was previously observed pointing at Supabase pooler with a rejected tenant — treat DB health as a **Phase 0 blocker**, not as green.

### Migration rules (Planned / mandatory once DB is healthy)

1. Prefer **Prisma Migrate** over undocumented `db push` for shared/dev/prod workflows.
2. **Do not** run `migrate reset`, destructive resets, or blind `db push` against databases that may contain user data.
3. Before the first baseline: verify connectivity (`npm run db:verify`), inventory tables/row counts read-only, then baseline without applying destructive DDL.
4. Stop ignoring migrations in git once migrate is adopted (requires an explicit `.gitignore` change in a dedicated task).
5. Schema changes for V2 (optional `insightId`, brand approval fields, pillars/ideas, usage counters) land only after connectivity and baseline policy are settled.

### Data rules

- Never invent a working connection string in docs or code.
- Never print credentials.
- AI-proposed brand facts remain unapproved until the user explicitly approves them (product + AI system rule; persist approval state in Brand domain).

---

## 10. Performance and reliability expectations

| Expectation | Guidance |
|-------------|----------|
| Latency | Prefer one primary model call per user action; avoid mandatory evaluation LLM on every generate |
| Timeouts | Every provider call has an explicit timeout from task config |
| Retries | Bounded, logged, task-specific; no endless loops; no silent provider hopping |
| Failures | Return actionable user-safe errors; persist partial success only when intentional (e.g. draft saved, evaluation skipped) |
| Cold starts | Lazy-init AI clients preferred over import-time throws (**Planned** fix; **Current** `lib/claude.ts` throws if no AI key at import) |
| Caching | TanStack Query for client; do not cache personalized drafts across users on the server |
| Background work | MVP features should complete in the request when feasible |

---

## 11. Security baseline

1. **Authentication:** Clerk middleware + route `auth()`.
2. **Authorization:** Every Prisma query for user content scoped to that user.
3. **Validation:** Zod on mutating inputs; Zod on structured AI outputs (Planned).
4. **Secrets:** Env only; never log API keys, tokens, or connection strings; do not put access tokens in Inngest/event payloads.
5. **Encryption:** `ENCRYPTION_KEY` required before storing third-party tokens in production; postpone OAuth publish if unset.
6. **Prompt injection:** User briefs, pasted site text, docs, and prior model output are untrusted data inside prompts (details in AI system doc).
7. **Privilege:** Model output must never change tiers, bypass authz, or auto-publish.
8. **Cost abuse:** Remove client-writable premium tier; enforce server-side UsageMeter.
9. **Public routes:** Keep health/cron carefully constrained; empty webhook matchers must not become open sinks.

---

## 12. Logging and observability

### Current

- Mix of `console.error`, partial `logServerError` / `apiError`.
- Health: `GET /api/health/db` returns `{ ok: true|false }` without leaking internals.
- No structured AI usage ledger.

### Planned minimum

Log (structured, no secrets):

- Request route + outcome
- AI task id, provider, model, latency, token usage when available, success/failure, estimated cost category
- UsageMeter reject events

Do **not** log raw prompts/responses by default. Opt-in debug only in non-production with redaction.

---

## 13. Testing strategy

| Layer | Expectation |
|-------|-------------|
| Unit | Zod schemas; deterministic decision helpers (`content-decision`, strategy heuristics); UsageMeter math |
| Service | BrandContextAssembler field selection; DraftService with **mocked** provider adapters |
| API | Authz denial, validation 400s, happy-path with mocked AI |
| Evaluation sets | Offline fixtures for sellers / SaaS / creators — see AI system doc |
| Live model calls | Opt-in only (`LIVE_AI=1` or equivalent); never required for CI green |

**Current:** no automated test suite. Adding tests is encouraged alongside V2 services; do not block every change on a perfect harness, but do not ship UsageMeter or AI validation without tests for the critical paths.

---

## 14. Dependency and change policy

1. Read product direction + this doc + AI system doc before implementing.
2. Inspect live code; do not trust stale README claims (e.g. DALL·E).
3. Prefer deleting or freezing dead surface area over wrapping it.
4. One PR / task should have one architectural job when possible.
5. Do not expand MVP into publishing, analytics suites, agents, or image generation.
6. Configuration (models, providers, limits) lives in central registries — not copy-pasted into routes.
7. Documentation updates accompany architecture-shifting code changes.

---

## 15. Explicit non-goals

- Microservices or “platform rewrite”
- Multi-agent orchestration frameworks
- Vector DB / RAG platform for MVP
- Kafka or speculative async topologies
- Competing state libraries (Redux, etc.) alongside Query/Zustand
- Making Schedule/Inngest publish the product center
- Implementing VisualService / image generation now
- Claiming billing/Stripe exists without implementation
- Greenfield rewrite of the Next.js app

---

## 16. Rules every AI coding agent must follow

1. **Read first:** product direction, this architecture doc, AI system doc, then inspect code for the files you will touch.
2. **Do not invent features** or document Planned work as Current.
3. **Do not add dependencies** unless the task explicitly requires them and the manifest has been checked.
4. **Do not call provider SDKs from React client code** or scatter new model IDs in routes.
5. **Do not duplicate server state into Zustand.**
6. **Do not run destructive database commands** (`migrate reset`, drop, blind push) without explicit human approval and verified backups/connectivity.
7. **Do not implement image generation, agents, or microservices** under V2 MVP.
8. **Preserve user isolation** on every query.
9. **Validate with Zod** for inputs; plan Zod for AI outputs when touching generation paths.
10. **Prefer evolving** `lib/strategy.ts`, content engine, Clerk, Prisma, and draft APIs over replacing them.
11. **Stop and ask** when DATABASE_URL, keys, or backups are missing — never invent credentials.
12. **Keep routes thin** as services are introduced; put orchestration in the AI layer described in [`AUTHORAI_AI_SYSTEM.md`](./AUTHORAI_AI_SYSTEM.md).

---

## Appendix A — Current stack snapshot (package.json)

Verified at documentation time:

- `next@14.2.35`, `react@18`, `@clerk/nextjs`, `@prisma/client` / `prisma`, `zod`, `@tanstack/react-query`, `zustand`, `@anthropic-ai/sdk`, `openai`, `inngest`, `tsx` for scripts.
- Optional AI providers via env: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `OPENROUTER_API_KEY` (OpenAI-compatible OpenRouter adapter in `lib/ai/providers/openrouter.ts`).

## Appendix B — Alignment with product direction

Product direction §14 modular architecture names BrandContextAssembler, StrategyService, PillarIdeaService, DraftService, RepurposeService, UsageMeter, and Later VisualService. This document adopts those boundaries as engineering law and maps them onto the existing modular monolith rather than a new runtime.
