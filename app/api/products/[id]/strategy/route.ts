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
import { generateMarketingStrategy, formatStrategyForDisplay } from "@/lib/strategy"

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

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

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

    // Parse stored strategy
    const rawStrategy = {
      platforms: JSON.parse(product.strategy.platforms),
      contentTypes: JSON.parse(product.strategy.contentTypes),
      tone: JSON.parse(product.strategy.tone),
      visualStyle: JSON.parse(product.strategy.visualStyle),
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

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const product = await prisma.product.findFirst({
      where: { id, userId: user.id },
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Generate new strategy
    const strategyOutput = await generateMarketingStrategy({
      name: product.name,
      type: product.type as any,
      industry: product.industry,
      audience: product.audience,
      audienceDetail: product.audienceDetail ?? undefined,
      stage: product.stage as any,
      salesMotion: product.salesMotion as any,
      description: product.description || undefined,
      website: product.website || undefined,
      competitors: product.competitors || undefined,
    }, user.tier)

    // Update or create strategy
    const strategy = await prisma.marketingStrategy.upsert({
      where: { productId: product.id },
      update: {
        platforms: JSON.stringify(strategyOutput.platforms),
        contentTypes: JSON.stringify(strategyOutput.contentTypes),
        tone: JSON.stringify(strategyOutput.tone),
        visualStyle: JSON.stringify(strategyOutput.visualStyle),
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
        visualStyle: JSON.stringify(strategyOutput.visualStyle),
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
