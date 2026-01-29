import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { generateVisual } from "@/lib/openai"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { draftId, prompt, style } = body

    if (!draftId && !prompt) {
      return NextResponse.json(
        { error: "Draft ID or prompt is required" },
        { status: 400 }
      )
    }

    let visualPrompt = prompt
    let visualStyle = style

    let productContext: { productName?: string; audience?: string } | undefined

    if (draftId) {
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
          product: { select: { name: true, audience: true, audienceDetail: true } },
        },
      })

      if (!draft) {
        return NextResponse.json({ error: "Draft not found" }, { status: 404 })
      }

      if (draft.visualPrompt) {
        visualPrompt = draft.visualPrompt
      } else {
        return NextResponse.json(
          { error: "Draft has no visual prompt" },
          { status: 400 }
        )
      }

      if (draft.product) {
        productContext = {
          productName: draft.product.name,
          audience: draft.product.audience?.replace(/_/g, " ") || undefined,
          audienceDetail: draft.product.audienceDetail ?? undefined,
        }
      }

      // User visual style preferences (if present on user)
      const userWithStyle = user as { visualStyle?: string }
      if (userWithStyle?.visualStyle) {
        try {
          const visualPrefs = JSON.parse(userWithStyle.visualStyle)
          visualStyle = visualPrefs.style || style
        } catch {
          // ignore
        }
      }
    }

    if (!visualPrompt) {
      return NextResponse.json(
        { error: "Visual prompt is required" },
        { status: 400 }
      )
    }

    const imageUrl = await generateVisual(visualPrompt, visualStyle, productContext)

    if (draftId) {
      await db.contentDraft.update({
        where: { id: draftId },
        data: { visualUrl: imageUrl },
      })
    }

    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error("Error generating visual:", error)
    return NextResponse.json(
      { error: "Failed to generate visual" },
      { status: 500 }
    )
  }
}
