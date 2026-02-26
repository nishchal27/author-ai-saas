import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { getDecryptedIntegration } from "@/lib/crypto"
import { ensureUserForClerkId } from "@/lib/users"
import { parseBody, githubSyncSchema } from "@/lib/validation"
import { fetchCommits, fetchPullRequests, parseRepo } from "@/lib/github"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const raw = await req.json().catch(() => null)
    const parsed = parseBody(raw, githubSyncSchema)
    if ("error" in parsed) return parsed.error
    const { repoUrl } = parsed.data

    const user = await ensureUserForClerkId(userId)

    // Get GitHub integration
    const githubIntegration = await db.integration.findFirst({
      where: {
        userId: user.id,
        type: "github",
        isActive: true,
      },
    })

    if (!githubIntegration || !githubIntegration.accessToken) {
      return NextResponse.json(
        { error: "GitHub integration not found or inactive" },
        { status: 404 }
      )
    }
    const decrypted = getDecryptedIntegration(githubIntegration)
    if (!decrypted.accessToken) {
      return NextResponse.json(
        { error: "GitHub integration not found or inactive" },
        { status: 404 }
      )
    }

    // Parse repo
    const repo = parseRepo(repoUrl)
    if (!repo) {
      return NextResponse.json(
        { error: "Invalid repository format" },
        { status: 400 }
      )
    }

    // Fetch activities
    const [commits, prs] = await Promise.all([
      fetchCommits(decrypted.accessToken, repo.owner, repo.repo),
      fetchPullRequests(decrypted.accessToken, repo.owner, repo.repo),
    ])

    const activities = [...commits, ...prs]

    // Check which activities are new
    const existingActivities = await db.activity.findMany({
      where: {
        userId: user.id,
        type: {
          in: ["github_commit", "github_pr"],
        },
      },
      select: {
        metadata: true,
      },
    })

    const existingHashes = new Set(
      existingActivities
        .map((a) => {
          const meta = a.metadata ? JSON.parse(a.metadata) : {}
          return meta.sha || meta.prNumber?.toString()
        })
        .filter(Boolean)
    )

    // Create new activities
    const newActivities = activities.filter((activity) => {
      const key = activity.metadata.sha || activity.metadata.prNumber?.toString()
      return key && !existingHashes.has(key)
    })

    const created = await Promise.all(
      newActivities.map((activity) =>
        db.activity.create({
          data: {
            userId: user.id,
            type: activity.type === "commit" ? "github_commit" : "github_pr",
            source: "github",
            title: activity.title,
            description: activity.description,
            metadata: JSON.stringify(activity.metadata),
            rawData: JSON.stringify(activity),
            processed: false,
          },
        })
      )
    )

    return NextResponse.json({
      synced: created.length,
      activities: created,
    })
  } catch (error) {
    console.error("Error syncing GitHub:", error)
    return NextResponse.json(
      { error: "Failed to sync GitHub activities" },
      { status: 500 }
    )
  }
}
