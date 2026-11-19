/**
 * Central TanStack Query keys for brand-scoped dashboard data.
 * Always include productId when the resource belongs to a brand.
 */

export const queryKeys = {
  products: ["products"] as const,
  settings: ["settings"] as const,
  usage: ["usage"] as const,
  guide: (productId?: string | null) =>
    ["guide", "next", productId ?? "none"] as const,
  brand: (productId: string) => ["brand", productId] as const,
  suggestions: (productId: string) => ["suggestions", productId] as const,
  pillars: (productId: string) => ["pillars", productId] as const,
  ideas: (productId: string, status?: string) =>
    status
      ? (["ideas", productId, status] as const)
      : (["ideas", productId] as const),
  strategy: (productId: string) => ["strategy", productId] as const,
  plan: (productId: string, weekStart?: string) =>
    weekStart
      ? (["plan", productId, weekStart] as const)
      : (["plan", productId] as const),
  drafts: (scope?: string) =>
    scope ? (["drafts", scope] as const) : (["drafts"] as const),
  product: (productId: string) => ["product", productId] as const,
}

/** Invalidate all brand-scoped caches after switching active product. */
export const BRAND_SCOPED_QUERY_ROOTS = [
  "brand",
  "suggestions",
  "pillars",
  "ideas",
  "strategy",
  "plan",
  "guide",
  "drafts",
  "product",
  "activities",
  "insights",
] as const
