export type DraftListScope = "active" | "all"

export function parseDraftListScope(
  raw: string | null | undefined
): DraftListScope | null {
  const scope = (raw || "active").toLowerCase()
  if (scope === "active" || scope === "all") return scope
  return null
}

/**
 * Resolve which productId filter to apply for draft listing.
 * scope=active never returns other brands' drafts — empty if no active brand.
 * Unknown scopes must be rejected by the caller (do not fall through to all).
 */
export function resolveDraftProductFilter(opts: {
  scope: DraftListScope | string
  activeProductId: string | null | undefined
  requestedProductId?: string | null
  ownedRequestedProductId?: string | null
}): { productId: string | null; empty: boolean } {
  if (opts.requestedProductId) {
    if (!opts.ownedRequestedProductId) {
      return { productId: null, empty: true }
    }
    return { productId: opts.ownedRequestedProductId, empty: false }
  }
  if (opts.scope === "active") {
    if (!opts.activeProductId) {
      return { productId: null, empty: true }
    }
    return { productId: opts.activeProductId, empty: false }
  }
  if (opts.scope === "all") {
    return { productId: null, empty: false }
  }
  // Unknown scope — treat as empty (caller should 400 before this).
  return { productId: null, empty: true }
}
