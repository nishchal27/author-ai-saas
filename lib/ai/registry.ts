import { MODEL_CATALOG } from "@/lib/ai/models"
import {
  CONTENT_REVIEW_SCHEMA_VERSION,
  contentReviewSchema,
} from "@/lib/ai/schemas/review"
import {
  STRATEGY_GENERATE_SCHEMA_VERSION,
  strategyGenerateSchema,
} from "@/lib/ai/schemas/strategy"
import type { AiTaskId, TaskDefinition } from "@/lib/ai/types"
import { AiOrchestrationError } from "@/lib/ai/types"

/**
 * Resolve which provider should be primary for registry defaults.
 * Preference: Anthropic → OpenAI → OpenRouter (first configured).
 */
export function resolveDefaultProvider(): "anthropic" | "openai" | "openrouter" {
  if (process.env.ANTHROPIC_API_KEY) return "anthropic"
  if (process.env.OPENAI_API_KEY) return "openai"
  if (process.env.OPENROUTER_API_KEY) return "openrouter"
  // Registry still defines anthropic as nominal primary; orchestration fails lazily.
  return "anthropic"
}

function modelsFor(provider: "anthropic" | "openai" | "openrouter") {
  if (provider === "anthropic") {
    return {
      standard: MODEL_CATALOG.anthropic.standard(),
      premium: MODEL_CATALOG.anthropic.premium(),
      fast: MODEL_CATALOG.anthropic.fast(),
    }
  }
  if (provider === "openai") {
    return {
      standard: MODEL_CATALOG.openai.default(),
      premium: MODEL_CATALOG.openai.default(),
      fast: MODEL_CATALOG.openai.fast(),
    }
  }
  return {
    standard: MODEL_CATALOG.openrouter.default(),
    premium: MODEL_CATALOG.openrouter.default(),
    fast: MODEL_CATALOG.openrouter.fast(),
  }
}

