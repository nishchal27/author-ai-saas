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

    // If draftId provided, fetch draft and use its visual prompt
    if (draftId) {
      const user = await db.user.findFirst({
        where: { clerkId: userId },
      })

      const draft = await db.contentDraft.findFirst({
        where: {
          id: draftId,
          userId: user!.id,
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

      // Get user visual style preferences
      if (user?.visualStyle) {
        const visualPrefs = JSON.parse(user.visualStyle)
        visualStyle = visualPrefs.style || style
      }
    }

    if (!visualPrompt) {
      return NextResponse.json(
        { error: "Visual prompt is required" },
        { status: 400 }
      )
    }

    // Generate visual
    const imageUrl = await generateVisual(visualPrompt, visualStyle)

    // Update draft if draftId provided
    if (draftId) {
      const user = await db.user.findFirst({
        where: { clerkId: userId },
      })

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
