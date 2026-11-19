import type { z } from "zod"
import { AiOrchestrationError, type AiTaskId } from "@/lib/ai/types"

/**
 * Extract a JSON object from model text without relying on brittle regex as the only path.
 * Handles fenced ```json blocks and surrounding prose.
 */
export function extractJsonObject(text: string): unknown {
  const trimmed = text.trim()
  if (!trimmed) {
    throw new AiOrchestrationError({
      code: "parse_failed",
      message: "Empty model response; expected JSON",
    })
  }

  // Fenced code block
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence?.[1]) {
    return JSON.parse(fence[1].trim())
  }

  // Whole string is JSON
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return JSON.parse(trimmed)
  }

  // Find first balanced object
  const start = trimmed.indexOf("{")
  if (start < 0) {
    throw new AiOrchestrationError({
      code: "parse_failed",
      message: "No JSON object found in model response",
    })
  }

  let depth = 0
  let inString = false
  let escape = false
  for (let i = start; i < trimmed.length; i++) {
    const ch = trimmed[i]
    if (inString) {
      if (escape) {
        escape = false
      } else if (ch === "\\") {
        escape = true
      } else if (ch === "\"") {
        inString = false
      }
      continue
    }
    if (ch === "\"") {
      inString = true
      continue
    }
    if (ch === "{") depth++
    if (ch === "}") {
      depth--
      if (depth === 0) {
        return JSON.parse(trimmed.slice(start, i + 1))
      }
    }
  }

  throw new AiOrchestrationError({
    code: "parse_failed",
    message: "Malformed or truncated JSON in model response",
  })
}

export function parseAndValidate<T>(
  text: string,
  schema: z.ZodType<T>,
  opts?: { task?: AiTaskId; schemaVersion?: string }
): T {
  let raw: unknown
  try {
    raw = extractJsonObject(text)
  } catch (err) {
    if (err instanceof AiOrchestrationError) {
      throw err
    }
    throw new AiOrchestrationError({
      code: "parse_failed",
      message: "Failed to parse JSON from model response",
      task: opts?.task,
    })
  }

  const result = schema.safeParse(raw)
  if (!result.success) {
    throw new AiOrchestrationError({
      code: "validation_failed",
      message: "Model output failed schema validation",
      task: opts?.task,
      details: {
        schemaVersion: opts?.schemaVersion,
        issues: result.error.issues.map((i) => ({
          path: i.path.join("."),
          code: i.code,
          message: i.message,
        })),
      },
    })
  }
  return result.data
}
