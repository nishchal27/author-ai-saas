"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Activity, Plus, Sparkles } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { DashboardSkeleton } from "@/components/loading/dashboard-skeleton"

async function fetchActivities() {
  const res = await fetch("/api/activities?limit=10")
  if (!res.ok) throw new Error("Failed to fetch activities")
  return res.json()
}

async function fetchInsights() {
  const res = await fetch("/api/insights?limit=5")
  if (!res.ok) throw new Error("Failed to fetch insights")
  return res.json()
}

async function fetchDrafts() {
  const res = await fetch("/api/content/drafts?limit=5")
  if (!res.ok) throw new Error("Failed to fetch drafts")
  return res.json()
}

export default function DashboardPage() {
  const { data: activitiesData, isLoading: activitiesLoading } = useQuery({
    queryKey: ["activities"],
    queryFn: fetchActivities,
  })

  const { data: insightsData, isLoading: insightsLoading } = useQuery({
    queryKey: ["insights"],
    queryFn: fetchInsights,
  })

  const { data: draftsData, isLoading: draftsLoading } = useQuery({
    queryKey: ["drafts"],
    queryFn: fetchDrafts,
  })

  const isLoading = activitiesLoading || insightsLoading || draftsLoading
  const activities = activitiesData?.activities || []
  const insights = insightsData?.insights || []
  const drafts = draftsData?.drafts || []

  if (isLoading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Turn your real work into trust-building content
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/activities/new">
            <Plus className="mr-2 h-4 w-4" />
            New Activity
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activities.length}</div>
            <p className="text-xs text-muted-foreground">
              {activities.filter((a: any) => !a.processed).length} unprocessed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Insights</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.length}</div>
            <p className="text-xs text-muted-foreground">
              {insights.filter((i: any) => i.status === "draft").length} drafts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Drafts</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{drafts.length}</div>
            <p className="text-xs text-muted-foreground">
              {drafts.filter((d: any) => d.status === "draft").length} pending review
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Your latest product activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.slice(0, 5).map((activity: any) => (
                <div key={activity.id} className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(activity.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={activity.processed ? "secondary" : "default"}>
                      {activity.processed ? "Processed" : "New"}
                    </Badge>
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <p className="text-sm text-muted-foreground">No activities yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Drafts</CardTitle>
            <CardDescription>Content waiting for your review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {drafts.slice(0, 5).map((draft: any) => (
                <div key={draft.id} className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {draft.title || `${draft.type} for ${draft.platform || "general"}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {draft.type} • {draft.platform || "all platforms"}
                    </p>
                  </div>
                  <Badge variant="outline">{draft.status}</Badge>
                </div>
              ))}
              {drafts.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">No drafts yet</p>
                  <Button asChild variant="outline" size="sm" className="mt-4">
                    <Link href="/dashboard/insights">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Content
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
