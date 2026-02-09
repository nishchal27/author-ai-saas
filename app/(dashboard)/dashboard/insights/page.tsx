"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText } from "lucide-react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { EmptyInsights } from "@/components/empty-states/empty-insights"
import { SearchFilter } from "@/components/search-filter"
import { useState, useMemo } from "react"
import { InsightSkeleton } from "@/components/loading/insight-skeleton"

async function fetchInsights(scope: "active" | "all" = "active") {
  const res = await fetch(`/api/insights?scope=${scope}`)
  if (!res.ok) throw new Error("Failed to fetch insights")
  return res.json()
}

export default function InsightsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const { data, isLoading } = useQuery({
    queryKey: ["insights"],
    queryFn: () => fetchInsights("active"),
  })

  const allInsights = data?.insights || []

  const filteredInsights = useMemo(() => {
    return allInsights.filter((insight: any) => {
      const matchesSearch =
        !searchQuery ||
        insight.coreProblem.toLowerCase().includes(searchQuery.toLowerCase()) ||
        insight.solution.toLowerCase().includes(searchQuery.toLowerCase()) ||
        insight.audience.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesFilter =
        statusFilter === "all" ||
        insight.status === statusFilter

      return matchesSearch && matchesFilter
    })
  }, [allInsights, searchQuery, statusFilter])

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Angles</h1>
        <p className="text-muted-foreground mt-2">
          Post angles from your stories. Use Home to see the one we recommend next.
        </p>
      </div>

      <div className="mb-6">
        <SearchFilter
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          filterValue={statusFilter}
          onFilterChange={setStatusFilter}
          filterOptions={[
            { value: "all", label: "All" },
            { value: "draft", label: "Draft" },
            { value: "approved", label: "Approved" },
            { value: "rejected", label: "Rejected" },
          ]}
          placeholder="Search angles..."
        />
      </div>

      {isLoading ? (
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <InsightSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredInsights.map((insight: any) => (
            <Card
              key={insight.id}
              className={
                insight.status === "approved"
                  ? "border-success/20 bg-success-muted/20"
                  : insight.status === "rejected"
                    ? "border-destructive/20 bg-destructive/5"
                    : "border-primary/10 bg-primary/5"
              }
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Angle
                    </CardTitle>
                    <CardDescription>
                      {format(new Date(insight.createdAt), "MMM d, yyyy")}
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      insight.status === "approved"
                        ? "border-success/40 bg-success-muted text-success"
                        : insight.status === "rejected"
                          ? "border-destructive/40 bg-destructive/10 text-destructive"
                          : "border-primary/40 bg-primary/10 text-primary"
                    }
                  >
                    {insight.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="pl-3 border-l-2 border-metric-views">
                  <h4 className="text-sm font-semibold mb-1 text-foreground/90">Problem</h4>
                  <p className="text-sm text-muted-foreground">{insight.coreProblem}</p>
                </div>
                <div className="pl-3 border-l-2 border-metric-rate">
                  <h4 className="text-sm font-semibold mb-1 text-foreground/90">Solution</h4>
                  <p className="text-sm text-muted-foreground">{insight.solution}</p>
                </div>
                <div className="pl-3 border-l-2 border-primary">
                  <h4 className="text-sm font-semibold mb-1 text-foreground/90">Audience</h4>
                  <p className="text-sm text-muted-foreground">{insight.audience}</p>
                </div>
                <div className="pl-3 border-l-2 border-accent">
                  <h4 className="text-sm font-semibold mb-1 text-foreground/90">Why it matters</h4>
                  <p className="text-sm text-muted-foreground">{insight.whyMatters}</p>
                </div>
                {insight.impact && (
                  <div className="pl-3 border-l-2 border-success">
                    <h4 className="text-sm font-semibold mb-1 text-foreground/90">Impact</h4>
                    <p className="text-sm text-muted-foreground">{insight.impact}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    size="sm"
                    onClick={() => router.push(`/dashboard/content/create?insightId=${insight.id}`)}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Use in Content
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredInsights.length === 0 && allInsights.length === 0 && <EmptyInsights />}
          {filteredInsights.length === 0 && allInsights.length > 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No angles match your filters</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery("")
                    setStatusFilter("all")
                  }}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

    </div>
  )
}
