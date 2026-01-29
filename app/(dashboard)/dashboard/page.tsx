"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, ArrowRight, Loader2, Sparkles } from "lucide-react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { DashboardSkeleton } from "@/components/loading/dashboard-skeleton"
import { ProductOnboarding } from "@/components/onboarding/product-onboarding"
import { useToast } from "@/hooks/use-toast"

// ============================================
// DATA FETCHING
// ============================================

async function fetchProducts() {
  const res = await fetch("/api/products")
  if (!res.ok) throw new Error("Failed to fetch products")
  return res.json()
}

async function fetchGuideNext() {
  const res = await fetch("/api/guide/next")
  if (!res.ok) throw new Error("Failed to fetch next action")
  return res.json()
}

async function fetchActivity(id: string) {
  const res = await fetch(`/api/activities/${id}`)
  if (!res.ok) throw new Error("Failed to fetch activity")
  return res.json()
}

async function fetchInsight(id: string) {
  const res = await fetch(`/api/insights/${id}`)
  if (!res.ok) throw new Error("Failed to fetch insight")
  return res.json()
}

// ============================================
// HELPER COMPONENTS
// ============================================

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
        Add your product
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  )
}

function NextCard({
  step,
  reason,
  cta,
  href,
  stepLabel,
}: {
  step: string
  reason: string
  cta: string
  href: string
  stepLabel: string
}) {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="text-lg">Next: {stepLabel}</CardTitle>
        <CardDescription>{reason}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link href={href}>{cta}</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function stepToLabel(step: string): string {
  switch (step) {
    case "add_product":
      return "Add your product"
    case "view_strategy":
      return "See your strategy"
    case "get_angle":
      return "Get the angle"
    case "create_post":
      return "Create post"
    case "review_draft":
      return "Review your draft"
    case "share_story":
      return "Share a story"
    default:
      return step.replace(/_/g, " ")
  }
}

function getPrimaryPlatform(strategy: any): string {
  if (!strategy?.platforms) return "linkedin"
  try {
    const platforms = typeof strategy.platforms === "string" ? JSON.parse(strategy.platforms) : strategy.platforms
    const primary = platforms.find((p: any) => p.priority === "primary")
    return primary?.platform || "linkedin"
  } catch {
    return "linkedin"
  }
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function DashboardPage() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const action = searchParams.get("action")
  const activityId = searchParams.get("activityId")
  const insightId = searchParams.get("insightId")

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  })

  const { data: guideData, isLoading: guideLoading } = useQuery({
    queryKey: ["guide-next"],
    queryFn: fetchGuideNext,
    enabled: !!productsData?.products?.length && !action,
  })

  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ["activity", activityId!],
    queryFn: () => fetchActivity(activityId!),
    enabled: action === "extract" && !!activityId,
  })

  const { data: insightData, isLoading: insightLoading } = useQuery({
    queryKey: ["insight", insightId!],
    queryFn: () => fetchInsight(insightId!),
    enabled: action === "post" && !!insightId,
  })

  const extractMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/insights/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to extract angle")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guide-next"] })
      queryClient.invalidateQueries({ queryKey: ["activities"] })
      queryClient.invalidateQueries({ queryKey: ["insights"] })
      toast({
        title: "Angle ready",
        description: "You can now create a post from this angle.",
        variant: "success",
      })
      router.push("/dashboard")
    },
    onError: (e: Error) => {
      toast({
        title: "Error",
        description: e.message,
        variant: "destructive",
      })
    },
  })

  const createPostMutation = useMutation({
    mutationFn: async () => {
      const products = productsData?.products || []
      const activeProduct = products.find((p: any) => p.id === productsData?.activeProductId) || products[0]
      const platform = getPrimaryPlatform(activeProduct?.strategy)
      const res = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ insightId, type: "post", platform }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to create post")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guide-next"] })
      queryClient.invalidateQueries({ queryKey: ["drafts"] })
      toast({
        title: "Draft created",
        description: "Review your draft in Content.",
        variant: "success",
      })
      router.push("/dashboard/content")
    },
    onError: (e: Error) => {
      toast({
        title: "Error",
        description: e.message,
        variant: "destructive",
      })
    },
  })

  const isLoading =
    productsLoading ||
    (!!productsData?.products?.length && !action && guideLoading) ||
    (action === "extract" && activityLoading) ||
    (action === "post" && insightLoading)
  const products = productsData?.products || []
  const activeProductId = productsData?.activeProductId
  const activeProduct = products.find((p: any) => p.id === activeProductId) || products[0]
  const next = guideData
  const activity = activityData?.activity
  const insight = insightData?.insight

  useEffect(() => {
    if (!productsLoading && products.length === 0) {
      const hasSeenOnboarding = localStorage.getItem("onboarding_completed")
      if (!hasSeenOnboarding) {
        setShowOnboarding(true)
      }
    }
  }, [productsLoading, products.length])

  if (isLoading && products.length > 0 && !action) {
    return <DashboardSkeleton />
  }

  if (products.length === 0) {
    return (
      <>
        <NoProductState onAddProduct={() => setShowOnboarding(true)} />
        <ProductOnboarding open={showOnboarding} onOpenChange={setShowOnboarding} />
      </>
    )
  }

  const strategySummary = activeProduct?.strategy?.summary ?? null

  // Flow: Get the angle (action=extract)
  if (action === "extract" && activityId) {
    if (activityLoading || !activity) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )
    }
    return (
      <>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold">{activeProduct?.name}</h1>
            {strategySummary && (
              <p className="text-muted-foreground mt-2 max-w-2xl">{strategySummary}</p>
            )}
          </div>
          <Card>
            <CardHeader>
              <CardTitle>What you shared</CardTitle>
              <CardDescription>{activity.title}</CardDescription>
            </CardHeader>
            {activity.description && (
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {activity.description}
                </p>
              </CardContent>
            )}
            <CardContent>
              <Button
                onClick={() => extractMutation.mutate()}
                disabled={extractMutation.isPending}
              >
                {extractMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Get the angle
              </Button>
            </CardContent>
          </Card>
        </div>
        <ProductOnboarding open={showOnboarding} onOpenChange={setShowOnboarding} />
      </>
    )
  }

  // Flow: Create post (action=post) — single Angle card
  if (action === "post" && insightId) {
    if (insightLoading || !insight) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )
    }
    const headline = insight.solution || insight.coreProblem
    const whyMatters = insight.whyMatters
    return (
      <>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold">{activeProduct?.name}</h1>
            {strategySummary && (
              <p className="text-muted-foreground mt-2 max-w-2xl">{strategySummary}</p>
            )}
          </div>
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="text-lg">Post angle</CardTitle>
              <CardDescription className="text-base font-medium text-foreground">
                {headline}
              </CardDescription>
              {whyMatters && (
                <p className="text-sm text-muted-foreground mt-2">
                  Why your audience cares: {whyMatters}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => createPostMutation.mutate()}
                disabled={createPostMutation.isPending}
              >
                {createPostMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Create post
              </Button>
            </CardContent>
          </Card>
        </div>
        <ProductOnboarding open={showOnboarding} onOpenChange={setShowOnboarding} />
      </>
    )
  }

  // Default: product context + Next card
  return (
    <>
      <div className="space-y-8">
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
            {strategySummary && (
              <p className="text-muted-foreground max-w-2xl">{strategySummary}</p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowOnboarding(true)}>
            Add product
          </Button>
        </div>

        {next && (
          <NextCard
            step={next.step}
            reason={next.reason}
            cta={next.cta}
            href={next.href}
            stepLabel={stepToLabel(next.step)}
          />
        )}

        {next?.step === "review_draft" && next.draftTitle && (
          <p className="text-sm text-muted-foreground">
            1 draft waiting —{" "}
            <Link href={next.href} className="text-primary underline underline-offset-2">
              {next.draftTitle}
            </Link>
          </p>
        )}
      </div>

      <ProductOnboarding open={showOnboarding} onOpenChange={setShowOnboarding} />
    </>
  )
}
