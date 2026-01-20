import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { generateContent, ProductContext, StrategyContext } from "@/lib/claude"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { insightId, type, platform, productId } = body

    if (!insightId || !type) {
      return NextResponse.json(
        { error: "Insight ID and type are required" },
        { status: 400 }
      )
    }

    // Get user with active product
    const user = await db.user.findFirst({
      where: { clerkId: userId },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Fetch insight
    const insight = await db.insight.findFirst({
      where: {
        id: insightId,
        userId: user.id,
      },
    })

    if (!insight) {
      return NextResponse.json({ error: "Insight not found" }, { status: 404 })
    }

    // Get product context and strategy
    // Use provided productId, or insight's productId, or user's active product
    const targetProductId = productId || insight.productId || user.activeProductId
    
    let productContext: ProductContext | undefined
    let strategyContext: StrategyContext | undefined

    if (targetProductId) {
      const product = await db.product.findFirst({
        where: { id: targetProductId, userId: user.id },
        include: { strategy: true },
      })

      if (product) {
        productContext = {
          name: product.name,
          type: product.type,
          industry: product.industry,
          audience: product.audience,
          stage: product.stage,
          description: product.description || undefined,
        }

        if (product.strategy) {
          try {
            strategyContext = {
              tone: JSON.parse(product.strategy.tone),
              platforms: JSON.parse(product.strategy.platforms),
              proofTypes: JSON.parse(product.strategy.proofTypes),
              cadence: JSON.parse(product.strategy.cadence),
              antiPatterns: JSON.parse(product.strategy.antiPatterns),
            }
          } catch (e) {
            console.error("Error parsing strategy:", e)
          }
        }
      }
    }

    const brandVoice = user.brandVoice ? JSON.parse(user.brandVoice).tone : undefined
    const userTier = (user.tier === "premium" ? "premium" : "standard") as "standard" | "premium"

    // Generate content with product strategy awareness
    const contentData = await generateContent(
      {
        coreProblem: insight.coreProblem,
        solution: insight.solution,
        audience: insight.audience,
        whyMatters: insight.whyMatters,
        impact: insight.impact || undefined,
        themes: insight.themes ? JSON.parse(insight.themes) : undefined,
      },
      type as "post" | "blog" | "carousel" | "thread" | "caption",
      platform as "linkedin" | "twitter" | "instagram" | "blog" | undefined,
      brandVoice,
      userTier,
      productContext,
      strategyContext
    )

    // Save draft with product link
    const draft = await db.contentDraft.create({
      data: {
        userId: user.id,
        productId: targetProductId || null,
        insightId: insight.id,
        type,
        platform: platform || null,
        title: contentData.title || null,
        content: contentData.content,
        visualPrompt: contentData.visualPrompt || null,
        cta: contentData.cta || null,
        status: "draft",
      },
    })

    // Check if platform is recommended
    let platformWarning: string | null = null
    if (platform && strategyContext?.platforms) {
      const platformRec = strategyContext.platforms.find(
        p => p.platform.toLowerCase() === platform.toLowerCase()
      )
      if (platformRec?.priority === "avoid") {
        platformWarning = `Note: ${platform} is not recommended for this product. Consider ${strategyContext.platforms.filter(p => p.priority === "primary").map(p => p.platform).join(" or ")} instead.`
      }
    }

    return NextResponse.json({ 
      draft,
      platformWarning,
      strategyApplied: !!strategyContext,
    })
  } catch (error) {
    console.error("Error generating content:", error)
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    )
  }
}
