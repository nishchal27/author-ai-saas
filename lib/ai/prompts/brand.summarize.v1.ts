import { GROUNDING_RULES_V1, wrapUntrusted } from "@/lib/ai/prompts/grounding"
import type { AssembledBrandContext } from "@/lib/brand-context/types"

export const BRAND_SUMMARIZE_PROMPT_VERSION = "brand.summarize.v1"

export function buildBrandSummarizeMessages(ctx: AssembledBrandContext) {
  const system = `${GROUNDING_RULES_V1}

Task: brand.summarize (${BRAND_SUMMARIZE_PROMPT_VERSION})
Produce a structured brand summary for the user to review and approve in Varabhi Brand Studio.

Output JSON only matching:
{
  "businessDescription": string,
  "productsServices": string[],
  "targetAudience": string,
  "positioning": string,
  "differentiators": string[],
  "brandPersonality": string,
  "brandVoice": { "tone": string, "examples"?: string[], "personality"?: string },
  "missingInformation": string[],
  "suggestedImprovements": string[],
  "proposedFacts": [{ "id": string, "text": string, "category"?: string, "source": "ai_proposed" }],
  "userSuppliedFacts": [{ "id": string, "text": string, "category"?: string, "source": "user" }]
}

Rules:
- userSuppliedFacts: only paraphrase facts clearly present in product fields or approved facts.
- proposedFacts: interpretations that need user approval; source must be "ai_proposed".
- Do not auto-approve anything. This output is a proposal only.`

  const identity = [
    `Name: ${ctx.identity.name}`,
    `Type/category: ${ctx.identity.type}`,
    `Industry: ${ctx.identity.industry}`,
    `Stage: ${ctx.identity.stage}`,
    `Sales motion: ${ctx.identity.salesMotion}`,
    `Audience code: ${ctx.identity.audience}`,
    ctx.identity.audienceDetail ? `Audience detail: ${ctx.identity.audienceDetail}` : null,
    ctx.identity.website ? `Website: ${ctx.identity.website}` : null,
  ]
    .filter(Boolean)
    .join("\n")

  const approved = ctx.approved.summary
    ? `APPROVED summary:\n${ctx.approved.summary}\nAPPROVED facts:\n${
        ctx.approved.facts.map((f) => `- ${f.text}`).join("\n") || "(none)"
      }`
    : "APPROVED summary/facts: (none yet)"

  const user = [
    "TRUSTED identity fields (user-entered product profile):",
    identity,
    "",
    approved,
    "",
    wrapUntrusted(
      "product_description_and_competitors",
      [
        ctx.untrusted.description || "",
        ctx.untrusted.competitors ? `Competitors note: ${ctx.untrusted.competitors}` : "",
        ctx.untrusted.founderBio ? `Founder bio: ${ctx.untrusted.founderBio}` : "",
        ctx.untrusted.userBrandVoice ? `User brand voice note: ${ctx.untrusted.userBrandVoice}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    ),
    "",
    "Return JSON only.",
  ].join("\n")

  return {
    promptVersion: BRAND_SUMMARIZE_PROMPT_VERSION,
    messages: [
      { role: "system" as const, content: system },
      { role: "user" as const, content: user },
    ],
  }
}
