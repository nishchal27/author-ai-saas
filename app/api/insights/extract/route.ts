import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { ensureUserForClerkId } from "@/lib/users"
import { checkRateLimit } from "@/lib/rate-limit"
import { parseBody, insightExtractSchema } from "@/lib/validation"
import { extractInsight, ProductContext } from "@/lib/claude"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rateLimit = checkRateLimit(userId)
    if (rateLimit) return rateLimit

    const raw = await req.json().catch(() => null)
    const parsed = parseBody(raw, insightExtractSchema)
    if ("error" in parsed) return parsed.error
    const { activityId, humanInput, productId } = parsed.data

    const user = await ensureUserForClerkId(userId)

    // Fetch activity
    const activity = await db.activity.findFirst({
      where: {
        id: activityId,
        userId: user.id,
      },
    })

    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 })
    }

    // Get product context
    // Use provided productId, or activity's productId, or user's active product
    const targetProductId = productId || activity.productId || user.activeProductId
    
    let productContext: ProductContext | undefined

    if (targetProductId) {
      const product = await db.product.findFirst({
        where: { id: targetProductId, userId: user.id },
      })

      if (product) {
        productContext = {
          name: product.name,
          type: product.type,
          industry: product.industry,
          audience: product.audience,
          stage: product.stage,
          description: product.description || undefined,
          audienceDetail: product.audienceDetail ?? undefined,
        }
      }
    }

    const bv = (user as { brandVoice?: string | null }).brandVoice
    const brandVoice = bv ? JSON.parse(bv).tone : undefined
    const userTier = (user.tier === "premium" ? "premium" : "standard") as "standard" | "premium"

    // Extract insight with product context
    const insightData = await extractInsight(
      {
        title: activity.title,
        description: activity.description || undefined,
        type: activity.type,
        humanInput,
      },
      brandVoice,
      userTier,
      productContext
    )

    // Save insight with product link
    const insight = await db.insight.create({
      data: {
        userId: user.id,
        productId: targetProductId || null,
        activityId: activity.id,
        coreProblem: insightData.coreProblem,
        solution: insightData.solution,
        audience: insightData.audience,
        whyMatters: insightData.whyMatters,
        impact: insightData.impact,
        themes: insightData.themes ? JSON.stringify(insightData.themes) : null,
        status: "draft",
      },
    })

    // Mark activity as processed and link to product if not already
    await db.activity.update({
      where: { id: activity.id },
      data: { 
        processed: true,
        productId: activity.productId || targetProductId || null,
      },
    })

    return NextResponse.json({ 
      insight,
      productApplied: !!productContext,
    })
  } catch (error) {
    console.error("Error extracting insight:", error)
    return NextResponse.json(
      { error: "Failed to extract insight" },
      { status: 500 }
    )
  }
}
