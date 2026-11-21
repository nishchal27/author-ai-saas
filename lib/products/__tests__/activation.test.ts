import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  activateNewlyCreatedProduct,
  activateOwnedProduct,
  ProductActivationError,
} from "@/lib/products/activation"

const productFindFirst = vi.fn()
const userUpdate = vi.fn()

vi.mock("@/lib/db", () => ({
  db: {
    product: {
      findFirst: (...args: unknown[]) => productFindFirst(...args),
    },
    user: {
      update: (...args: unknown[]) => userUpdate(...args),
    },
  },
}))

describe("product activation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("activates the first newly created brand", async () => {
    userUpdate.mockResolvedValue({ id: "u1", activeProductId: "p1" })
    const id = await activateNewlyCreatedProduct({
      userId: "u1",
      productId: "p1",
    })
    expect(id).toBe("p1")
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { activeProductId: "p1" },
    })
  })

  it("activates the second newly created brand (not gated on productCount)", async () => {
    userUpdate.mockResolvedValue({ id: "u1", activeProductId: "p2" })
    const id = await activateNewlyCreatedProduct({
      userId: "u1",
      productId: "p2",
    })
    expect(id).toBe("p2")
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { activeProductId: "p2" },
    })
  })

  it("activates the third newly created brand", async () => {
    userUpdate.mockResolvedValue({ id: "u1", activeProductId: "p3" })
    await activateNewlyCreatedProduct({ userId: "u1", productId: "p3" })
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { activeProductId: "p3" },
    })
  })

  it("rejects activating a brand the user does not own", async () => {
    productFindFirst.mockResolvedValue(null)
    await expect(
      activateOwnedProduct({ userId: "u1", productId: "other_brand" })
    ).rejects.toBeInstanceOf(ProductActivationError)
    expect(userUpdate).not.toHaveBeenCalled()
  })

  it("switches active brand only after ownership check", async () => {
    productFindFirst.mockResolvedValue({ id: "p2" })
    userUpdate.mockResolvedValue({ id: "u1", activeProductId: "p2" })
    const id = await activateOwnedProduct({ userId: "u1", productId: "p2" })
    expect(id).toBe("p2")
    expect(productFindFirst).toHaveBeenCalledWith({
      where: { id: "p2", userId: "u1" },
      select: { id: true },
    })
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { activeProductId: "p2" },
    })
  })
})
