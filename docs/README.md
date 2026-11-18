# Varabhi documentation

This is the central index for Varabhi V2 documentation.

**AI coding agents and human contributors must read the relevant documents before implementing changes.** Do not treat marketing copy, outdated root README claims, or historical notes as authority over these docs and the live code.

---

## Authority hierarchy

| Priority | Document | Decides |
|----------|----------|---------|
| 1 | [Product direction](./product/AUTHORAI_PRODUCT_DIRECTION_V2.md) | **What** to build (vision, audience, MVP scope, non-goals) |
| 2 | [Technical architecture](./architecture/AUTHORAI_TECHNICAL_ARCHITECTURE.md) | **How** the application should be engineered |
| 3 | [AI System](./architecture/AUTHORAI_AI_SYSTEM.md) | **How AI capabilities** must work (tasks, providers, prompts, QC, cost) |
| 4 | [Codebase audit](../AUTHORAI_V2_PRODUCT_AND_CODEBASE_AUDIT.md) + **live code** | **What currently exists and works** |

### Conflict rules

- **Scope conflict** (should we build X?) → Product direction wins.
- **Engineering conflict** (how should X be structured?) → Technical architecture wins (within product scope).
- **AI behavior conflict** → AI System wins (within product scope).
- **Current behavior conflict** → Live code wins; update docs if the docs are wrong. The audit is evidence, not a substitute for re-checking files you will change.

### Status labels used across docs

| Label | Meaning |
|-------|---------|
| **Current** | Exists in the codebase today |
| **Planned (MVP)** | Required for V2 beta; not fully present yet |
| **Later** | Intentionally deferred |
| **Out of scope** | Do not build unless product direction is revised |

Never claim Planned or Later work is already shipped.

---

## Start here by job

| If you are… | Read this first | Then |
|-------------|-----------------|------|
| Implementing a product feature | [Product direction](./product/AUTHORAI_PRODUCT_DIRECTION_V2.md) | Technical architecture + inspect code |
| Changing API routes, state, DB, auth | [Technical architecture](./architecture/AUTHORAI_TECHNICAL_ARCHITECTURE.md) | Product scope section for that feature |
| Changing prompts, models, providers, generation | [AI System](./architecture/AUTHORAI_AI_SYSTEM.md) | Technical architecture (server boundaries, UsageMeter) |
| Asking “does this already work?” | [Audit](../AUTHORAI_V2_PRODUCT_AND_CODEBASE_AUDIT.md) | Re-verify in the repository |
| Setting up the repo locally | Root [`README.md`](../README.md) / [`SETUP.md`](../SETUP.md) | Prefer V2 docs for product/architecture decisions |

---

## Document map

### Product

| Document | Purpose |
|----------|---------|
| [product/README.md](./product/README.md) | Product docs folder index |
| [product/AUTHORAI_PRODUCT_DIRECTION_V2.md](./product/AUTHORAI_PRODUCT_DIRECTION_V2.md) | Official V2 product direction |

### Architecture

| Document | Purpose |
|----------|---------|
| [architecture/AUTHORAI_TECHNICAL_ARCHITECTURE.md](./architecture/AUTHORAI_TECHNICAL_ARCHITECTURE.md) | Modular monolith, stack, Query/Zustand, API lifecycle, services, security |
| [architecture/AUTHORAI_AI_SYSTEM.md](./architecture/AUTHORAI_AI_SYSTEM.md) | AI orchestration, providers, tasks, BrandContextAssembler, QC, cost, eval |

### Evidence and historical

| Document | Purpose | Authority |
|----------|---------|-----------|
| [AUTHORAI_V2_PRODUCT_AND_CODEBASE_AUDIT.md](../AUTHORAI_V2_PRODUCT_AND_CODEBASE_AUDIT.md) | Evidence-based audit of the codebase | Preserve; do not overwrite; re-check code for latest truth |
| [very-important.mdx](./very-important.mdx) | Historical strategy-profile thinking | Reference for heuristics only |
| [founder-user-experience/](./founder-user-experience/) | Earlier UX notes | Historical; subordinate to V2 direction |
| Root README, LAUNCH_CHECKLIST, ANALYSIS | Older setup / launch claims | May lag; not V2 scope control |

---

## Mandatory checklist for coding agents

Before writing or modifying application code:

1. Confirm the change is in product scope (or explicitly out-of-scope work was requested).
2. Read the technical architecture sections that apply (state, API lifecycle, DB, security).
3. If the change touches AI: read the AI System doc end-to-end for that area (tasks, providers, QC, cost).
4. Inspect the actual files you will change — do not assume the audit is exhaustive or current.
5. Do not add dependencies, providers, or infrastructure speculative to the task.
6. Do not invent credentials, database URLs, or “implemented” claims.
7. Prefer evolving existing modules (`lib/strategy.ts`, content engine, Clerk, Prisma, draft APIs) over greenfield rewrites.
8. Stop after the requested scope; do not start Brand Studio or other features from a docs-only or unrelated task.

---

## Intentionally not in `docs/`

- Generated API references
- Marketing decks
- Duplicate roadmaps that diverge from product direction

Keep this tree small and authoritative. When architecture or AI contracts change, update the documents in the same change set whenever possible.
