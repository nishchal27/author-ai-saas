# AUTHORAI V2 — Product and Codebase Audit

**Date:** 2026-11-16  
**Scope:** Evidence-based audit of the local `author-ai-saas` repository. No application code was modified except creation of this report.  
**Method:** Inspected Prisma schema, API routes, `lib/*` AI/strategy modules, dashboard/onboarding UI, middleware, env *key names* only, and launch checks (`tsc`, `npm run build`, `npm run lint`, `npm run db:verify`). Documentation was treated as claims to verify, not truth.

> **Post-audit note:** After this audit, product branding was renamed from AuthorAI / Founder OS to **Varabhi**. Findings below are preserved as historical evidence of the codebase at audit time and were not rewritten.

---

## Should we use this codebase or start again?

**Partially rebuild on this codebase (Option B). Do not start from scratch. Do not ship the current product as-is.**

Keep the Next.js + Clerk + Prisma shell and the strongest AI modules (`lib/strategy.ts`, `lib/claude.ts`, content decision/engine). Rebuild the domain and UX around Brand Profile → ideas → platform drafts, and deliberately stop investing in activity-tracking, auto-publishing, and analytics as the center of the product.

---

## 1. Executive verdict

AuthorAI today is a **substantial but unshipped founder marketing OS**, not a practical marketing workspace. Package name is still `founder-os` (`package.json`). The codebase has a real core:

- Product onboarding → heuristic + AI marketing strategy
- Strategy-aware content generation, regenerate, repurpose
- Draft save/edit and a guided “next action” home

That core is **valuable and reusable**. Around it sits a heavier pipeline (Activity → Insight → Content → Schedule → Publish → Analytics) that makes the product feel like a build-in-public CMS for technical founders. That pipeline is partially implemented, operationally fragile, and poorly aligned with the proposed V2 (“what should I post?” + “turn this into brand-consistent platform content”).

Internal docs overstate readiness. `ANALYSIS.md` claims ~85% complete and still mentions DALL·E visuals; `LAUNCH_CHECKLIST.md` marks publishing/onboarding complete and ends with “You’re ready for beta.” Reality: **no tests, no Prisma migrations, broken DB connectivity in this environment, no ESLint config, no billing, no anonymous tools, self-assignable premium tier, and unverified social publishing.**

**Product honesty:** The original “product-aware strategy” idea is a real differentiator *if* reduced to one job: teach AuthorAI your business once, then get weekly platform-specific content that does not invent product facts. The current activity/GitHub/publish stack dilutes that job.

---

## 2. What AuthorAI currently is (from code)

| Layer | Reality |
|--------|---------|
| Product | Authenticated dashboard SaaS: create a Product profile, generate MarketingStrategy, optionally log Activities, extract Insights, generate ContentDrafts, schedule/publish, view analytics UI |
| Branding | UI says “AuthorAI”; npm package is `founder-os`; Inngest id is `founder-os` |
| Auth | Clerk (`middleware.ts`, sign-in/up pages, `ensureUserForClerkId` in `lib/users.ts`) |
| Data | PostgreSQL via Prisma (`prisma/schema.prisma`); **no `prisma/migrations` folder** — schema sync is `db push` |
| AI | Anthropic preferred, OpenAI fallback (`lib/claude.ts`); strategy heuristics + AI refinement (`lib/strategy.ts`); content decision + generation + light evaluation |
| Jobs | Inngest cron for publish/analytics/retry (`lib/inngest.ts`, `app/api/inngest/[...inngest]/route.ts`) |
| Public surface | Marketing landing only (`app/page.tsx`). No public/anonymous tools |
| Tests | **None** found |
| Docs vs code | README still describes visual/DALL·E layer; `app/api/visuals` and `app/api/webhooks` directories are empty; pricing on landing is marketing copy without Stripe |

**Forced workflow shape:** `ContentDraft.insightId` is required (`prisma/schema.prisma` ~184–225). Generation API requires `insightId` (`lib/validation.ts` `contentGenerateSchema`). Even “from scratch” content create first POSTs an Insight (`app/(dashboard)/dashboard/content/create/page.tsx`). Activities are optional for that path, but the domain still centers on Insight, not Brand Profile.

---

