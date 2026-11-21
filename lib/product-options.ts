/**
 * Shared brand / product classification options for onboarding and Brand Studio.
 * Values persist on Product.type, Product.industry, Product.salesMotion, Product.businessModel, Product.stage.
 */

export const PRODUCT_TYPES = [
  { value: "saas", label: "SaaS / Software", description: "Web or mobile application" },
  { value: "course", label: "Course / Education", description: "Online learning product" },
  { value: "coaching", label: "Coaching / Consulting", description: "1:1 or group services" },
  { value: "physical", label: "Physical Product", description: "Tangible goods" },
  { value: "event", label: "Event / Workshop", description: "Live or virtual events" },
  { value: "api", label: "API / Infrastructure", description: "Developer tools" },
  { value: "service", label: "Service Business", description: "Professional services" },
  { value: "ngo", label: "NGO / Non-profit", description: "Social impact" },
  { value: "other", label: "Other", description: "Doesn’t fit the list" },
] as const

export type ProductTypeValue = (typeof PRODUCT_TYPES)[number]["value"]

/** Industry / category — not a sales channel or business model. */
export const INDUSTRIES = [
  { value: "fashion_apparel", label: "Fashion & Apparel" },
  { value: "beauty_personal_care", label: "Beauty & Personal Care" },
  { value: "food_beverage", label: "Food & Beverage" },
  { value: "health_fitness", label: "Health & Fitness" },
  { value: "technology", label: "Technology" },
  { value: "education", label: "Education" },
  { value: "home_lifestyle", label: "Home & Lifestyle" },
  { value: "retail_ecommerce", label: "Retail & Ecommerce" },
  { value: "professional_services", label: "Professional Services" },
  { value: "other", label: "Other" },
] as const

export type IndustryValue = (typeof INDUSTRIES)[number]["value"]

/** How the business makes money / who it sells to — distinct from product type and sales approach. */
export const BUSINESS_MODELS = [
  { value: "dtc", label: "Direct-to-consumer", description: "Sell directly to customers" },
  { value: "b2b", label: "Business-to-business", description: "Sell to other businesses" },
  { value: "b2c", label: "Business-to-consumer", description: "Consumer brand via retail or web" },
  { value: "subscription", label: "Subscription", description: "Recurring membership or plan" },
  { value: "marketplace", label: "Marketplace", description: "Connect buyers and sellers" },
  { value: "service_based", label: "Service-based", description: "Deliver services for a fee" },
  { value: "other", label: "Other", description: "Another model" },
] as const

export type BusinessModelValue = (typeof BUSINESS_MODELS)[number]["value"]

/** How customers typically buy / convert — not the same as industry or business model. */
export const SALES_APPROACHES = [
  { value: "self_serve", label: "Self-Serve", description: "Users sign up themselves" },
  { value: "demo", label: "Demo → Subscribe", description: "Sales calls or demos" },
  { value: "creator_led", label: "Creator-Led", description: "Personal brand drives sales" },
  { value: "enterprise", label: "Enterprise", description: "Long sales cycles" },
  { value: "impulse", label: "Impulse", description: "Quick purchase decisions" },
] as const

export type SalesApproachValue = (typeof SALES_APPROACHES)[number]["value"]

export const PRODUCT_STAGES = [
  { value: "idea", label: "Idea", description: "Still planning" },
  { value: "building", label: "Building", description: "In development" },
  { value: "launched", label: "Launched", description: "Just shipped" },
  { value: "growing", label: "Growing", description: "Active customers" },
  { value: "mature", label: "Mature", description: "Established" },
] as const

export type ProductStageValue = (typeof PRODUCT_STAGES)[number]["value"]

export const AUDIENCE_TYPES = [
  { value: "developers", label: "Developers", description: "Technical builders" },
  { value: "smb_owners", label: "Small Business Owners", description: "SMB decision makers" },
  { value: "consumers", label: "Consumers", description: "General public" },
  { value: "professionals", label: "Professionals", description: "Career-focused individuals" },
  { value: "learners", label: "Learners", description: "Students or career switchers" },
  { value: "enterprise", label: "Enterprise Teams", description: "Corporate buyers" },
  { value: "creators", label: "Creators", description: "Content creators" },
  { value: "custom", label: "Other", description: "My audience isn’t listed" },
] as const

export function labelFor(
  options: readonly { value: string; label: string }[],
  value: string | null | undefined,
  fallback = value || "—"
) {
  if (!value) return fallback
  return options.find((o) => o.value === value)?.label ?? value
}

/** Map legacy free-text industry strings to a known option when possible. */
export function normalizeIndustry(raw: string | null | undefined): string {
  if (!raw) return ""
  const lower = raw.trim().toLowerCase()
  const exact = INDUSTRIES.find((i) => i.value === lower)
  if (exact) return exact.value
  const byLabel = INDUSTRIES.find((i) => i.label.toLowerCase() === lower)
  if (byLabel) return byLabel.value
  // Legacy free-text → closest bucket
  if (/fashion|apparel|clothing|jewellery|jewelry/.test(lower)) return "fashion_apparel"
  if (/beauty|skincare|cosmetic/.test(lower)) return "beauty_personal_care"
  if (/food|beverage|restaurant|cafe/.test(lower)) return "food_beverage"
  if (/health|fitness|wellness/.test(lower)) return "health_fitness"
  if (/tech|devtools|saas|software|developer/.test(lower)) return "technology"
  if (/educat|course|learn/.test(lower)) return "education"
  if (/home|lifestyle|handmade/.test(lower)) return "home_lifestyle"
  if (/retail|e-?commerce|ecommerce|shop/.test(lower)) return "retail_ecommerce"
  if (/consult|professional|agency|service/.test(lower)) return "professional_services"
  if (INDUSTRIES.some((i) => i.value === raw)) return raw
  return "other"
}
