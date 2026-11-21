/**
 * Product Strategy API
 * 
 * Regenerate or update the marketing strategy for a product.
 * Strategy is automatically generated when a product is created,
 * but can be regenerated if the product profile changes.
 */

import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { ensureUserForClerkId } from "@/lib/users"
import { checkAiRateLimits } from "@/lib/rate-limit"
import { generateMarketingStrategy, formatStrategyForDisplay, type ProductType, type ProductStage, type SalesMotion } from "@/lib/strategy"
import { assembleBrandContext } from "@/lib/brand-context/assembler"

// GET /api/products/[id]/strategy - Get formatted strategy for display
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

    const user = await ensureUserForClerkId(clerkId)

    const product = await prisma.product.findFirst({
      where: { id, userId: user.id },
      include: { strategy: true },
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    if (!product.strategy) {
      return NextResponse.json({ error: "No strategy found" }, { status: 404 })
    }

    // Parse stored strategy (visualStyle optional for backward compat)
    const rawStrategy = {
      platforms: JSON.parse(product.strategy.platforms),
      contentTypes: JSON.parse(product.strategy.contentTypes),
      tone: JSON.parse(product.strategy.tone),
      ...(product.strategy.visualStyle
        ? { visualStyle: JSON.parse(product.strategy.visualStyle) }
        : {}),
      cadence: JSON.parse(product.strategy.cadence),
      proofTypes: JSON.parse(product.strategy.proofTypes),
      antiPatterns: JSON.parse(product.strategy.antiPatterns),
      summary: product.strategy.summary,
      reasoning: product.strategy.reasoning,
      confidence: product.strategy.confidence,
    }

    // Format for display
    const formatted = formatStrategyForDisplay(rawStrategy)

    return NextResponse.json({ 
      strategy: rawStrategy,
      formatted,
      generatedAt: product.strategy.generatedAt,
      confidence: product.strategy.confidence,
    })
  } catch (error) {
    console.error("Error fetching strategy:", error)
    return NextResponse.json(
      { error: "Failed to fetch strategy" },
      { status: 500 }
    )
  }
}

// POST /api/products/[id]/strategy - Regenerate strategy
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const user = await ensureUserForClerkId(clerkId)
    const rateLimit = await checkAiRateLimits(user.id)
    if (rateLimit) return rateLimit

    const product = await prisma.product.findFirst({
      where: { id, userId: user.id },
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Prefer approved brand summary when present; raw description stays untrusted at prompt layer
    let description = product.description || undefined
    try {
      const brandCtx = await assembleBrandContext({
        userId: user.id,
        productId: product.id,
        task: "strategy.generate",
      })
      description = brandCtx.approved.summary || brandCtx.untrusted.description
    } catch (e) {
      console.error("Brand context assemble failed:", e)
    }

    // Generate new strategy (metered via executeAi)
    const strategyOutput = await generateMarketingStrategy(
      {
        name: product.name,
        type: product.type as ProductType,
        industry: product.industry,
        audience: product.audience,
        audienceDetail: product.audienceDetail ?? undefined,
        stage: product.stage as ProductStage,
        salesMotion: product.salesMotion as SalesMotion,
        description,
        website: product.website || undefined,
        competitors: product.competitors || undefined,
      },
      user.tier,
      { userId: user.id, productId: product.id }
    )

    // Update or create strategy
    const strategy = await prisma.marketingStrategy.upsert({
      where: { productId: product.id },
      update: {
        platforms: JSON.stringify(strategyOutput.platforms),
        contentTypes: JSON.stringify(strategyOutput.contentTypes),
        tone: JSON.stringify(strategyOutput.tone),
        visualStyle: JSON.stringify(strategyOutput.visualStyle ?? { style: "diagram-only" }),
        cadence: JSON.stringify(strategyOutput.cadence),
        proofTypes: JSON.stringify(strategyOutput.proofTypes),
        antiPatterns: JSON.stringify(strategyOutput.antiPatterns),
        summary: strategyOutput.summary,
        reasoning: strategyOutput.reasoning,
        confidence: strategyOutput.confidence,
        generatedAt: new Date(),
      },
      create: {
        productId: product.id,
        platforms: JSON.stringify(strategyOutput.platforms),
        contentTypes: JSON.stringify(strategyOutput.contentTypes),
        tone: JSON.stringify(strategyOutput.tone),
        visualStyle: JSON.stringify(strategyOutput.visualStyle ?? { style: "diagram-only" }),
        cadence: JSON.stringify(strategyOutput.cadence),
        proofTypes: JSON.stringify(strategyOutput.proofTypes),
        antiPatterns: JSON.stringify(strategyOutput.antiPatterns),
        summary: strategyOutput.summary,
        reasoning: strategyOutput.reasoning,
        confidence: strategyOutput.confidence,
      },
    })

    const formatted = formatStrategyForDisplay(strategyOutput)

    return NextResponse.json({ 
      strategy: strategyOutput,
      formatted,
      generatedAt: strategy.generatedAt,
      confidence: strategy.confidence,
    })
  } catch (error) {
    console.error("Error regenerating strategy:", error)
    return NextResponse.json(
      { error: "Failed to regenerate strategy" },
      { status: 500 }
    )
  }
}
