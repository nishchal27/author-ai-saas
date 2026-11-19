export type DeterministicCheckInput = {
  text: string
  platform?: string
  /** Strategy anti-pattern strings to soft-flag if present */
  avoidPatterns?: string[]
}

export type DeterministicCheckResult = {
  passed: boolean
  notes: string[]
}

const PROHIBITED_CLAIM =
  /\b(guaranteed|guarantee|certified|certification|100%\s*results?|proven\s+to\s+increase)\b/i

const PLATFORM_SOFT_CAPS: Record<string, number> = {
  twitter: 2800, // allow threads / longer drafts; hard empty check elsewhere
  linkedin: 12000,
  facebook: 12000,
  blog: 100000,
}

/**
 * Deterministic quality checks run by default after generation.
 * These do not call a model.
 */
export function runDeterministicChecks(input: DeterministicCheckInput): DeterministicCheckResult {
  const notes: string[] = []
  const text = input.text?.trim() ?? ""

  if (!text) {
    notes.push("Output is empty")
    return { passed: false, notes }
  }

  if (text.length < 20) {
    notes.push("Output is unusually short")
  }

  const cap = input.platform ? PLATFORM_SOFT_CAPS[input.platform.toLowerCase()] : undefined
  if (cap && text.length > cap) {
    notes.push(`Output exceeds soft length budget for ${input.platform}`)
  }

  if (PROHIBITED_CLAIM.test(text)) {
    notes.push("Possible prohibited claim language detected (guarantee/certification style)")
  }

  if (input.avoidPatterns?.length) {
    for (const pattern of input.avoidPatterns) {
      if (pattern && text.toLowerCase().includes(pattern.toLowerCase())) {
        notes.push(`Mentions avoided pattern: ${pattern}`)
      }
    }
  }

  // Near-empty / placeholder detection
  if (/^(lorem ipsum|todo|placeholder|test)\b/i.test(text)) {
    notes.push("Output looks like placeholder text")
    return { passed: false, notes }
  }

  // Fail only on hard issues; soft notes still pass
  const hardFail = notes.some(
    (n) =>
      n.includes("empty") ||
      n.includes("placeholder") ||
      n.includes("unusually short")
  )

  return { passed: !hardFail, notes }
}