## 3. Existing architecture map

### Stack

- **Next.js** `14.2.35` App Router (`package.json`)
- **React** 18, Tailwind, Radix/shadcn-style UI under `components/ui`
- **Clerk** auth
- **Prisma** 5 + PostgreSQL
- **AI:** `@anthropic-ai/sdk`, `openai`
- **Background:** `inngest`
- **Validation:** `zod` (`lib/validation.ts`)
- **Client data:** `@tanstack/react-query` (Zustand is a dependency; not a central app store in audited flows)

### Folder map (high level)

```
app/
  page.tsx                          # Landing (redirects signed-in users to /dashboard)
  (auth)/sign-in|sign-up            # Clerk
  (dashboard)/dashboard/*           # Home, strategy, content, activities, insights, calendar, analytics, settings
  api/*                             # REST handlers (products, insights, content, schedules, publish, integrations, …)
components/                         # Landing, onboarding, strategy, dashboard, empty states, UI
lib/                                # AI, strategy, crypto, rate-limit, users, github/linkedin/twitter
prisma/schema.prisma                # Domain models
scripts/                            # populate, db verify, set-premium-tier
```

### User request path (happy path to content)

```
Browser
  → Clerk middleware (middleware.ts): public /, auth, health, cron, webhooks; else require userId
  → Dashboard layout: auth() + ensureUserForClerkId()
  → Product onboarding UI → POST /api/products
       → prisma.product.create
       → generateMarketingStrategy() [heuristics + callAI]
       → prisma.marketingStrategy.create
  → Optional: Activity → POST /api/insights/extract → extractInsight() → Insight
  → Or: Content create “from scratch” → POST /api/insights → Insight
  → POST /api/content/generate
       → checkRateLimit (in-memory)
       → load Insight + Product + Strategy + User.brandVoice
       → runContentEngine() → decideContentOptions() → generateContent()
       → ContentDraft.create
       → evaluateContent() (best-effort second model call)
  → Draft review UI → PATCH /api/content/drafts/[id]
  → Optional: Schedule → Inngest/cron → LinkedIn/Twitter publish → Analytics
```

### Env key names present in local `.env` (values not inspected/printed)

