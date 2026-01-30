import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { generateImageSuggestions } from "@/lib/claude"
import { NextResponse } from "next/server"

/**
 * GET /api/visuals/suggestions?draftId=...
 * Returns 3–5 image concept suggestions for a content draft.
 */
export async function GET(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const draftId = searchParams.get("draftId")
    if (!draftId) {
      return NextResponse.json(
        { error: "draftId is required" },
        { status: 400 }
      )
    }

    const user = await db.user.findFirst({
      where: { clerkId: userId },
    })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const draft = await db.contentDraft.findFirst({
      where: {
        id: draftId,
        userId: user.id,
      },
      include: {
        product: {
          include: { strategy: true },
        },
      },
    })

    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 })
    }

    const product = draft.product as any
    const strategy = product?.strategy
    let productContext: { name: string; type: string; industry: string; audience: string; stage: string; description?: string; audienceDetail?: string } | undefined
    if (product) {
      productContext = {
        name: product.name,
        type: product.type,
        industry: product.industry,
        audience: product.audience,
        stage: product.stage,
        description: product.description ?? undefined,
        audienceDetail: product.audienceDetail ?? undefined,
      }
    }

    let visualStyle: string | undefined
    if (strategy?.visualStyle) {
      try {
        const parsed = JSON.parse(strategy.visualStyle)
        visualStyle = typeof parsed === "string" ? parsed : parsed.style ?? parsed.description
      } catch {
        visualStyle = strategy.visualStyle
      }
    }

    const suggestions = await generateImageSuggestions(
      draft.content,
      draft.title ?? undefined,
      productContext,
      visualStyle
    )

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error("Error generating image suggestions:", error)
    return NextResponse.json(
      { error: "Failed to generate image suggestions" },
      { status: 500 }
    )
  }
}
