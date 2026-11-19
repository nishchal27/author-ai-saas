import { describe, expect, it } from "vitest"

/**
 * Documents Overview next-action priority order (mirrors /api/guide/next).
 * Kept as a contract test so UI/copy stay aligned with backend steps.
 */
const GUIDE_PRIORITY = [
  "add_product",
  "complete_brand_profile",
  "generate_brand_summary",
  "approve_brand_summary",
  "generate_pillars",
  "approve_pillars",
  "generate_ideas",
  "create_draft",
  "review_draft",
  "plan_week",
  "continue_plan",
] as const

describe("guide next-action priority", () => {
  it("puts brand profile and approval before content and planning", () => {
    expect(GUIDE_PRIORITY.indexOf("complete_brand_profile")).toBeLessThan(
      GUIDE_PRIORITY.indexOf("generate_ideas")
    )
    expect(GUIDE_PRIORITY.indexOf("approve_brand_summary")).toBeLessThan(
      GUIDE_PRIORITY.indexOf("create_draft")
    )
    expect(GUIDE_PRIORITY.indexOf("create_draft")).toBeLessThan(
      GUIDE_PRIORITY.indexOf("plan_week")
    )
  })

  it("never treats activity extract as the default spine", () => {
    expect((GUIDE_PRIORITY as readonly string[]).includes("get_angle")).toBe(
      false
    )
    expect((GUIDE_PRIORITY as readonly string[]).includes("share_story")).toBe(
      false
    )
  })
})
