# Varabhi product documentation

This folder is the **source of truth for Varabhi product direction**.

Use it to keep engineering, UX, and scope decisions aligned as the product evolves. It does **not** replace inspection of the live codebase, and it does **not** claim that planned features already exist.

## Start here

| Document | Purpose |
|----------|---------|
| **[AUTHORAI_PRODUCT_DIRECTION_V2.md](./AUTHORAI_PRODUCT_DIRECTION_V2.md)** | Official V2 product vision, audience, capabilities, MVP scope, architecture principles, and contributor rules |

## Related repository documents (outside this folder)

| Document | Purpose | Notes |
|----------|---------|--------|
| [docs/README.md](../README.md) | Central documentation index and authority hierarchy | Start here for navigation |
| [AUTHORAI_TECHNICAL_ARCHITECTURE.md](../architecture/AUTHORAI_TECHNICAL_ARCHITECTURE.md) | How the application should be engineered | Subordinate to this folder on *scope*; authoritative on engineering shape |
| [AUTHORAI_AI_SYSTEM.md](../architecture/AUTHORAI_AI_SYSTEM.md) | How AI capabilities must work | Task routing, providers, grounding, quality control |
| [AUTHORAI_V2_PRODUCT_AND_CODEBASE_AUDIT.md](../../AUTHORAI_V2_PRODUCT_AND_CODEBASE_AUDIT.md) | Evidence-based audit of what the codebase actually implements | **Preserve.** Do not overwrite. Technical reality check. |
| [README.md](../../README.md) | Repo setup and historical product description | May lag official V2 direction; prefer this folder + audit for decisions |
| [LAUNCH_CHECKLIST.md](../../LAUNCH_CHECKLIST.md) | Older launch checklist | Not authoritative for V2 scope |
| [docs/very-important.mdx](../very-important.mdx) | Historical product-profile strategy thinking | Reference for Marketing Intelligence heuristics; not MVP scope control |
| [docs/founder-user-experience/](../founder-user-experience/) | Earlier UX notes | Historical; subordinate to V2 direction |

## How to use these docs

1. **What should we build?** → `AUTHORAI_PRODUCT_DIRECTION_V2.md`
2. **How should we engineer it?** → [`../architecture/AUTHORAI_TECHNICAL_ARCHITECTURE.md`](../architecture/AUTHORAI_TECHNICAL_ARCHITECTURE.md)
3. **How should AI work?** → [`../architecture/AUTHORAI_AI_SYSTEM.md`](../architecture/AUTHORAI_AI_SYSTEM.md)
4. **What already exists in code?** → Audit + inspect implementation
5. **Conflict on scope?** → Product direction wins
6. **Conflict on current behavior?** → Code and audit win

## Rules for contributors

- Do not invent features in docs and imply they ship today.
- Clearly label **Current**, **Planned (MVP)**, **Later**, and **Out of scope**.
- Do not expand MVP (publishing, analytics, agents, image generation, enterprise) without updating the product direction document first.
- Prefer small, modular changes that preserve Brand Intelligence → Marketing Intelligence → Content Studio → simple Planner.

## Intentionally not in this folder

Roadmaps that duplicate the direction doc, marketing copy decks, or generated API references. Keep this folder small and authoritative.
