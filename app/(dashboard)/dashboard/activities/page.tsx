"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Sparkles, Package } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { EmptyActivity } from "@/components/empty-states/empty-activity"
import { useToast } from "@/hooks/use-toast"
import { ActivitySkeleton } from "@/components/loading/activity-skeleton"
import { SearchFilter } from "@/components/search-filter"
import { useState, useMemo } from "react"

async function fetchActivities() {
  const res = await fetch("/api/activities")
  if (!res.ok) throw new Error("Failed to fetch activities")
  return res.json()
}

async function fetchProducts() {
  const res = await fetch("/api/products")
  if (!res.ok) throw new Error("Failed to fetch products")
  return res.json()
}

async function extractInsight(activityId: string) {
  const res = await fetch("/api/insights/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ activityId }),
  })
  if (!res.ok) throw new Error("Failed to extract insight")
  return res.json()
}

export default function ActivitiesPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  
  const { data, isLoading } = useQuery({
    queryKey: ["activities"],
    queryFn: fetchActivities,
  })

  const { data: productsData } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  })

  const activeProduct = productsData?.products?.find(
    (p: any) => p.id === productsData?.activeProductId
  ) || productsData?.products?.[0]

  const extractMutation = useMutation({
    mutationFn: extractInsight,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["activities"] })
      queryClient.invalidateQueries({ queryKey: ["insights"] })
      toast({
        title: "Insight extracted",
        description: data.productApplied 
          ? `Insight created with ${activeProduct?.name} context. Generating content...`
          : "Your insight has been created. Generating content...",
        variant: "success",
      })
      router.push("/dashboard/insights")
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to extract insight",
        variant: "destructive",
      })
    },
  })

  const allActivities = data?.activities || []

  const filteredActivities = useMemo(() => {
    return allActivities.filter((activity: any) => {
      const matchesSearch = 
        !searchQuery ||
        activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.description?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesFilter =
        statusFilter === "all" ||
        (statusFilter === "processed" && activity.processed) ||
        (statusFilter === "new" && !activity.processed)

      return matchesSearch && matchesFilter
    })
  }, [allActivities, searchQuery, statusFilter])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Activities</h1>
          <p className="text-muted-foreground mt-2">
            Your product activity and work
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/activities/new">
            <Plus className="mr-2 h-4 w-4" />
            New Activity
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <SearchFilter
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          filterValue={statusFilter}
          onFilterChange={setStatusFilter}
          filterOptions={[
            { value: "new", label: "New" },
            { value: "processed", label: "Processed" },
          ]}
          placeholder="Search activities..."
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <ActivitySkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredActivities.map((activity: any) => (
            <Card key={activity.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{activity.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      {format(new Date(activity.createdAt), "MMM d, yyyy 'at' h:mm a")}
                      {activity.product && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {activity.product.name}
                          </span>
                        </>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={activity.processed ? "secondary" : "default"}>
                      {activity.processed ? "Processed" : "New"}
                    </Badge>
                    <Badge variant="outline">{activity.type}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {activity.description && (
                  <p className="text-sm text-muted-foreground">
                    {activity.description}
                  </p>
                )}
                {!activity.processed && (
                  <Button
                    size="sm"
                    className="mt-4"
                    onClick={() => extractMutation.mutate(activity.id)}
                    disabled={extractMutation.isPending}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    {extractMutation.isPending ? "Extracting..." : "Extract Insight"}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
          {filteredActivities.length === 0 && allActivities.length === 0 && <EmptyActivity />}
          {filteredActivities.length === 0 && allActivities.length > 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No activities match your filters</p>
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
