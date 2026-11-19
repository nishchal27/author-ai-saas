import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  approvePillar,
  createPillar,
  PillarDomainError,
  updatePillar,
} from "@/lib/pillars/service"

const productFindFirst = vi.fn()
const pillarFindFirst = vi.fn()
const pillarCreate = vi.fn()
const pillarUpdate = vi.fn()
const pillarAggregate = vi.fn()

vi.mock("@/lib/db", () => ({
  db: {
    product: { findFirst: (...a: unknown[]) => productFindFirst(...a) },
    contentPillar: {
      findFirst: (...a: unknown[]) => pillarFindFirst(...a),
      create: (...a: unknown[]) => pillarCreate(...a),
      update: (...a: unknown[]) => pillarUpdate(...a),
      aggregate: (...a: unknown[]) => pillarAggregate(...a),
    },
  },
}))

describe("pillar domain service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("requires product ownership to create pillars", async () => {
    productFindFirst.mockResolvedValue(null)
    await expect(
      createPillar({
        userId: "u1",
        productId: "p_missing",
        name: "Craft",
        description: "Handmade stories",
      })
    ).rejects.toBeInstanceOf(PillarDomainError)
  })

  it("creates user pillars as approved by default when requested", async () => {
    productFindFirst.mockResolvedValue({ id: "p1" })
    pillarAggregate.mockResolvedValue({ _max: { sortOrder: 1 } })
    pillarCreate.mockResolvedValue({
      id: "pil_1",
      approvalStatus: "approved",
      isActive: true,
    })

    const pillar = await createPillar({
      userId: "u1",
      productId: "p1",
      name: "Education",
      description: "Teach buyers",
      purpose: "Build trust",
      source: "user",
      approvalStatus: "approved",
    })

    expect(pillarCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "u1",
        productId: "p1",
        approvalStatus: "approved",
        sortOrder: 2,
      }),
    })
    expect(pillar.id).toBe("pil_1")
  })

  it("approves proposed pillars without auto-approve on create path", async () => {
    pillarFindFirst.mockResolvedValue({
      id: "pil_2",
      userId: "u1",
      productId: "p1",
      approvalStatus: "proposed",
    })
    pillarUpdate.mockResolvedValue({
      id: "pil_2",
      approvalStatus: "approved",
      isActive: true,
    })

    const pillar = await approvePillar({
      userId: "u1",
      productId: "p1",
      pillarId: "pil_2",
    })
    expect(pillar.approvalStatus).toBe("approved")
  })

  it("denies updates across brands", async () => {
    pillarFindFirst.mockResolvedValue(null)
    await expect(
      updatePillar({
        userId: "u1",
        productId: "other",
        pillarId: "pil_2",
        name: "Hijack",
      })
    ).rejects.toMatchObject({ status: 404 })
  })
})
