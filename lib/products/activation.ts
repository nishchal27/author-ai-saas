/**
 * Active brand (product) selection helpers.
 * Newly created brands must always become active — including 2nd/Nth brands.
 */

import { db } from "@/lib/db"

export class ProductActivationError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.name = "ProductActivationError"
    this.status = status
  }
}

/**
 * Sets the user's activeProductId after verifying ownership.
 * Used by PATCH /api/products and after create when a client needs re-activation.
 */
export async function activateOwnedProduct(opts: {
  userId: string
  productId: string
}): Promise<string> {
  const product = await db.product.findFirst({
    where: { id: opts.productId, userId: opts.userId },
    select: { id: true },
  })
  if (!product) {
    throw new ProductActivationError("Product not found", 404)
  }

  await db.user.update({
    where: { id: opts.userId },
    data: { activeProductId: product.id },
  })

  return product.id
}

/**
 * After a successful product create for this user, always activate the new brand.
 * Ownership is implied by the create (product.userId === userId).
 */
export async function activateNewlyCreatedProduct(opts: {
  userId: string
  productId: string
}): Promise<string> {
  await db.user.update({
    where: { id: opts.userId },
    data: { activeProductId: opts.productId },
  })
  return opts.productId
}