`N8N_WEBHOOK_SECRET`, `DATABASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `NEXT_PUBLIC_APP_URL`, `CRON_SECRET`, `INNGEST_SIGNING_KEY`, `POPULATE_CLERK_ID`

**Missing in local `.env` but referenced in code:** `ENCRYPTION_KEY` (`lib/crypto.ts`) — without it, integration tokens are stored/returned as plaintext.

---

## 4. Feature reality matrix

Statuses used: **Implemented and verified** | **Implemented but unverified** | **Partially implemented** | **Mock/demo only** | **Documented but not implemented** | **Missing**

| Feature | Evidence / files | Status | Current limitations | Reusability for V2 |
|--------|-------------------|--------|---------------------|--------------------|
| 1. Registration & auth | Clerk pages; `middleware.ts`; `lib/users.ts` `ensureUserForClerkId` | Implemented but unverified (needs live Clerk + DB) | User row created on first API/layout hit; fails hard if Clerk has no email | **High** — keep |
| 2. Onboarding | `components/onboarding/product-onboarding.tsx` (5 steps); auto-open on empty products in dashboard | Partially implemented | Classification-heavy (type, audience, stage, sales motion); website optional, not ingested; localStorage `onboarding_completed` only | **Medium** — simplify into Brand Profile wizard |
| 3. Product creation & management | `app/api/products/route.ts`, `[id]/route.ts`; ProductSwitcher | Implemented but unverified | Multi-product supported; no BrandKnowledge / verified facts store | **High as Product→BrandProfile seed** |
| 4. Marketing strategy generation | `lib/strategy.ts` `generateMarketingStrategy`; POST create product + `/api/products/[id]/strategy` | Implemented but unverified (AI + DB) | Heuristic patterns + AI JSON; AI failure falls back to heuristics; model IDs questionable (see §5) | **High** — strongest differentiator code |
| 5. Product/audience understanding | Product fields + strategy refineForAudience; content-intelligence segment inference | Partially implemented | Audience is enum/custom text, not a reviewed knowledge profile; no website scrape/summary correction loop | **Medium** — evolve into Brand Profile fields |
| 6. Brand voice | `User.brandVoice` JSON; Settings UI; passed into generate/extract | Partially implemented | Single free-text tone string; settings PATCH also references non-schema `brandColors`/`visualStyle` | **Medium** — keep field, strengthen persistence |
| 7. Activity tracking | Activities pages + API; GitHub sync `app/api/github/sync` | Partially implemented | Manual + GitHub PAT; not in primary nav; optional for content-from-scratch | **Low for MVP** — postpone as intake source |
| 8. Insight extraction | `extractInsight` in `lib/claude.ts`; `/api/insights/extract` | Implemented but unverified | Tied to Activity; Insight also used as generic “angle” for all drafts | **Medium** — keep as optional “angle” object, not required spine |
| 9. Content generation | `runContentEngine`, `/api/content/generate`, create page | Implemented but unverified | Requires insightId; many intent/persona knobs for non-marketers | **High** — core of V2 |
| 10. Content regeneration | `/api/content/regenerate`; content page feedback UI | Implemented but unverified | Reuses insight/product/strategy; optional feedback | **High** |
| 11. Content repurposing | `/api/content/repurpose`; UI on content page | Implemented but unverified | Creates new draft with `sourceDraftId` | **High** |
| 12. Draft saving & editing | ContentDraft model; drafts list/PATCH/DELETE | Implemented but unverified | Edit content/status; version++ | **High** |
| 13. Content calendar & scheduling | Calendar page; Schedule model; schedules API | Partially implemented | UI exists; depends on publish stack | **Low for MVP** — simple weekly plan ≠ Schedule/publish |
| 14. Social integrations | GitHub/LinkedIn/Twitter API routes; Settings token forms | Partially implemented | Manual tokens, not OAuth; encryption only if `ENCRYPTION_KEY` set | **Postpone** |
| 15. Automated publishing | `lib/inngest.ts` crons; `/api/publish`; `/api/cron/publish` | Partially implemented / unverified | Code paths exist; Twitter/LinkedIn APIs often need proper OAuth; Inngest event embeds tokens | **Do not build for MVP** |
| 16. Analytics | Analytics model; `/api/analytics`; dashboard page; Inngest sync | Partially implemented / unverified | Depends on successful publish + platform APIs | **Postpone** |
| 17. Usage limits & billing | `User.tier`; Settings allows PATCH `tier`; landing Pricing $29/$79 | Mock/demo only for billing; tier is self-serve | No Stripe; users can set premium themselves (`app/api/settings/route.ts`); landing limits not enforced | **Missing** — must add soft limits before public beta |
| 18. Public/anonymous access | Middleware public routes: `/`, auth, health, cron, webhooks | Missing for tools | Landing only; no Quick Tools | **New work for V2 A** |

### Additional reality checks

| Claim in docs | Code reality |
|---------------|--------------|
| Visual / DALL·E layer | `lib/openai.ts` states image generation removed; empty `app/api/visuals` |
| n8n webhooks | Empty `app/api/webhooks`; env key exists; middleware allows `/api/webhooks(.*)` |
| Job status strip | `/api/jobs/status` returns `jobs: []` with TODO |
| vercel.json cron | **No `vercel.json`** found; cron docs assume it |
| ANALYSIS.md “85% ready” | Overstated; treat as outdated |

---

## 5. AI engine assessment

### Where prompts live

| Function | File | Role |
|----------|------|------|
| `generateMarketingStrategy` | `lib/strategy.ts` | System + user prompts; JSON strategy |
| `extractInsight` | `lib/claude.ts` | Activity → insight JSON |
| `generateContent` | `lib/claude.ts` | Insight + product/strategy/voice → draft JSON |
| `evaluateContent` | `lib/content-evaluation.ts` | Post-hoc score/note |
| Decision (non-LLM) | `lib/content-decision.ts`, `lib/content-intelligence.ts` | Format/platform/persona heuristics |

### Providers & model selection

- Prefer Anthropic if `ANTHROPIC_API_KEY` set; else OpenAI (`lib/claude.ts` lines 4–30, 88–124).
- Tier mapping uses IDs such as `claude-3-5-opus-20241022`, `claude-3-5-sonnet-20241022`, evaluation uses `claude-3-5-haiku-20241022`.
- **Risk:** These model IDs look historically/incorrectly named relative to Anthropic’s public catalog; if invalid, generation fails at runtime. OpenAI path uses `gpt-4o` for both tiers (tier not a real cost control).
- `lib/claude.ts` and `lib/openai.ts` throw at **module import** if keys missing — brittle for tooling/tests.

### Context actually passed?

**Yes, when Product + Strategy exist:** generate/regenerate/repurpose load product fields and parse strategy JSON into tone/platforms/proofTypes/antiPatterns (`app/api/content/generate/route.ts` ~60–90). Brand voice from `User.brandVoice` JSON `.tone`. Founder bio and tech stack optionally included.

**Gaps:**

- No first-class verified facts / “do not invent” knowledge base; prompts encourage honesty but do not ground against a fact sheet.
- No dedicated brand-consistency evaluator (evaluation is platform/goal fit only).
- Hallucinations: handled only by prompt wording, not by structured allow-list of claims.
- Retries/timeouts: Inngest has retries for publish; AI routes generally single-shot try/catch.
- Token/cost tracking: **Missing**. Rate limit is request-count only (`lib/rate-limit.ts`: 20/min/user in-memory).

### Can this support V2 concepts?

| Concept | Fit today |
|---------|-----------|
| Brand Profile | Partial via Product + User fields |
| Audience profile | Partial string fields; separate entity not required yet |
| Product context | Yes |
| Brand voice | Weak but present |
| Content pillars | **Missing** |
| Platform-specific content | Yes (decision + prompts) |
| Content idea generation | Partial via Insights; no pillar/idea planner |
| Weekly content plan | Cadence in strategy JSON only; no plan entity |
| Repurposing | Yes |

### Recommended simple modular AI architecture (no agent swarm)

```
BrandContextService     # assemble BrandProfile + voice + approved facts + pillars
StrategyService         # keep heuristic+AI strategy (optional, lighter for SMB)
IdeaService             # generate ContentIdeas from pillars + profile (1 model call)
DraftService            # platform draft from idea + brand context (reuse generateContent patterns)
RepurposeService        # existing repurpose flow
ConsistencyCheck        # optional cheap second pass: “unsupported claims?” against facts JSON
UsageMeter              # tokens/requests per user
```

Orchestrate with plain async functions + one API route per user action. Prefer **one primary model call + optional cheap check** over multi-agent frameworks.

---

## 6. Database / domain assessment

### Current models (`prisma/schema.prisma`)

`User`, `Product`, `MarketingStrategy`, `Integration`, `Activity`, `Insight`, `ContentDraft` (requires `insightId`), `Schedule`, `Analytics`.

No migrations directory; production sync historically via `prisma db push` (README/LAUNCH_CHECKLIST).

### V2 domain recommendation (pragmatic)

| Concept | Separate table? | Recommendation |
|---------|-----------------|----------------|
| BrandProfile | Yes (evolve Product) | Rename/evolve `Product` → BrandProfile or add `BrandProfile` 1:1 with User for MVP single-brand; keep Product as alias initially to reduce migration pain |
| BrandKnowledgeSource | Later (P2) | Start with JSON `sources` / `approvedSummary` on BrandProfile; table when website/PDF ingest ships |
| AudienceProfile | **No initially** | Fields on BrandProfile (`audience`, `audienceDetail`, pains, language) |
| BrandVoice | **No initially** | Fields/JSON on BrandProfile (move off User eventually) |
| ContentPillar | Yes, thin | `id`, `brandId`, `title`, `description`, `priority` |
| ContentIdea | Yes | Replaces many uses of Insight; status idea/accepted/rejected |
| ContentDraft | Keep | Make `insightId`/`ideaId` **optional**; link to brandId; keep repurpose lineage |
| ContentPlan / Calendar | JSON or thin PlanWeek | MVP: `WeeklyPlan` with JSON array of idea/draft refs — not Schedule+publish |

### Mapping old → new

| Existing | V2 mapping |
|----------|------------|
| Product | BrandProfile (core) |
| MarketingStrategy | Keep as optional StrategySnapshot or fold summary into BrandProfile |
| Activity | Optional intake / P2 |
| Insight | Migrate useful rows → ContentIdea or keep as Angle attached to Idea |
| ContentDraft | ContentDraft (relax FK) |
| Schedule / Analytics / Integration | Postpone; freeze investment |

### Migration risks

- Local `DATABASE_URL` currently **fails** (`npm run db:verify`: tenant/user not found). Assume little/no production user data until proven otherwise.
- Making `ContentDraft.insightId` optional is a breaking schema change; doable with Prisma migrate once DB is healthy.
- JSON-string columns everywhere increase parse-error risk; gradually move hot paths to typed JSON columns or Prisma Json type.
- If any real users exist, preserve Product + Strategy + Drafts; Activities/Schedules can remain unread.

---

## 7. Security, reliability, and cost

### Findings (practical severity)

| Area | Finding |
|------|---------|
| Authz | Most APIs use `auth()` + `userId: user.id` on queries — good isolation pattern |
| Public endpoints | Cron protected by `CRON_SECRET` bearer; health public; webhooks public matcher but route empty |
| Validation | Zod on many mutating routes (`lib/validation.ts`) — keep and extend |
| Rate limit | **In-memory `Map`** (`lib/rate-limit.ts`). Comment admits per-instance only. **Not safe as sole protection on multi-instance serverless** — each instance has its own counter; abuse can multiply by instance count |
| Tier/billing | Clients can PATCH `tier: "premium"` — free upgrade to expensive models |
| Settings schema drift | PATCH accepts `brandColors` / `visualStyle` not on User model → likely Prisma errors if used |
| Token storage | `encryptToken` no-ops without `ENCRYPTION_KEY` (absent locally) |
| Inngest | `content/published` event data includes `accessToken` (`lib/inngest.ts` ~141–148) — avoid putting secrets in event payloads |
| Prompt injection | User/product/activity text interpolated into prompts; no sanitization or “untrusted content” framing for uploaded/GitHub text |
| Cost | No token metering; evaluation adds extra AI call; blogs force “premium” model path |
| Logging | `apiError` / `logServerError` avoid leaking DB details to client — good |
| DB | Connection currently broken in this environment — app cannot serve authenticated data |

### Safeguards for a solo-founder product (enough, not enterprise)

1. Remove client-writable `tier`; set premium only via admin script.
2. Cap AI calls per user/day in DB (not only memory).
3. Upstash Redis or similar for rate limits if deploying multiple instances; until then, single-region + DB counters.
4. Set `ENCRYPTION_KEY` before storing any social tokens; prefer delaying OAuth publish entirely.
5. Strip secrets from Inngest events; look up tokens by scheduleId server-side.
6. Add “approved facts” block to prompts; instruct model to refuse unknown claims.
7. Keep human review mandatory before any future publish.

---

## 8. UX and onboarding assessment

### Time to first useful result

Optimistic path:

1. Sign up (Clerk)
2. 5-step product onboarding (name, type, audience, stage/sales motion, description)
3. Strategy generated on product create
4. Still need Insight (from activity extract **or** scratch form) before a draft

**Realistic first useful artifact:** strategy summary after onboarding (~5–10 minutes if AI works). **First post draft:** additional steps and jargon (intent, persona, audience segment).

### Friction vs target user (non-technical small business)

- Vocabulary is founder/engineer-centric: sales motion, build in public, engineering credibility, persona codes (`lib/content-intelligence.ts`).
- Primary nav: Home, Strategy, Content, Settings; Activities/Insights pages exist but are secondary — yet domain still depends on Insight.
- Guide API (`/api/guide/next`) is good product thinking, but defaults to “share a story” / activity when idle — reinforces build-in-public loop.
- Dashboard shows Background jobs strip that always empty — noise without value.
- Landing pricing promises limits/platforms/API that code does not enforce.

### Does workflow force activities?

**No longer strictly** — content create can invent an Insight from scratch. Schema and mental model still say “angle/insight first,” which is confusing. Strategy-first then “what should I post this week?” would fit V2 better.

### Smallest UX changes for clarity

1. Rename onboarding to “Your business” / Brand Profile; cut sales-motion step for MVP.
2. After strategy: immediately show 3 content pillars + 5 ideas (new), one-click “Write LinkedIn post.”
3. Hide Activities, Calendar, Analytics, Integrations behind “Advanced” or remove from nav.
4. Collapse intent/persona into smart defaults; advanced accordion only.
5. Copy: “Review before you post — AuthorAI won’t invent product facts.”

---

## 9. Competitive differentiation assessment

*Hypotheses, not market facts.*

| Competitor | What they own | AuthorAI vs them |
|------------|---------------|------------------|
| ChatGPT / general AI | Fast draft generation with user-pasted context | Undifferentiated if AuthorAI is “chat that writes posts.” Differentiated if persistent verified Brand Profile + strategy constraints beat paste-every-time |
| Buffer / SocialBee | Scheduling, queues, publishing | AuthorAI should **not** compete here initially; code’s publish path is a distraction |
| Jasper | Scaled copy generation, templates, brand voice at marketing-team level | AuthorAI can win on **opinionated what-to-create for tiny teams**, not on volume features |
| Canva | Visual design + Magic Studio | Different job; don’t build design suite |

**Undifferentiated today:** generic multi-format generation, calendar, analytics screens, pricing tiers on a landing page.

**Potentially valuable original concept:** product-type heuristics that say what *not* to do (`lib/strategy.ts` STRATEGY_PATTERNS + antiPatterns), then bind generation to that.

**Narrowest defensible initial use case:**  
Solo SaaS / small product founder who already knows they should post on LinkedIn/X, hates blank page, and will maintain a short Brand Profile for better drafts than ChatGPT with amnesia.

**First customer:** One founder already posting inconsistently who will correct an AI business summary and generate 3 posts/week.

**Weekly return hook:** “Your week: 5 ideas aligned to pillars — generate, edit, copy.” Not analytics.

**Why choose AuthorAI over ChatGPT (hypothesis):** persistent product facts + strategy “avoid” list + repurpose across platforms without re-explaining the business every session.

---

## 10. Reuse vs rebuild recommendation

### Scores (1–5, higher = better for shipping V2)

| Criterion | A. Reuse + refactor | B. Partial rebuild | C. Greenfield |
|-----------|---------------------|--------------------|---------------|
| Development time | 4 | **5** | 2 |
| Technical risk | 3 | **4** | 3 |
| Existing reusable value | 4 | **5** | 1 |
| Maintenance burden | 2 (keep dead surface) | **4** | 3 |
| Launch speed | 3 | **5** | 2 |
| Data migration risk | 3 | **4** (little real data) | 5 |

### Verdict: **B — Partially rebuild selected modules**

#### Retain

- Next.js App Router app shell, Tailwind/UI primitives
- Clerk auth + `ensureUserForClerkId`
- Prisma + Product / MarketingStrategy / ContentDraft concepts
- `lib/strategy.ts`, `lib/claude.ts` (callAI/generateContent), `content-decision`, `content-intelligence`, `content-engine`, `content-evaluation` (simplify)
- Zod validation patterns, `api-error`, draft review UI pieces
- Product onboarding as starting point for Brand Profile

#### Refactor

- Domain: BrandProfile-centric; optional Idea; optional Insight FK
- Settings: remove self-serve tier; fix schema drift
- AI model IDs and cost controls
- Rate limiting → durable counters
- UX: simplify create flow; hide advanced

#### Deprecate / freeze

- Inngest publish/analytics as product pillars
- GitHub-as-required-input narrative
- Landing pricing claims until billing exists
- Empty visuals/webhooks/job-status theater
- Multi-product complexity in MVP messaging

#### Postpone

- OAuth social publish, analytics, team features, autonomous agents, website crawler v1 beyond simple paste/URL summary

**Do not start from scratch:** you would re-implement months of auth, strategy heuristics, and generation plumbing for little gain.

**Do not only “polish and ship”:** the product story and schema still optimize for the wrong spine.

---

## 11. Proposed V2 architecture

```
[Quick Tools - optional later]
  Anonymous limited generate (separate rate limit + no persistence)

