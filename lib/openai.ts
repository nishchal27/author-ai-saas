/**
 * @deprecated Prefer `@/lib/ai` providers (`openaiAdapter` / `executeAi`).
 * Kept as a thin re-export so accidental imports do not throw at module load.
 */
export { openaiAdapter as openai } from "@/lib/ai/providers/openai"
export { getProviderAdapter } from "@/lib/ai/providers"
