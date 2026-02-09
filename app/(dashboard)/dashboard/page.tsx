"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, ArrowRight, Loader2, Sparkles, User, Cpu } from "lucide-react"
import Link from "next/link"
import { JobStatusStrip } from "@/components/dashboard/job-status-strip"
import { BuildInPublicModal } from "@/components/dashboard/build-in-public-modal"
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

async function fetchSettings() {
  const res = await fetch("/api/settings")
  if (!res.ok) throw new Error("Failed to fetch settings")
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

// ============================================
// MAIN COMPONENT
// ============================================

export default function DashboardPage() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showBuildInPublic, setShowBuildInPublic] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const action = searchParams.get("action")
  const activityId = searchParams.get("activityId")

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  })

  const { data: settingsData } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
    enabled: !!productsData?.products?.length,
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

  const isLoading =
    productsLoading ||
    (!!productsData?.products?.length && !action && guideLoading) ||
    (action === "extract" && activityLoading)
  const products = productsData?.products || []
  const activeProductId = productsData?.activeProductId
  const activeProduct = products.find((p: any) => p.id === activeProductId) || products[0]
  const next = guideData
  const activity = activityData?.activity

  // Redirect "Create post" to Content create (content creation only in Content area)
  useEffect(() => {
    if (action === "post" && searchParams.get("insightId")) {
      router.replace(`/dashboard/content/create?insightId=${searchParams.get("insightId")}`)
    }
  }, [action, searchParams, router])

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

  const founderBio = settingsData?.user?.founderBio ?? null

  // Default: organized dashboard with products, founder, jobs, next
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

        {/* Background jobs */}
        <Card className="border-border/80 bg-muted/30">
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent" aria-hidden />
              Background
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <JobStatusStrip />
          </CardContent>
        </Card>

        {/* Products */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Products</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p: any) => (
              <Card key={p.id} className="overflow-hidden border-primary/10 bg-gradient-to-br from-primary/5 to-transparent hover:from-primary/10 transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    {p.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {p.description || p.audience ? [p.description, p.audience].filter(Boolean).join(" · ") : "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary hover:bg-primary/10">
                      <Link href={`/dashboard/strategy?productId=${p.id}`}>Strategy</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Founder & build in public */}
        <Card className="border-accent/20 bg-accent/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-accent" />
              Founder & build in public
            </CardTitle>
            <CardDescription>
              Used to personalize content (build in public, lessons, tech stack).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {founderBio ? (
              <p className="text-sm text-muted-foreground line-clamp-2">{founderBio}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No founder bio or tech stacks set.</p>
            )}
            {products.some((p: any) => p.techStackJson) && (
              <div className="flex flex-wrap gap-2 pt-1">
                {products.map((p: any) => {
                  if (!p.techStackJson) return null
                  try {
                    const arr = JSON.parse(p.techStackJson) as { name: string }[]
                    return (
                      <div key={p.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Cpu className="h-3.5 w-3.5" />
                        <span>{p.name}: {arr.map((t) => t.name).join(", ")}</span>
                      </div>
                    )
                  } catch {
                    return null
                  }
                })}
              </div>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowBuildInPublic(true)}>
              {founderBio || products.some((p: any) => p.techStackJson) ? "Edit build in public profile" : "Add founder & tech stack"}
            </Button>
          </CardContent>
        </Card>

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
      <BuildInPublicModal open={showBuildInPublic} onOpenChange={setShowBuildInPublic} />
    </>
  )
}
