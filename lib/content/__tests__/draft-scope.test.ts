import { describe, expect, it } from "vitest"
import {
  parseDraftListScope,
  resolveDraftProductFilter,
} from "@/lib/content/draft-scope"

describe("draft product scoping", () => {
  it("scopes active list to the active brand only", () => {
    expect(
      resolveDraftProductFilter({
        scope: "active",
        activeProductId: "p1",
      })
    ).toEqual({ productId: "p1", empty: false })
  })

  it("returns empty for active scope when no active brand (no cross-brand leak)", () => {
    expect(
      resolveDraftProductFilter({
        scope: "active",
        activeProductId: null,
      })
    ).toEqual({ productId: null, empty: true })
  })

  it("allows explicit all-brands scope without product filter", () => {
    expect(
      resolveDraftProductFilter({
        scope: "all",
        activeProductId: null,
      })
    ).toEqual({ productId: null, empty: false })
  })

  it("allows explicit owned productId override", () => {
    expect(
      resolveDraftProductFilter({
        scope: "all",
        activeProductId: "p1",
        requestedProductId: "p2",
        ownedRequestedProductId: "p2",
      })
    ).toEqual({ productId: "p2", empty: false })
  })

  it("rejects unowned productId requests as empty", () => {
    expect(
      resolveDraftProductFilter({
        scope: "active",
        activeProductId: "p1",
        requestedProductId: "stolen",
        ownedRequestedProductId: null,
      })
    ).toEqual({ productId: null, empty: true })
  })

  it("does not treat unknown scope as all-brands", () => {
    expect(parseDraftListScope("everything")).toBeNull()
    expect(
      resolveDraftProductFilter({
        scope: "everything",
        activeProductId: "p1",
      })
    ).toEqual({ productId: null, empty: true })
  })

  it("parses only active and all scopes", () => {
    expect(parseDraftListScope(null)).toBe("active")
    expect(parseDraftListScope("ALL")).toBe("all")
    expect(parseDraftListScope("active")).toBe("active")
  })
})

