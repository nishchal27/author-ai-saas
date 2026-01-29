"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Sparkles } from "lucide-react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { EmptyInsights } from "@/components/empty-states/empty-insights"
import { useToast } from "@/hooks/use-toast"
import { SearchFilter } from "@/components/search-filter"
import { useState, useMemo } from "react"
import { InsightSkeleton } from "@/components/loading/insight-skeleton"

async function fetchInsights() {
  const res = await fetch("/api/insights")
  if (!res.ok) throw new Error("Failed to fetch insights")
  return res.json()
}

async function generateContent(insightId: string, type: string, platform?: string) {
  const res = await fetch("/api/content/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ insightId, type, platform }),
  })
  if (!res.ok) throw new Error("Failed to generate content")
  return res.json()
}

export default function InsightsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  
  const { data, isLoading } = useQuery({
    queryKey: ["insights"],
    queryFn: fetchInsights,
  })

  const generateMutation = useMutation({
    mutationFn: ({ insightId, type, platform }: { insightId: string; type: string; platform?: string }) =>
      generateContent(insightId, type, platform),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drafts"] })
      toast({
        title: "Content generated",
        description: "Your content draft has been created.",
        variant: "success",
      })
      router.push("/dashboard/content")
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate content",
        variant: "destructive",
      })
    },
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
            <Card key={insight.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle>Angle</CardTitle>
                    <CardDescription>
                      {format(new Date(insight.createdAt), "MMM d, yyyy")}
                    </CardDescription>
                  </div>
                  <Badge variant={insight.status === "approved" ? "default" : "outline"}>
                    {insight.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-1">Problem</h4>
                  <p className="text-sm text-muted-foreground">{insight.coreProblem}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-1">Solution</h4>
                  <p className="text-sm text-muted-foreground">{insight.solution}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-1">Audience</h4>
                  <p className="text-sm text-muted-foreground">{insight.audience}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-1">Why it matters</h4>
                  <p className="text-sm text-muted-foreground">{insight.whyMatters}</p>
                </div>
                {insight.impact && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Impact</h4>
                    <p className="text-sm text-muted-foreground">{insight.impact}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    size="sm"
                    onClick={() =>
                      generateMutation.mutate({
                        insightId: insight.id,
                        type: "post",
                        platform: "linkedin",
                      })
                    }
                    disabled={generateMutation.isPending}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Post
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      generateMutation.mutate({
                        insightId: insight.id,
                        type: "blog",
                      })
                    }
                    disabled={generateMutation.isPending}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Blog
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
