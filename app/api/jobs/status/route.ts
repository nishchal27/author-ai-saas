import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export type JobStatus = "running" | "completed" | "failed"

export interface JobStatusItem {
  id: string
  name: string
  status: JobStatus
  text: string
}

/**
 * GET /api/jobs/status
 * Returns active/recent background job status for dashboard display.
 * Currently returns empty list; can be wired to Inngest API or a JobRun table later.
 */
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const jobs: JobStatusItem[] = []
    // TODO: Poll Inngest API or read from a JobRun table updated by Inngest steps
    return NextResponse.json({ jobs })
  } catch (error) {
    console.error("Error fetching job status:", error)
    return NextResponse.json(
      { error: "Failed to fetch job status" },
      { status: 500 }
    )
  }
}
