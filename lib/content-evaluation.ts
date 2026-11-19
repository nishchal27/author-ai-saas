/**
 * Content Evaluation Layer – post-generation quality check.
 * Migrated to central AI task `content.review` with Zod validation.
 */

import { executeAi } from "@/lib/ai"
import type { ContentReviewOutput } from "@/lib/ai/schemas/review"

export interface EvaluationResult {
  score: number
  note: string
}

/**
 * Evaluate a content draft for platform and goal fit.
 * Returns score 0–1 and a one-sentence note.
 * Soft-fallback scores are non-authoritative when parsing fails.
 */
export async function evaluateContent(
  content: string,
  platform: string,
  intent: string,
  valueReason?: string
): Promise<EvaluationResult> {
  try {
    const result = await executeAi<ContentReviewOutput>({
      task: "content.review",
      jsonMode: true,
      messages: [
        {
          role: "system",
          content: `You are a content quality reviewer for Varabhi. Rate the given draft for fit with the platform and the creator's goal. Output valid JSON only: { "score": number between 0 and 1, "note": "One short sentence explaining why" }. Be concise.`,
        },
        {
          role: "user",
          content: `Platform: ${platform}. Goal/intent: ${intent}.${valueReason ? ` Extra context: ${valueReason}` : ""}

Draft content:
---
${content.slice(0, 2000)}
---

Output JSON only: { "score": 0.85, "note": "One sentence." }`,
        },
      ],
    })

    if (result.data) {
      return {
        score: Math.min(1, Math.max(0, result.data.score)),
        note: result.data.note.trim().slice(0, 300),
      }
    }

    return { score: 0.5, note: "Evaluation could not be parsed." }
  } catch {
    return { score: 0.5, note: "Evaluation could not be parsed." }
  }
}
