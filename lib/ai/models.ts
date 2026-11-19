/**
 * Central model ID catalog for Varabhi.
 *
 * Maintenance:
 * - Anthropic IDs verified against Anthropic model docs (Nov 2026):
 *   retired 3.5 snapshot IDs must not be used.
 * - OpenAI: `gpt-4o` is the established Chat Completions model used by this repo.
 * - OpenRouter: OpenAI-compatible prefixed slugs; override via env if catalog drifts.
 * - Prefer env overrides over editing call sites:
 *   AI_MODEL_ANTHROPIC_STANDARD, AI_MODEL_ANTHROPIC_PREMIUM, AI_MODEL_ANTHROPIC_FAST,
 *   AI_MODEL_OPENAI_DEFAULT, AI_MODEL_OPENAI_FAST,
 *   AI_MODEL_OPENROUTER_DEFAULT, AI_MODEL_OPENROUTER_FAST
 */

function envModel(name: string, fallback: string): string {
  const value = process.env[name]?.trim()
  return value || fallback
}

export const MODEL_CATALOG = {
  anthropic: {
    /** Primary quality path for drafts / strategy (standard tier). */
    standard: () => envModel("AI_MODEL_ANTHROPIC_STANDARD", "claude-sonnet-5-5"),
    /** Higher-capacity path (premium tier / long-form). */
    premium: () => envModel("AI_MODEL_ANTHROPIC_PREMIUM", "claude-opus-5-5"),
    /** Cheap/fast path for review / suggestions. */
    fast: () => envModel("AI_MODEL_ANTHROPIC_FAST", "claude-haiku-4-5-20251001"),
  },
  openai: {
    default: () => envModel("AI_MODEL_OPENAI_DEFAULT", "gpt-4o"),
    fast: () => envModel("AI_MODEL_OPENAI_FAST", "gpt-4o-mini"),
  },
  openrouter: {
    default: () =>
      envModel("AI_MODEL_OPENROUTER_DEFAULT", "anthropic/claude-sonnet-4.5"),
    fast: () => envModel("AI_MODEL_OPENROUTER_FAST", "openai/gpt-4o-mini"),
  },
} as const
