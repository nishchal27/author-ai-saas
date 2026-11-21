import { describe, expect, it } from "vitest"
import { shiftWeekIso, weekStartUtc } from "@/lib/planner/dates"

describe("planner dates", () => {
  it("normalizes to UTC Monday", () => {
    expect(weekStartUtc(new Date("2026-11-19T15:00:00.000Z")).toISOString()).toBe(
      "2026-11-16T00:00:00.000Z"
    )
  })

  it("shifts weeks by ISO Monday", () => {
    const start = "2026-11-16T00:00:00.000Z"
    expect(shiftWeekIso(start, 1)).toBe("2026-11-23T00:00:00.000Z")
    expect(shiftWeekIso(start, -1)).toBe("2026-11-09T00:00:00.000Z")
  })
})
