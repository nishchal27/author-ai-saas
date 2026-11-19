import { executeAi } from "@/lib/ai"
import {
  suggestionsGenerateSchema,
  SUGGESTIONS_GENERATE_SCHEMA_VERSION,
  type SuggestionsGenerateOutput,
} from "@/lib/ai/schemas/brand"
import { buildSuggestionsGenerateMessages } from "@/lib/ai/prompts/suggestions.generate.v1"
import { assembleBrandContext } from "@/lib/brand-context/assembler"
import { db } from "@/lib/db"
import { randomUUID } from "crypto"
import type { BrandSuggestion } from "@/lib/brand/types"

export async function generateBrandSuggestions(opts: {
  userId: string
  productId: string
}) {
  const ctx = await assembleBrandContext({
    userId: opts.userId,
    productId: opts.productId,
    task: "suggestions.generate",
  })

  const { messages, promptVersion } = buildSuggestionsGenerateMessages(ctx)
  const result = await executeAi<SuggestionsGenerateOutput>({
    task: "suggestions.generate",
    userId: opts.userId,
    brandId: opts.productId,
    messages,
    jsonMode: true,
  })

  const data =
    result.data ?? suggestionsGenerateSchema.parse(JSON.parse(result.text))

  const suggestions = data.suggestions.map((s) => ({
    ...s,
    id: s.id || randomUUID(),
    status: "pending" as const,
  }))

  await db.product.updateMany({
    where: { id: opts.productId, userId: opts.userId },
    data: {
      brandSuggestionsJson: JSON.stringify({
        kind: "suggestions.generate",
        schemaVersion: SUGGESTIONS_GENERATE_SCHEMA_VERSION,
        promptVersion,
        generatedAt: new Date().toISOString(),
        suggestions,
      }),
    },
  })

  return {
    suggestions,
    promptVersion,
    schemaVersion: SUGGESTIONS_GENERATE_SCHEMA_VERSION,
    provider: result.provider,
    model: result.model,
  }
}

export async function updateBrandSuggestionStatus(opts: {
  userId: string
  productId: string
  suggestionId: string
  status: BrandSuggestion["status"]
  editedText?: string
}) {
  const product = await db.product.findFirst({
    where: { id: opts.productId, userId: opts.userId },
    select: { brandSuggestionsJson: true },
  })
  if (!product?.brandSuggestionsJson) {
    throw new Error("No suggestions found")
  }

  const parsed = JSON.parse(product.brandSuggestionsJson) as {
    suggestions?: BrandSuggestion[]
    [key: string]: unknown
  }
  if (!Array.isArray(parsed.suggestions)) {
    throw new Error("Invalid suggestions payload")
  }

  const suggestions = parsed.suggestions.map((s) => {
    if (s.id !== opts.suggestionId) return s
    return {
      ...s,
      status: opts.status,
      ...(opts.editedText ? { suggestion: opts.editedText } : {}),
    }
  })

  await db.product.updateMany({
    where: { id: opts.productId, userId: opts.userId },
    data: {
      brandSuggestionsJson: JSON.stringify({ ...parsed, suggestions }),
    },
  })

  return { suggestions }
}
