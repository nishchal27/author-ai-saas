import { GROUNDING_RULES_V1, wrapUntrusted } from "@/lib/ai/prompts/grounding"
import type { AssembledBrandContext } from "@/lib/brand-context/types"

export const SUGGESTIONS_GENERATE_PROMPT_VERSION = "suggestions.generate.v1"

export function buildSuggestionsGenerateMessages(ctx: AssembledBrandContext) {
  const system = `${GROUNDING_RULES_V1}

Task: suggestions.generate (${SUGGESTIONS_GENERATE_PROMPT_VERSION})
Suggest actionable improvements to the brand profile or marketing strategy for Varabhi users.

Output JSON only:
{
  "suggestions": [{
    "id": string,
    "area": "profile" | "strategy" | "voice" | "audience" | "offerings" | "other",
    "title": string,
    "suggestion": string,
    "rationale": string,
    "isGuess": boolean,
    "status": "pending"
  }]
}

Rules:
- Be specific and actionable for THIS brand.
- Explain why each change helps.
- Set isGuess=true whenever the suggestion is not grounded in approved facts.
- Never present guesses as facts.
- Do not invent certifications, customers, or metrics.
- User will accept, reject, or edit — leave status as "pending".`

  const trusted = [
    `Brand: ${ctx.identity.name}`,
    `Status: ${ctx.meta.profileStatus}`,
    `Approved summary: ${ctx.approved.summary || "(none)"}`,
    `Approved facts count: ${ctx.approved.facts.length}`,
    `Missing signals: ${ctx.meta.missingFields.join(", ") || "(none flagged)"}`,
    ctx.strategy?.summary ? `Strategy summary: ${ctx.strategy.summary}` : "Strategy: (none)",
  ].join("\n")

  const user = [
    "TRUSTED context:",
    trusted,
    "",
    wrapUntrusted(
      "raw_profile_notes",
      [
        ctx.untrusted.description || "",
        ctx.untrusted.competitors || "",
      ]
        .filter(Boolean)
        .join("\n") || "(empty)"
    ),
    "",
    "Return JSON only.",
  ].join("\n")

  return {
    promptVersion: SUGGESTIONS_GENERATE_PROMPT_VERSION,
    messages: [
      { role: "system" as const, content: system },
      { role: "user" as const, content: user },
    ],
  }
}