[Workspace - MVP]
  Clerk user
    → BrandProfile (from Product)
         → approvedSummary + facts (JSON)
         → brandVoice
         → optional StrategySnapshot
         → ContentPillars[]
         → ContentIdeas[]
         → ContentDrafts[] (platform, status, sourceDraftId)
         → WeeklyPlan (JSON)

Services (server modules, not agents)
  BrandContextAssembler
  StrategyService (existing)
  PillarIdeaService (new)
  DraftService (wrap generateContent)
  RepurposeService (existing)
  UsageMeter (new)
```

Deploy: Vercel + Postgres + Clerk + one AI provider. Skip Inngest until something must run async.

---

## 12. MVP feature scope and priorities

### P0 — required for launch

#### P0.1 Simple Brand Profile onboarding

- **User problem:** Too much classification before value.
- **Flow:** Name, one-liner, audience, website-or-paste, voice sentence → save.
- **Backend:** Evolve Product create; optional strategy gen.
- **Reuse:** `product-onboarding.tsx`, `/api/products`.
- **New:** Fewer fields; `approvedSummary` field.
- **Deps:** Working DATABASE_URL, Clerk, AI key.
- **AC:** New user creates profile in ≤3 minutes; record persisted.

#### P0.2 AI business summary user can correct

- **Problem:** AI invents product facts.
- **Flow:** Generate summary from inputs → user edits → “Approved” flag.
- **Backend:** One model call; store approved text used in all prompts.
- **Reuse:** `callAI`.
- **New:** Approval state + prompt grounding.
- **AC:** Later drafts only use approved summary; UI shows grounding.

#### P0.3 Strategy lite (keep opinionated value)

- **Problem:** Don’t know where/what to post.
- **Flow:** Show recommended platforms + avoid list + tone after profile.
- **Reuse:** `generateMarketingStrategy`, strategy display.
- **AC:** User sees clear do/don’t with reasoning.

#### P0.4 Content pillars + ideas

- **Problem:** Don’t know what to create.
- **Flow:** Generate 3–5 pillars and 5 ideas; user accepts/edits.
- **Backend:** New tables or JSON; IdeaService.
- **Reuse:** Prompt patterns from insight extraction.
- **AC:** User can get ideas without logging an Activity.

#### P0.5 Platform-specific draft + voice + save

- **Problem:** Turning idea into LinkedIn/X/blog draft.
- **Flow:** Idea → choose platform → generate → edit → copy/export.
- **Reuse:** `runContentEngine` / `generateContent`, drafts API/UI.
- **New:** Generate from Idea/Brand without required Insight.
- **AC:** Draft saved; regenerate with feedback works.

#### P0.6 Soft usage limits

- **Problem:** Cost blowups / abuse.
- **Backend:** Daily generation cap by user; remove client tier switch.
- **AC:** Over-limit returns 429 with clear message.

### P1 — valuable immediately after launch

- Repurpose (mostly exists)
- Weekly plan view (static checklist from ideas/drafts)
- Brand voice stronger examples
- Quick Tools anonymous (very limited)

### P2 — later

- Website fetch → draft summary
- BrandKnowledgeSource table
- Activity/GitHub as optional idea intake
- Better evaluation (“unsupported claims” check)

### P3 — do not build yet

- Automated social publishing
- Analytics suite
- Enterprise collaboration
- Multi-agent orchestration
- Billing complexity beyond simple Stripe checkout (when needed)
- Visual generation

### Feature spec sketch (P0.5)

| Item | Detail |
|------|--------|
| User problem | Blank page; inconsistent voice |
| Flow | Select idea → platform → Generate → edit → Save |
| Backend | POST generate accepts `ideaId` or `brandId`+prompt; assemble BrandContext |
| Reuse | `lib/content-engine.ts`, generate route, content pages |
| New | Schema relaxation; BrandContext assembler |
| Deps | P0.1–P0.4 |
| AC | Draft references brand; no Insight required |

---

## 13. Technical implementation roadmap

1. **Stabilize runtime:** Fix DATABASE_URL; add Prisma migrate baseline; confirm Clerk; verify Anthropic model IDs against current API.
2. **Security hygiene:** Lock tier; durable rate/usage limits; don’t ship publish tokens without ENCRYPTION_KEY.
3. **Domain migration:** BrandProfile fields + ContentPillar + ContentIdea; optional draft↔insight.
4. **UX slim:** New onboarding + home = Profile / Strategy / Ideas / Drafts only.
5. **AI grounding:** Approved summary in every generate prompt; remove dead visual/billing claims from landing.
6. **Beta:** 5–10 users, measure drafts/week and return rate; defer publish.

---

## 14. Risks and unknowns

- Whether Anthropic model IDs in code work against current API (unverified; high risk).
- Whether any production users/data exist (DB unreachable here).
- LinkedIn/Twitter publish correctness with bearer/manual tokens (historically fragile; treat as unverified).
- `lib/claude.ts` import-time throws complicate builds/tests without keys (keys present locally; still a design smell).
- Product market risk: strategy-alone may not retain users without weekly ideas loop.
- Solo-dev scope risk: keeping Activities+Publish+Analytics in scope will prevent launch.

---

## 15. Launch blockers (public beta)

| Blocker | Evidence |
|---------|----------|
| Database unreachable | `npm run db:verify` failed: tenant/user not found |
| No automated tests | No `*.test.*` / `__tests__` |
| ESLint not configured | `npm run lint` prompts interactive Next ESLint setup; no `.eslintrc*` |
| Billing/limits missing | Self-serve premium; landing fake limits |
| Docs/marketing overclaim | Pricing, visuals, “ready for beta” |
| AI model ID uncertainty | Opus/Haiku ID strings in code |
| ENCRYPTION_KEY absent | Tokens plaintext if integrations used |
| No vercel.json | Cron deployment story incomplete |
| Publish/Inngest complexity | Not needed for MVP but can fail ops if left “on” |

### Checks run (Phase 10)

| Command | Result | Notes |
|---------|--------|-------|
| `npx tsc --noEmit` | **Exit 0** | Typecheck passed |
| `npm run lint` | **Exit 1** | Interactive ESLint setup prompt; no config file |
| `npm run build` | **Exit 0** | Build succeeded; during static gen, API routes logged Dynamic server usage; health/db logged DB FATAL tenant not found |
| `npm run db:verify` | **Exit 1** | Database connection failed |
| Automated tests | **N/A** | None exist |

---

## 16. First five implementation tasks (exact order)

1. **Restore a working Postgres `DATABASE_URL` and create a Prisma migration baseline** from current `schema.prisma` (stop relying on undocumented `db push` alone).
2. **Verify/fix AI model IDs** in `lib/claude.ts`, `lib/strategy.ts`, `lib/content-evaluation.ts` against the live provider; add a single smoke script that runs one `callAI` round-trip.
3. **Lock down cost controls:** remove client `tier` updates from `app/api/settings/route.ts`; add a DB-backed daily generation counter used by generate/regenerate/repurpose/extract.
4. **Schema + API for Brand-first drafts:** add approved summary fields; make `ContentDraft` creatable from Brand/Idea without required `insightId`; adjust `/api/content/generate` + validation.
5. **Slim the home UX:** Brand Profile → Strategy → Ideas → Generate Draft path; hide Activities/Calendar/Analytics/Integrations from primary navigation.

---

## Closing answers

### What should we absolutely preserve?

- `lib/strategy.ts` heuristic strategy engine + explainable anti-patterns  
- Strategy-aware `generateContent` / `runContentEngine` / decision layer  
- Clerk + Prisma + draft review patterns  
- The principle: product context drives recommendations, humans approve before publish  

### What should we stop building?

- Activity→Insight as the mandatory spine  
- Automated publishing, analytics, and GitHub-centric build-in-public as launch pillars  
- Landing-page pricing/feature claims that the backend does not enforce  
- Agent frameworks and multi-product sprawl before one brand works  

### What is the smallest useful product we can launch?

**Brand Profile + approved summary + strategy lite + pillars/ideas + platform drafts with regenerate/repurpose and saved drafts** — copy/paste to LinkedIn/X. No scheduler required.

### What evidence would make us abandon or change direction?

- 10+ target users try Brand Profile → drafts and still prefer raw ChatGPT for speed/quality  
- Users refuse to maintain even a short approved summary  
- Weekly ideas do not drive return usage (need scheduling or another hook)  
- AI costs per retained user stay above willingness-to-pay after caps  

---

*End of audit. No implementation was begun.*
