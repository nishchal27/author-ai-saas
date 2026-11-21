import { describe, expect, it } from "vitest"
import {
  canSubmitOnboardingCreate,
  createEmptyOnboardingForm,
  ONBOARDING_TOTAL_STEPS,
  shouldResetWizardOnOpenChange,
} from "@/lib/onboarding/wizard-state"
import { clearBrandScopedQueries, BRAND_SCOPED_QUERY_ROOTS } from "@/lib/query-keys"

describe("onboarding wizard state", () => {
  it("creates an empty form with no prior brand data", () => {
    const form = createEmptyOnboardingForm()
    expect(form.name).toBe("")
    expect(form.type).toBe("")
    expect(form.industry).toBe("")
    expect(form.audience).toBe("")
    expect(form.stage).toBe("")
    expect(form.salesMotion).toBe("")
    expect(form.website).toBe("")
  })

  it("resets only when the dialog transitions from closed to open", () => {
    expect(shouldResetWizardOnOpenChange(false, true)).toBe(true)
    expect(shouldResetWizardOnOpenChange(true, true)).toBe(false)
    expect(shouldResetWizardOnOpenChange(true, false)).toBe(false)
    expect(shouldResetWizardOnOpenChange(false, false)).toBe(false)
  })

  it("blocks duplicate final-step submits while a request is pending", () => {
    expect(
      canSubmitOnboardingCreate({
        step: ONBOARDING_TOTAL_STEPS - 1,
        isPending: true,
      })
    ).toBe(false)
    expect(
      canSubmitOnboardingCreate({
        step: ONBOARDING_TOTAL_STEPS - 1,
        isPending: false,
      })
    ).toBe(true)
    expect(
      canSubmitOnboardingCreate({
        step: 0,
        isPending: false,
      })
    ).toBe(false)
  })
})

describe("brand-scoped query clearing", () => {
  it("removes all brand-scoped roots and invalidates products", () => {
    const removed: string[][] = []
    const invalidated: unknown[][] = []
    clearBrandScopedQueries({
      removeQueries: ({ queryKey }) => {
        removed.push([...queryKey])
      },
      invalidateQueries: ({ queryKey }) => {
        invalidated.push([...queryKey])
      },
    })
    expect(removed).toEqual(BRAND_SCOPED_QUERY_ROOTS.map((r) => [r]))
    expect(invalidated).toEqual([["products"]])
  })
})