function buildRegistry(): Record<AiTaskId, TaskDefinition> {
  const primary = resolveDefaultProvider()
  const models = modelsFor(primary)

  // Explicit single fallback: if primary is anthropic, fall back to openai when configured.
  const fallback =
    primary === "anthropic" && process.env.OPENAI_API_KEY
      ? { provider: "openai" as const, model: MODEL_CATALOG.openai.default() }
      : primary === "openai" && process.env.OPENROUTER_API_KEY
        ? { provider: "openrouter" as const, model: MODEL_CATALOG.openrouter.default() }
        : primary === "openrouter" && process.env.OPENAI_API_KEY
          ? { provider: "openai" as const, model: MODEL_CATALOG.openai.default() }
          : undefined

  const base = {
    provider: primary,
    fallback,
    maxRetries: 1,
  }

  return {
    "brand.summarize": {
      ...base,
      id: "brand.summarize",
      description: "Propose brand summary and facts for user approval",
      model: models.standard,
      maxOutputTokens: 2000,
      timeoutMs: 45_000,
      temperature: 0.3,
      usageCategory: "brand",
      qualityPolicy: "deterministic_only",
      promptVersion: "brand.summarize.v1",
      allowJsonRepair: true,
    },
    "strategy.generate": {
      ...base,
      id: "strategy.generate",
      description: "Generate marketing strategy JSON",
      model: models.standard,
      maxOutputTokens: 3000,
      timeoutMs: 60_000,
      temperature: 0.4,
      usageCategory: "strategy",
      qualityPolicy: "deterministic_only",
      promptVersion: "strategy.generate.v1",
      schemaVersion: STRATEGY_GENERATE_SCHEMA_VERSION,
      outputSchema: strategyGenerateSchema,
      allowJsonRepair: true,
    },
    "ideas.generate": {
      ...base,
      id: "ideas.generate",
      description: "Generate content pillars and ideas",
      model: models.standard,
      maxOutputTokens: 2500,
      timeoutMs: 45_000,
      temperature: 0.5,
      usageCategory: "ideas",
      qualityPolicy: "deterministic_only",
      promptVersion: "ideas.generate.v1",
      allowJsonRepair: true,
    },
    "content.generate": {
      ...base,
      id: "content.generate",
      description: "Generate platform draft",
      model: models.standard,
      maxOutputTokens: 4000,
      timeoutMs: 60_000,
      temperature: 0.6,
      usageCategory: "draft",
      // Hybrid: deterministic always; AI review only when forceAiReview / blog policy
      qualityPolicy: "deterministic_then_optional_review",
      promptVersion: "content.generate.v1",
      allowJsonRepair: true,
    },
    "content.regenerate": {
      ...base,
      id: "content.regenerate",
      description: "Regenerate draft with feedback",
      model: models.standard,
      maxOutputTokens: 4000,
      timeoutMs: 60_000,
      temperature: 0.6,
      usageCategory: "draft",
      qualityPolicy: "deterministic_only",
      promptVersion: "content.regenerate.v1",
      allowJsonRepair: true,
    },
    "content.repurpose": {
      ...base,
      id: "content.repurpose",
      description: "Repurpose draft for new platform/audience",
      model: models.standard,
      maxOutputTokens: 4000,
      timeoutMs: 60_000,
      temperature: 0.6,
      usageCategory: "draft",
      qualityPolicy: "deterministic_only",
      promptVersion: "content.repurpose.v1",
      allowJsonRepair: true,
    },
    "content.review": {
      ...base,
      id: "content.review",
      description: "Optional semantic quality review",
      model: models.fast,
      maxOutputTokens: 400,
      timeoutMs: 30_000,
      temperature: 0.2,
      usageCategory: "review",
      qualityPolicy: "review_task",
      promptVersion: "content.review.v1",
      schemaVersion: CONTENT_REVIEW_SCHEMA_VERSION,
      outputSchema: contentReviewSchema,
      allowJsonRepair: true,
      fallback: fallback
        ? {
            provider: fallback.provider,
            model:
              fallback.provider === "openai"
                ? MODEL_CATALOG.openai.fast()
                : MODEL_CATALOG.openrouter.fast(),
          }
        : undefined,
    },
    "suggestions.generate": {
      ...base,
      id: "suggestions.generate",
      description: "Lightweight next-action / copy suggestions",
      model: models.fast,
      maxOutputTokens: 800,
      timeoutMs: 30_000,
      temperature: 0.4,
      usageCategory: "suggestions",
      qualityPolicy: "deterministic_only",
      promptVersion: "suggestions.generate.v1",
    },
    "insight.extract": {
      ...base,
      id: "insight.extract",
      description: "Compatibility: activity → insight extraction",
      model: models.standard,
      maxOutputTokens: 2000,
      timeoutMs: 45_000,
      temperature: 0.3,
      usageCategory: "insight",
      qualityPolicy: "deterministic_only",
      promptVersion: "insight.extract.v1",
      allowJsonRepair: true,
    },
  }
}

let cached: Record<AiTaskId, TaskDefinition> | null = null

/** Reset cache (tests / env changes). */
export function resetTaskRegistryCache(): void {
  cached = null
}

export function getTaskRegistry(): Record<AiTaskId, TaskDefinition> {
  if (!cached) cached = buildRegistry()
  return cached
}

export function getTaskDefinition(taskId: AiTaskId): TaskDefinition {
  const def = getTaskRegistry()[taskId]
  if (!def) {
    throw new AiOrchestrationError({
      code: "unknown_task",
      message: `Unknown AI task: ${taskId}`,
      task: taskId,
    })
  }
  return def
}

/**
 * Premium / blog content may use a higher-capacity model without exposing choice to clients.
 */
export function resolveTaskModel(
  taskId: AiTaskId,
  opts?: { premium?: boolean; contentType?: string }
): string {
  const def = getTaskDefinition(taskId)
  const provider = def.provider
  const models = modelsFor(provider)
  if (opts?.contentType === "blog" || opts?.premium) {
    return models.premium
  }
  return def.model
}
