import { z } from "zod"

/** Representative structured schema for content.review */
export const contentReviewSchema = z.object({
  score: z.number().min(0).max(1),
  note: z.string().min(1).max(500),
})

export type ContentReviewOutput = z.infer<typeof contentReviewSchema>

export const CONTENT_REVIEW_SCHEMA_VERSION = "content.review.v1"
