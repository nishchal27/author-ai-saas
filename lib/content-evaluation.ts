/**
 * Content Evaluation Layer – post-generation quality check.
 * Rates a draft for platform fit and goal alignment; returns score and one sentence.
 */

import { callAI } from "./claude"

export interface EvaluationResult {
  score: number
  note: string
}

/**
 * Evaluate a content draft for platform and goal fit.
 * Returns score 0–1 and a one-sentence note (e.g. "Fits Instagram: short caption, strong visual hook").
 */
export async function evaluateContent(
  content: string,
  platform: string,
  intent: string,
  valueReason?: string
): Promise<EvaluationResult> {
  const systemPrompt = `You are a content quality reviewer for AuthorAI. Rate the given draft for fit with the platform and the creator's goal. Output valid JSON only: { "score": number between 0 and 1, "note": "One short sentence explaining why (e.g. 'Fits Instagram: short caption, strong visual hook.' or 'Could be punchier for Twitter.')" }. Be concise.`

  const userPrompt = `Platform: ${platform}. Goal/intent: ${intent}.${valueReason ? ` Extra context: ${valueReason}` : ""}

Draft content:
---
${content.slice(0, 2000)}
---

Output JSON only: { "score": 0.85, "note": "One sentence." }`

  const model = "claude-3-5-haiku-20241022"
  const responseText = await callAI(systemPrompt, userPrompt, model, 200)
  const jsonMatch = responseText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return { score: 0.5, note: "Evaluation could not be parsed." }
  }
  try {
    const parsed = JSON.parse(jsonMatch[0]) as { score?: number; note?: string }
    const score = typeof parsed.score === "number"
      ? Math.min(1, Math.max(0, parsed.score))
      : 0.5
    const note = typeof parsed.note === "string" ? parsed.note.trim().slice(0, 300) : ""
    return { score, note }
  } catch {
    return { score: 0.5, note: "Evaluation could not be parsed." }
  }
}
