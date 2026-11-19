export type DeterministicCheckInput = {
  text: string
  platform?: string
  /** Strategy anti-pattern strings to soft-flag if present */
  avoidPatterns?: string[]
  /** Required substrings / fields that must appear (soft unless empty output) */
  requiredFields?: string[]
  /** Brand name for soft consistency check */
  brandName?: string
  /**
   * Approved fact texts used as an allow-list for hard factual claim patterns.
   * When set, detectable unsupported claim phrases are flagged if not grounded.
   */
  approvedFacts?: string[]
}

export type DeterministicCheckResult = {
  passed: boolean
  notes: string[]
}

const PROHIBITED_CLAIM =
  /\b(guaranteed|guarantee|certified|certification|100%\s*results?|proven\s+to\s+increase)\b/i

/** Detectable unsupported claim patterns (soft unless no approved facts at all and claim is strong) */
const UNSUPPORTED_FACT_CLAIM =
  /\b(ISO\s?\d+|SOC\s?2|HIPAA|GDPR[-\s]?certified|award[-\s]?winning|#[1１]|fortune\s*500|used by \d[\d,]+\+?\s*(customers|users|companies)|tested by \d[\d,]+)\b/i

const PLATFORM_SOFT_CAPS: Record<string, number> = {
  twitter: 2800, // allow threads / longer drafts; hard empty check elsewhere
  linkedin: 12000,
  facebook: 12000,
  blog: 100000,
}

function factsCorpus(facts: string[] | undefined): string {
  return (facts || []).join("\n").toLowerCase()
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

  if (input.requiredFields?.length) {
    for (const field of input.requiredFields) {
      if (field && !text.toLowerCase().includes(field.toLowerCase())) {
        notes.push(`Missing required field/signal: ${field}`)
      }
    }
  }

  // Brand-context consistency: if brand name is provided and text is long enough,
  // soft-flag when neither the brand name nor any approved fact token appears.
  if (input.brandName && text.length > 80) {
    const name = input.brandName.toLowerCase()
    const hasName = text.toLowerCase().includes(name)
    const corpus = factsCorpus(input.approvedFacts)
    const hasFactEcho =
      input.approvedFacts?.some((f) => {
        const token = f.trim().split(/\s+/).slice(0, 4).join(" ").toLowerCase()
        return token.length > 3 && text.toLowerCase().includes(token)
      }) ?? false
    if (!hasName && !hasFactEcho && corpus.length > 0) {
      notes.push("Brand-context consistency: draft may not reference brand or approved facts")
    }
  }

  // Unsupported factual claims vs allow-list
  const claimMatch = text.match(UNSUPPORTED_FACT_CLAIM)
  if (claimMatch) {
    const corpus = factsCorpus(input.approvedFacts)
    const grounded = corpus.includes(claimMatch[0].toLowerCase())
    if (!grounded) {
      notes.push(
        `Unsupported factual claim where detectable: "${claimMatch[0]}" not in approved brand facts`
      )
    }
  }

  // Near-empty / placeholder detection
  if (/^(lorem ipsum|todo|placeholder|test)\b/i.test(text)) {
    notes.push("Output looks like placeholder text")
    return { passed: false, notes }
  }

  // Incomplete structured JSON markers
  if (/"missingInformation"\s*:\s*\[\s*\]/.test(text) === false && /"TODO_FILL"/.test(text)) {
    notes.push("Output contains incomplete TODO_FILL markers")
    return { passed: false, notes }
  }

  // Fail only on hard issues; soft notes still pass
  const hardFail = notes.some(
    (n) =>
      n.includes("empty") ||
      n.includes("placeholder") ||
      n.includes("unusually short") ||
      n.includes("TODO_FILL") ||
      n.includes("Missing required field")
  )

  return { passed: !hardFail, notes }
}

/**
 * AI review policy — selective, not every request.
 * Blog drafts may opt in; explicit forceAiReview always wins when not skipped.
 */
export function shouldRunAiReview(opts: {
  qualityPolicy: string
  forceAiReview?: boolean
  skipAiReview?: boolean
  contentType?: string
}): boolean {
  if (opts.skipAiReview) return false
  if (opts.forceAiReview) return true
  if (opts.qualityPolicy !== "deterministic_then_optional_review") return false
  // Selective: blog only by default
  return (opts.contentType || "").toLowerCase() === "blog"
}
