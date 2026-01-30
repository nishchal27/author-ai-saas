"use client"

import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"

async function fetchJobStatus() {
  const res = await fetch("/api/jobs/status")
  if (!res.ok) throw new Error("Failed to fetch job status")
  return res.json()
}

export function JobStatusStrip() {
  const { data } = useQuery({
    queryKey: ["jobs-status"],
    queryFn: fetchJobStatus,
    refetchInterval: 10000,
  })

  const jobs = data?.jobs ?? []

  if (jobs.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden />
        <span>All quiet</span>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      {jobs.map((job: { id: string; name: string; status: string; text: string }) => (
        <div key={job.id} className="flex items-center gap-2 text-sm">
          {job.status === "running" && (
            <span className="flex h-5 w-5 items-center justify-center" aria-hidden>
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </span>
          )}
          {job.status !== "running" && (
            <span
              className={`h-2 w-2 rounded-full ${
                job.status === "completed" ? "bg-green-500" : "bg-destructive"
              }`}
              aria-hidden
            />
          )}
          <span className="text-muted-foreground">{job.text || job.name}</span>
        </div>
      ))}
    </div>
  )
}
