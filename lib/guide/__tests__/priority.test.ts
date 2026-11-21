import { describe, expect, it } from "vitest"
import {
  GUIDE_PRIORITY,
  resolveGuideNextStep,
} from "@/lib/guide/next-step"

describe("guide next-action priority", () => {
  it("puts brand profile and approval before content and planning", () => {
    expect(GUIDE_PRIORITY.indexOf("complete_brand_profile")).toBeLessThan(
      GUIDE_PRIORITY.indexOf("generate_ideas")
    )
    expect(GUIDE_PRIORITY.indexOf("approve_brand_context")).toBeLessThan(
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

  it("does not require AI generation to progress past brand context", () => {
    expect(
      (GUIDE_PRIORITY as readonly string[]).includes("generate_brand_summary")
    ).toBe(false)

    const needApprove = resolveGuideNextStep({
      id: "p1",
      name: "Craft Co",
      description: "Handmade jewellery",
      brandProfileStatus: "incomplete",
      brandSummaryApproved: null,
    })
    expect(needApprove.step).toBe("approve_brand_context")
    expect(needApprove.reason.toLowerCase()).toContain("manual")

    const approved = resolveGuideNextStep(
      {
        id: "p1",
        name: "Craft Co",
        description: "Handmade jewellery",
        brandProfileStatus: "approved",
        brandSummaryApproved: "Assam craft jewellery for gift buyers",
      },
      {
        pillarCount: 0,
        approvedPillarCount: 0,
        ideaCount: 0,
        ideaNeedingDraft: null,
        pendingDraft: null,
        planItemCount: 0,
      }
    )
    expect(approved.step).toBe("generate_pillars")
  })

  it("recognizes a waiting proposed summary for approval", () => {
    const next = resolveGuideNextStep({
      id: "p1",
      name: "Craft Co",
      description: "Handmade jewellery",
      brandProfileStatus: "proposed",
      brandSummaryApproved: null,
    })
    expect(next.step).toBe("approve_brand_summary")
  })
})
