"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Activity, 
  Plus, 
  Sparkles, 
  Target, 
  Check, 
  X, 
  Package,
  ArrowRight,
  Clock
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { DashboardSkeleton } from "@/components/loading/dashboard-skeleton"
import { ProductOnboarding } from "@/components/onboarding/product-onboarding"

// ============================================
// DATA FETCHING
// ============================================

async function fetchProducts() {
  const res = await fetch("/api/products")
  if (!res.ok) throw new Error("Failed to fetch products")
  return res.json()
}

async function fetchActivities() {
  const res = await fetch("/api/activities?limit=10")
  if (!res.ok) throw new Error("Failed to fetch activities")
  return res.json()
}

async function fetchDrafts() {
  const res = await fetch("/api/content/drafts?limit=5")
  if (!res.ok) throw new Error("Failed to fetch drafts")
  return res.json()
}

// ============================================
// HELPER COMPONENTS
// ============================================

function StrategyQuickView({ strategy }: { strategy: any }) {
  if (!strategy) return null

  const platforms = JSON.parse(strategy.platforms || "[]")
  const cadence = JSON.parse(strategy.cadence || "{}")
  const primaryPlatforms = platforms.filter((p: any) => p.priority === "primary").slice(0, 3)
  const avoidPlatforms = platforms.filter((p: any) => p.priority === "avoid").slice(0, 2)

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Your Marketing Strategy</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed">{strategy.summary}</p>
        
        <div className="flex flex-wrap gap-2">
          {primaryPlatforms.map((p: any) => (
            <div 
              key={p.platform}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs"
            >
              <Check className="h-3 w-3" />
              <span className="capitalize">{p.platform}</span>
            </div>
          ))}
          {avoidPlatforms.map((p: any) => (
            <div 
              key={p.platform}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs line-through"
            >
              <X className="h-3 w-3" />
              <span className="capitalize">{p.platform}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{cadence.frequency || "2-3 posts per week"}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function NoProductState({ onAddProduct }: { onAddProduct: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Package className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Welcome to AuthorAI</h2>
      <p className="text-muted-foreground max-w-md mb-6">
        Tell us about your product and we'll create a personalized marketing strategy — 
        which platforms to use, what content to create, and what to skip.
      </p>
      <Button size="lg" onClick={onAddProduct}>
        Add Your Product
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function DashboardPage() {
  const [showOnboarding, setShowOnboarding] = useState(false)

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  })

  const { data: activitiesData, isLoading: activitiesLoading } = useQuery({
    queryKey: ["activities"],
    queryFn: fetchActivities,
  })

  const { data: draftsData, isLoading: draftsLoading } = useQuery({
    queryKey: ["drafts"],
    queryFn: fetchDrafts,
  })

  const isLoading = productsLoading || activitiesLoading || draftsLoading
  const products = productsData?.products || []
  const activeProductId = productsData?.activeProductId
  const activeProduct = products.find((p: any) => p.id === activeProductId) || products[0]
  const activities = activitiesData?.activities || []
  const drafts = draftsData?.drafts || []

  // Show onboarding if no products and hasn't been dismissed
  useEffect(() => {
    if (!productsLoading && products.length === 0) {
      const hasSeenOnboarding = localStorage.getItem("onboarding_completed")
      if (!hasSeenOnboarding) {
        setShowOnboarding(true)
      }
    }
  }, [productsLoading, products.length])

  if (isLoading) {
    return <DashboardSkeleton />
  }

  // No products yet - show welcome state
  if (products.length === 0) {
    return (
      <>
        <NoProductState onAddProduct={() => setShowOnboarding(true)} />
        <ProductOnboarding 
          open={showOnboarding} 
          onOpenChange={setShowOnboarding}
        />
      </>
    )
  }

  return (
    <>
      <div className="space-y-8">
        {/* Header with Product Context */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{activeProduct?.name}</h1>
              {products.length > 1 && (
                <Badge variant="outline" className="text-xs">
                  {products.length} products
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {activeProduct?.type?.replace("_", " ")} • {activeProduct?.audience?.replace("_", " ")} • {activeProduct?.stage}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowOnboarding(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
            <Button asChild>
              <Link href="/dashboard/activities/new">
                <Plus className="mr-2 h-4 w-4" />
                New Activity
              </Link>
            </Button>
          </div>
        </div>

        {/* Strategy Summary */}
        {activeProduct?.strategy && (
          <StrategyQuickView strategy={activeProduct.strategy} />
        )}

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activities</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activities.length}</div>
              <p className="text-xs text-muted-foreground">
                {activities.filter((a: any) => !a.processed).length} ready for insights
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Content Drafts</CardTitle>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{drafts.length}</div>
              <p className="text-xs text-muted-foreground">
                {drafts.filter((d: any) => d.status === "draft").length} pending review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Strategy Confidence</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activeProduct?.strategy 
                  ? `${Math.round(activeProduct.strategy.confidence * 100)}%`
                  : "—"
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Based on your product profile
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Content Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Track your product work</CardDescription>
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
                    <Badge variant={activity.processed ? "secondary" : "default"}>
                      {activity.processed ? "Processed" : "New"}
                    </Badge>
                  </div>
                ))}
                {activities.length === 0 && (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground mb-4">No activities yet</p>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/dashboard/activities/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Activity
                      </Link>
                    </Button>
                  </div>
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
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground mb-4">No drafts yet</p>
                    <Button asChild variant="outline" size="sm">
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

      {/* Onboarding Modal */}
      <ProductOnboarding 
        open={showOnboarding} 
        onOpenChange={setShowOnboarding}
      />
    </>
  )
}
