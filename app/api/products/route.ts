/**
 * Products API
 *
 * Manages brand/product profiles. Creating a brand must succeed without an AI
 * provider — strategy generation uses heuristics (and optional AI refinement).
 */

import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { ensureUserForClerkId } from "@/lib/users"
import { parseBody, productCreateSchema, activeProductSchema } from "@/lib/validation"
import {
  generateMarketingStrategy,
  type ProductType,
  type ProductStage,
  type SalesMotion,
} from "@/lib/strategy"
import {
  activateNewlyCreatedProduct,
  activateOwnedProduct,
  ProductActivationError,
} from "@/lib/products/activation"
import { checkDailyAiCap, checkRateLimit } from "@/lib/rate-limit"
import { hasAnyAiProviderKey } from "@/lib/env"

// GET /api/products - Get all products for user
export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await ensureUserForClerkId(clerkId)
    const withProducts = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        products: {
          include: { strategy: true },
          orderBy: { createdAt: "desc" },
        },
      },
    })
    if (!withProducts) {
      return NextResponse.json({ products: [], activeProductId: null })
    }

    return NextResponse.json({
      products: withProducts.products,
      activeProductId: withProducts.activeProductId,
    })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    )
  }
}

// POST /api/products - Create a new product (AI strategy optional / fallback)
export async function POST(request: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await ensureUserForClerkId(clerkId)

    const raw = await request.json().catch(() => null)
    const parsed = parseBody(raw, productCreateSchema)
    if ("error" in parsed) return parsed.error

    const {
      name,
      type,
      industry,
      audience,
      audienceDetail,
      stage,
      salesMotion,
      businessModel,
      description,
      website,
      competitors,
    } = parsed.data

    const product = await prisma.product.create({
      data: {
        userId: user.id,
        name,
        type,
        industry,
        audience,
        audienceDetail: audienceDetail ?? undefined,
        stage,
        salesMotion,
        businessModel: businessModel || null,
        description: description ?? undefined,
        website: website || undefined,
        competitors: competitors ?? undefined,
      },
    })

    let strategy = null
    let strategyGenerated = false
    try {
      // Brand create always succeeds. AI refine is optional and rate-limited.
      // When capped / unconfigured, heuristics run without a provider call.
      let aiBlocked = !hasAnyAiProviderKey()
      if (!aiBlocked) {
        const dailyBlocked = await checkDailyAiCap(user.id)
        const burstBlocked = dailyBlocked ? null : checkRateLimit(user.id)
        aiBlocked = Boolean(dailyBlocked || burstBlocked)
      }

      const strategyOutput = await generateMarketingStrategy(
        {
          name,
          type: type as ProductType,
          industry,
          audience,
          audienceDetail: audienceDetail ?? undefined,
          stage: stage as ProductStage,
          salesMotion: salesMotion as SalesMotion,
          description: description ?? undefined,
          website: website ?? undefined,
          competitors: competitors ?? undefined,
        },
        user.tier,
        {
          userId: user.id,
          productId: product.id,
          skipAi: aiBlocked,
        }
      )

      strategy = await prisma.marketingStrategy.create({
        data: {
          productId: product.id,
          platforms: JSON.stringify(strategyOutput.platforms),
          contentTypes: JSON.stringify(strategyOutput.contentTypes),
          tone: JSON.stringify(strategyOutput.tone),
          visualStyle: JSON.stringify(
            strategyOutput.visualStyle ?? { style: "diagram-only" }
          ),
          cadence: JSON.stringify(strategyOutput.cadence),
          proofTypes: JSON.stringify(strategyOutput.proofTypes),
          antiPatterns: JSON.stringify(strategyOutput.antiPatterns),
          summary: strategyOutput.summary,
          reasoning: strategyOutput.reasoning,
          confidence: strategyOutput.confidence,
        },
      })
      strategyGenerated = !aiBlocked && strategyOutput.confidence > 0.6
    } catch (strategyError) {
      // Brand create must not fail when AI is unavailable
      console.error("Strategy generation skipped:", strategyError)
    }

    // Always activate the newly created brand (1st, 2nd, Nth).
    const activeProductId = await activateNewlyCreatedProduct({
      userId: user.id,
      productId: product.id,
    })

    return NextResponse.json(
      {
        product: {
          ...product,
          strategy,
        },
        activeProductId,
        strategyGenerated,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    )
  }
}

// PATCH /api/products - Set active product
export async function PATCH(request: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const raw = await request.json().catch(() => null)
    const parsed = parseBody(raw, activeProductSchema)
    if ("error" in parsed) return parsed.error
    const { activeProductId } = parsed.data

    let user
    try {
      user = await ensureUserForClerkId(clerkId)
    } catch {
      return NextResponse.json({ error: "User not found" }, { status: 500 })
    }

    if (activeProductId) {
      try {
        await activateOwnedProduct({
          userId: user.id,
          productId: activeProductId,
        })
      } catch (err) {
        if (err instanceof ProductActivationError) {
          return NextResponse.json(
            { error: err.message },
            { status: err.status }
          )
        }
        throw err
      }
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { activeProductId: null },
      })
    }

    return NextResponse.json({ success: true, activeProductId })
  } catch (error) {
    console.error("Error updating active product:", error)
    return NextResponse.json(
      { error: "Failed to update active product" },
      { status: 500 }
    )
  }
}
