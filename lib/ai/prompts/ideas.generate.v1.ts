import { GROUNDING_RULES_V1, wrapUntrusted } from "@/lib/ai/prompts/grounding"
import type { AssembledBrandContext } from "@/lib/brand-context/types"

export const IDEAS_GENERATE_PROMPT_VERSION = "ideas.generate.v1"

export function buildIdeasGenerateMessages(ctx: AssembledBrandContext) {
  const system = `${GROUNDING_RULES_V1}

Task: ideas.generate (${IDEAS_GENERATE_PROMPT_VERSION})
Generate 3–5 content pillars and 3–8 practical content ideas for this specific brand in Varabhi.

Output JSON only:
{
  "pillars": [{ "id": string, "name": string, "description": string }],
  "ideas": [{
    "id": string,
    "title": string,
    "concept": string,
    "platform": string,
    "pillar": string,
    "audience": string,
    "objective": string,
    "format": string,
    "explanation": string
  }]
}

Rules:
- Ideas must be specific to THIS brand's offerings, audience, and approved facts.
- Avoid generic ideas that could apply to any business.
- Prefer platforms from strategy constraints when present; respect anti-patterns (avoid).
- Do not invent features, prices, proof, or testimonials.
- If brand context is thin, produce fewer ideas and note limits in explanations — never invent facts to flesh them out.`

  const trusted = [
    `Brand: ${ctx.identity.name} (${ctx.identity.type} / ${ctx.identity.industry})`,
    `Audience: ${ctx.identity.audience}${ctx.identity.audienceDetail ? ` — ${ctx.identity.audienceDetail}` : ""}`,
    ctx.approved.summary ? `Approved summary: ${ctx.approved.summary}` : "Approved summary: (none)",
    `Approved facts:\n${ctx.approved.facts.map((f) => `- ${f.text}`).join("\n") || "(none)"}`,
    ctx.approved.voice
      ? `Approved voice: ${ctx.approved.voice.tone}${
          ctx.approved.voice.personality ? `; personality: ${ctx.approved.voice.personality}` : ""
        }`
      : null,
    ctx.strategy
      ? `Strategy platforms: ${JSON.stringify(ctx.strategy.platforms)}\nTone: ${
          ctx.strategy.tone?.style || ""
        }\nAnti-patterns: ${JSON.stringify(ctx.strategy.antiPatterns)}`
      : "Strategy: (none)",
  ]
    .filter(Boolean)
    .join("\n")

  const user = [
    "TRUSTED brand context:",
    trusted,
    "",
    wrapUntrusted(
      "optional_raw_description",
      ctx.untrusted.description || "(no extra description)"
    ),
    "",
    "Return JSON only.",
  ].join("\n")

  return {
    promptVersion: IDEAS_GENERATE_PROMPT_VERSION,
    messages: [
      { role: "system" as const, content: system },
      { role: "user" as const, content: user },
    ],
  }
}
