/**
 * Pure helpers for ProductOnboarding wizard state.
 * Keeps reset / submit guards testable without mounting React.
 */

export type OnboardingFormData = {
  name: string
  type: string
  industry: string
  businessModel: string
  audience: string
  customAudienceText: string
  audienceDetail: string
  stage: string
  salesMotion: string
  description: string
  website: string
}

export const ONBOARDING_TOTAL_STEPS = 5

export function createEmptyOnboardingForm(): OnboardingFormData {
  return {
    name: "",
    type: "",
    industry: "",
    businessModel: "",
    audience: "",
    customAudienceText: "",
    audienceDetail: "",
    stage: "",
    salesMotion: "",
    description: "",
    website: "",
  }
}

/** Reset wizard whenever the dialog transitions to open. */
export function shouldResetWizardOnOpenChange(
  previouslyOpen: boolean,
  currentlyOpen: boolean
): boolean {
  return !previouslyOpen && currentlyOpen
}

/**
 * Final-step submit is allowed only when not already in flight.
 * Prevents duplicate brand creation from double-clicks.
 */
export function canSubmitOnboardingCreate(opts: {
  step: number
  totalSteps?: number
  isPending: boolean
}): boolean {
  const total = opts.totalSteps ?? ONBOARDING_TOTAL_STEPS
  if (opts.isPending) return false
  return opts.step === total - 1
}
