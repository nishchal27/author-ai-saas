import { z } from "zod"
import { NextResponse } from "next/server"

/** Product create/update */
export const productCreateSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.string().min(1).max(100),
  industry: z.string().min(1).max(100),
  audience: z.string().min(1).max(500),
  audienceDetail: z.string().max(2000).optional(),
  stage: z.string().min(1).max(50),
  salesMotion: z.string().min(1).max(100),
  description: z.string().max(5000).optional(),
  website: z.string().url().max(500).optional().or(z.literal("")),
  competitors: z.string().max(2000).optional(),
})

/** Activity create */
export const activityCreateSchema = z.object({
  type: z.string().min(1).max(50),
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  metadata: z.record(z.unknown()).optional(),
  productId: z.string().cuid().optional().nullable(),
})

/** Insight create */
export const insightCreateSchema = z.object({
  coreProblem: z.string().min(1).max(5000),
  solution: z.string().min(1).max(5000),
  audience: z.string().min(1).max(1000),
  whyMatters: z.string().min(1).max(2000),
  impact: z.string().max(2000).optional(),
  productId: z.string().cuid().optional().nullable(),
})

/** Content generate */
export const contentGenerateSchema = z.object({
  insightId: z.string().cuid(),
  type: z.string().max(50).optional(),
  platform: z.string().max(50).optional(),
  productId: z.string().cuid().optional().nullable(),
  intent: z.string().max(100).optional(),
  audienceSegment: z.string().max(100).optional(),
  persona: z.string().max(100).optional(),
  reason: z.string().max(500).optional(),
  context: z.string().max(2000).optional(),
})

/** Content regenerate */
export const contentRegenerateSchema = z.object({
  draftId: z.string().cuid(),
  feedback: z.string().max(2000).optional(),
})

/** Content repurpose */
export const contentRepurposeSchema = z.object({
  sourceDraftId: z.string().cuid(),
  audienceSegment: z.string().max(100).optional(),
  intent: z.string().max(100).optional(),
  persona: z.string().max(100).optional(),
  type: z.string().max(50).optional(),
  platform: z.string().max(50).optional(),
})

/** Schedule create */
export const scheduleCreateSchema = z.object({
  contentDraftId: z.string().cuid(),
  platform: z.enum(["linkedin", "twitter"]),
  scheduledAt: z.string().min(1), // ISO date string
})

/** Insight extract */
export const insightExtractSchema = z.object({
  activityId: z.string().cuid(),
  humanInput: z
    .object({
      whatChanged: z.string().max(1000).optional(),
      whoBenefited: z.string().max(1000).optional(),
      whyMatters: z.string().max(1000).optional(),
    })
    .optional(),
  productId: z.string().cuid().optional().nullable(),
})

/** Integration GitHub */
export const integrationGithubSchema = z.object({
  accessToken: z.string().min(1).max(2000),
  config: z.unknown().optional(),
})

/** Integration LinkedIn */
export const integrationLinkedInSchema = z.object({
  accessToken: z.string().min(1).max(2000),
  refreshToken: z.string().max(2000).optional(),
  organizationId: z.string().max(200).optional(),
})

/** Integration Twitter */
export const integrationTwitterSchema = z.object({
  accessToken: z.string().min(1).max(2000),
  refreshToken: z.string().max(2000).optional(),
})

/** Publish (scheduleId) */
export const publishSchema = z.object({
  scheduleId: z.string().cuid(),
})

/** Analytics sync */
export const analyticsSyncSchema = z.object({
  scheduleId: z.string().cuid().optional(),
})

/** GitHub sync */
export const githubSyncSchema = z.object({
  repoUrl: z.string().url().max(500),
})

export type ProductCreateInput = z.infer<typeof productCreateSchema>
export type ActivityCreateInput = z.infer<typeof activityCreateSchema>
export type InsightCreateInput = z.infer<typeof insightCreateSchema>
export type ContentGenerateInput = z.infer<typeof contentGenerateSchema>
export type ContentRegenerateInput = z.infer<typeof contentRegenerateSchema>
export type ContentRepurposeInput = z.infer<typeof contentRepurposeSchema>
export type ScheduleCreateInput = z.infer<typeof scheduleCreateSchema>
export type InsightExtractInput = z.infer<typeof insightExtractSchema>

/**
 * Parse JSON body with a Zod schema. Returns NextResponse with 400 and error details on failure.
 */
export function parseBody<T>(
  body: unknown,
  schema: z.ZodType<T>
): { data: T } | { error: NextResponse } {
  const result = schema.safeParse(body)
  if (result.success) {
    return { data: result.data }
  }
  const first = result.error.flatten().fieldErrors
  const message = Object.entries(first)
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
    .join("; ") || "Validation failed"
  return {
    error: NextResponse.json(
      { error: "Validation failed", details: message },
      { status: 400 }
    ),
  }
}
