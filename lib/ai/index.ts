/**
 * Varabhi central AI foundation.
 *
 * New code should call `executeAi({ task, messages, ... })`.
 * Legacy `callAI` in lib/claude.ts delegates to `completeText`.
 */

export { executeAi, completeText } from "@/lib/ai/orchestrator"
export { getTaskDefinition, getTaskRegistry, resolveTaskModel, resetTaskRegistryCache } from "@/lib/ai/registry"
export { MODEL_CATALOG } from "@/lib/ai/models"
export { parseAndValidate, extractJsonObject } from "@/lib/ai/parse"
export { runDeterministicChecks } from "@/lib/ai/quality"
export { getProviderAdapter, requireConfiguredProvider } from "@/lib/ai/providers"
export { contentReviewSchema, CONTENT_REVIEW_SCHEMA_VERSION } from "@/lib/ai/schemas/review"
export { strategyGenerateSchema, STRATEGY_GENERATE_SCHEMA_VERSION } from "@/lib/ai/schemas/strategy"
export type {
  AiTaskId,
  AiProviderId,
  AiMessage,
  AiNormalizedResult,
  ExecuteAiRequest,
  ExecuteAiResult,
  TaskDefinition,
  QualityPolicy,
} from "@/lib/ai/types"
export { AiProviderError, AiOrchestrationError } from "@/lib/ai/types"
