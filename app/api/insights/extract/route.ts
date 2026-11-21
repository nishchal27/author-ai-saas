import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { ensureUserForClerkId } from "@/lib/users"
import { checkAiRateLimits } from "@/lib/rate-limit"
import { parseBody, insightExtractSchema } from "@/lib/validation"
import { extractInsight, ProductContext } from "@/lib/claude"
import { toAiPublicError } from "@/lib/ai/public-error"
import { hasAnyAiProviderKey } from "@/lib/env"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await ensureUserForClerkId(userId)

    if (!hasAnyAiProviderKey()) {
      const pub = toAiPublicError(new Error("not configured"))
      return NextResponse.json(
        { error: pub.error, code: pub.code },
        { status: pub.status }
      )
    }

    const rateLimit = await checkAiRateLimits(user.id)
    if (rateLimit) return rateLimit

    const raw = await req.json().catch(() => null)
    const parsed = parseBody(raw, insightExtractSchema)
    if ("error" in parsed) return parsed.error
    const { activityId, humanInput, productId } = parsed.data

    const activity = await db.activity.findFirst({
      where: {
        id: activityId,
        userId: user.id,
      },
    })

    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 })
    }

    const requestedProductId =
      productId || activity.productId || user.activeProductId || null

    let productContext: ProductContext | undefined
    let ownedProductId: string | null = null

    if (requestedProductId) {
      const product = await db.product.findFirst({
        where: { id: requestedProductId, userId: user.id },
      })

      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 })
      }

      ownedProductId = product.id
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

    const bv = (user as { brandVoice?: string | null }).brandVoice
    const brandVoice = bv ? JSON.parse(bv).tone : undefined
    const userTier = (user.tier === "premium" ? "premium" : "standard") as
      | "standard"
      | "premium"

    const insightData = await extractInsight(
      {
        title: activity.title,
        description: activity.description || undefined,
        type: activity.type,
        humanInput,
      },
      brandVoice,
      userTier,
      productContext,
      {
        userId: user.id,
        brandId: ownedProductId || undefined,
        task: "insight.extract",
      }
    )

    const insight = await db.insight.create({
      data: {
        userId: user.id,
        productId: ownedProductId,
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

    await db.activity.update({
      where: { id: activity.id },
      data: {
        processed: true,
        productId: activity.productId || ownedProductId || null,
      },
    })

    return NextResponse.json({
      insight,
      productApplied: !!productContext,
    })
  } catch (error) {
    console.error("Error extracting insight:", error)
    const pub = toAiPublicError(error)
    return NextResponse.json(
      { error: pub.error, code: pub.code },
      { status: pub.status }
    )
  }
}
