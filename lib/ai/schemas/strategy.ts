import { z } from "zod"

/**
 * Structured schema for strategy.generate — aligned with MarketingStrategyOutput
 * and the prompt contract in lib/strategy.ts.
 */
export const strategyGenerateSchema = z.object({
  platforms: z.array(
    z.object({
      platform: z.string().min(1),
      priority: z.enum(["primary", "secondary", "avoid"]).or(z.string()),
      reasoning: z.string().min(1),
    })
  ).min(1),
  contentTypes: z.array(
    z.object({
      type: z.string().min(1),
      recommended: z.boolean(),
      reasoning: z.string().min(1),
    })
  ).min(1),
  tone: z.object({
    style: z.string().min(1),
    examples: z.array(z.string()),
    avoid: z.array(z.string()),
  }),
  visualStyle: z
    .object({
      style: z.string(),
      examples: z.array(z.string()).optional(),
      colors: z.string().optional(),
    })
    .optional(),
  cadence: z.object({
    frequency: z.string().min(1),
    postsPerWeek: z.number().optional(),
    reasoning: z.string().optional(),
  }),
  proofTypes: z.array(z.string()),
  antiPatterns: z.array(
    z.object({
      pattern: z.string().min(1),
      reasoning: z.string().min(1),
    })
  ),
  summary: z.string().min(1),
  reasoning: z.string().min(1),
  confidence: z.number().min(0).max(1).optional(),
})

export type StrategyGenerateOutput = z.infer<typeof strategyGenerateSchema>

export const STRATEGY_GENERATE_SCHEMA_VERSION = "strategy.generate.v1"
