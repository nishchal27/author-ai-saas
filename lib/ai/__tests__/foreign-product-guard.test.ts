import { describe, expect, it } from "vitest"

/**
 * Documents the ownership contract for AI routes that accept productId:
 * a foreign id must not be persisted or used for BrandContextAssembler.
 * Route-level behavior is covered by explicit 404 returns when findFirst
 * with { id, userId } misses — this unit asserts the predicate helpers.
 */
export function resolveOwnedProductId(
  requestedId: string | null | undefined,
  ownedIds: Set<string>
): string | null {
  if (!requestedId) return null
  return ownedIds.has(requestedId) ? requestedId : null
}

describe("foreign product ID rejection", () => {
  it("rejects product ids not in the owned set", () => {
    const owned = new Set(["prod_mine"])
    expect(resolveOwnedProductId("prod_foreign", owned)).toBeNull()
    expect(resolveOwnedProductId("prod_mine", owned)).toBe("prod_mine")
    expect(resolveOwnedProductId(null, owned)).toBeNull()
  })
})
