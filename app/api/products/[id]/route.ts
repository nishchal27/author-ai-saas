/**
 * Single Product API
 * 
 * Get, update, or delete a specific product.
 */

import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"

// GET /api/products/[id] - Get a specific product with its strategy
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const product = await prisma.product.findFirst({
      where: { id, userId: user.id },
      include: {
        strategy: true,
        _count: {
          select: {
            activities: true,
            insights: true,
            contentDrafts: true,
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error("Error fetching product:", error)
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    )
  }
}

// PATCH /api/products/[id] - Update a product
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify ownership
    const existingProduct = await prisma.product.findFirst({
      where: { id, userId: user.id },
    })
    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const { name, type, industry, audience, audienceDetail, stage, salesMotion, description, website, competitors, isActive, techStack } = body

    const techStackJson =
      techStack !== undefined
        ? Array.isArray(techStack)
          ? JSON.stringify(techStack)
          : typeof techStack === "string"
            ? techStack
            : undefined
        : undefined

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(industry !== undefined && { industry }),
        ...(stage !== undefined && { stage }),
        ...(audience !== undefined && { audience }),
        ...(audienceDetail !== undefined && { audienceDetail }),
        ...(salesMotion !== undefined && { salesMotion }),
        ...(description !== undefined && { description }),
        ...(website !== undefined && { website }),
        ...(competitors !== undefined && { competitors }),
        ...(isActive !== undefined && { isActive }),
        ...(techStackJson !== undefined && { techStackJson }),
      },
      include: {
        strategy: true,
      },
    })

    return NextResponse.json({ product })
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    )
  }
}

// DELETE /api/products/[id] - Delete a product
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify ownership
    const product = await prisma.product.findFirst({
      where: { id, userId: user.id },
    })
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    await prisma.product.delete({ where: { id } })

    // If this was the active product, clear it
    if (user.activeProductId === id) {
      // Set another product as active, or null
      const anotherProduct = await prisma.product.findFirst({
        where: { userId: user.id },
      })
      await prisma.user.update({
        where: { id: user.id },
        data: { activeProductId: anotherProduct?.id || null },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    )
  }
}
