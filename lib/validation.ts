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
  businessModel: z.string().max(100).optional().nullable(),
  description: z.string().max(5000).optional(),
  website: z
    .union([
      z.literal(""),
      z
        .string()
        .url({
          message:
            "Enter a full URL including https:// (e.g. https://example.com)",
        })
        .max(500),
    ])
    .optional(),
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

/** Content generate — Insight (legacy) and/or ContentIdea (V2) */
export const contentGenerateSchema = z
  .object({
    insightId: z.string().cuid().optional(),
    ideaId: z.string().cuid().optional(),
    type: z.string().max(50).optional(),
    platform: z.string().max(50).optional(),
    productId: z.string().cuid().optional().nullable(),
    intent: z.string().max(100).optional(),
    audienceSegment: z.string().max(100).optional(),
    persona: z.string().max(100).optional(),
    reason: z.string().max(500).optional(),
    context: z.string().max(2000).optional(),
  })
  .refine((v) => Boolean(v.insightId || v.ideaId), {
    message: "insightId or ideaId is required",
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

/** Settings PATCH — tier is intentionally excluded (server-controlled only). */
export const settingsPatchSchema = z
  .object({
    brandVoice: z.string().max(10000).optional(),
    founderBio: z.string().max(5000).optional(),
  })
  .strict()

/** Product PATCH */
export const productPatchSchema = productCreateSchema
  .partial()
  .extend({
    isActive: z.boolean().optional(),
    techStack: z
      .union([
        z.array(
          z.object({
            name: z.string().min(1).max(100),
            version: z.string().max(50).optional(),
            note: z.string().max(500).optional(),
          })
        ),
        z.string().max(10000),
      ])
      .optional(),
  })
  .strict()

/** Set active product */
export const activeProductSchema = z
  .object({
    activeProductId: z.string().cuid().nullable(),
  })
  .strict()

/** Draft PATCH */
export const draftPatchSchema = z
  .object({
    title: z.string().min(1).max(500).optional(),
    content: z.string().min(1).max(50000).optional(),
    status: z
      .enum(["draft", "approved", "scheduled", "published", "rejected"])
      .optional(),
  })
  .strict()

/** Save a manual brand proposal (proposed only — not trusted until approved) */
export const brandManualProposeSchema = z
  .object({
    mode: z.literal("manual"),
    summary: z.string().min(1).max(5000),
    facts: z
      .array(
        z.object({
          id: z.string().min(1).max(80).optional(),
          text: z.string().min(1).max(500),
          category: z.string().max(100).optional(),
        })
      )
      .min(1)
      .max(40),
    voice: z
      .object({
        tone: z.string().min(1).max(500),
        examples: z.array(z.string().max(300)).max(8).optional(),
        personality: z.string().max(500).optional(),
      })
      .optional(),
  })
  .strict()

/** Approve brand summary/facts (user-controlled) */
export const brandApproveSchema = z
  .object({
    summary: z.string().min(1).max(5000),
    facts: z
      .array(
        z.object({
          id: z.string().min(1).max(80),
          text: z.string().min(1).max(500),
          category: z.string().max(100).optional(),
          source: z.enum(["user", "ai_proposed", "ai_approved"]).optional(),
        })
      )
      .max(40),
    voice: z
      .object({
        tone: z.string().min(1).max(500),
        examples: z.array(z.string().max(300)).max(8).optional(),
        personality: z.string().max(500).optional(),
      })
      .optional(),
  })
  .strict()

/** Update a suggestion status */
export const brandSuggestionStatusSchema = z
  .object({
    suggestionId: z.string().min(1).max(80),
    status: z.enum(["pending", "accepted", "rejected", "edited"]),
    editedText: z.string().max(800).optional(),
  })
  .strict()

/** Content pillar create/update */
export const pillarCreateSchema = z
  .object({
    name: z.string().min(1).max(120),
    description: z.string().min(1).max(1000),
    purpose: z.string().max(1000).optional(),
  })
  .strict()

export const pillarPatchSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    description: z.string().min(1).max(1000).optional(),
    purpose: z.string().max(1000).nullable().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().min(0).max(100).optional(),
    approvalStatus: z.enum(["proposed", "approved", "rejected"]).optional(),
  })
  .strict()

export const pillarReorderSchema = z
  .object({
    orderedIds: z.array(z.string().cuid()).min(1).max(20),
  })
  .strict()

/** Content idea create/update */
export const ideaCreateSchema = z
  .object({
    title: z.string().min(1).max(200),
    concept: z.string().min(1).max(2000),
    platform: z.string().min(1).max(50),
    audience: z.string().min(1).max(300),
    objective: z.string().min(1).max(300),
    format: z.string().min(1).max(80),
    explanation: z.string().max(1000).optional(),
    contentPillarId: z.string().cuid().optional().nullable(),
  })
  .strict()

export const ideaPatchSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    concept: z.string().min(1).max(2000).optional(),
    platform: z.string().min(1).max(50).optional(),
    audience: z.string().min(1).max(300).optional(),
    objective: z.string().min(1).max(300).optional(),
    format: z.string().min(1).max(80).optional(),
    explanation: z.string().max(1000).nullable().optional(),
    contentPillarId: z.string().cuid().nullable().optional(),
    status: z.enum(["proposed", "saved", "rejected", "converted"]).optional(),
  })
  .strict()

/** Weekly planner */
export const planItemCreateSchema = z
  .object({
    contentIdeaId: z.string().cuid().optional(),
    contentDraftId: z.string().cuid().optional(),
    status: z.enum(["planned", "in_progress", "completed"]).optional(),
  })
  .refine((v) => Boolean(v.contentIdeaId || v.contentDraftId), {
    message: "contentIdeaId or contentDraftId is required",
  })

export const planItemPatchSchema = z
  .object({
    status: z.enum(["planned", "in_progress", "completed"]),
  })
  .strict()

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
  const flat = result.error.flatten()
  const fieldMessage = Object.entries(flat.fieldErrors)
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
    .join("; ")
  const formMessage = flat.formErrors.join("; ")
  const message =
    [fieldMessage, formMessage].filter(Boolean).join("; ") || "Validation failed"
  return {
    error: NextResponse.json(
      {
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: message,
      },
      { status: 400 }
    ),
  }
}
