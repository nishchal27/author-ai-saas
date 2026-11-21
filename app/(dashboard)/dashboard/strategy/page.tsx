"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Package, ArrowLeft, Target } from "lucide-react"
import Link from "next/link"
import { StrategyDisplay } from "@/components/strategy/strategy-display"
import { PillarsPanel } from "@/components/pillars/pillars-panel"
import { queryKeys } from "@/lib/query-keys"
import {
  PRODUCT_TYPES,
  INDUSTRIES,
  PRODUCT_STAGES,
  SALES_APPROACHES,
  labelFor,
} from "@/lib/product-options"

async function fetchProducts() {
  const res = await fetch("/api/products")
  if (!res.ok) throw new Error("Failed to fetch products")
  return res.json()
}

function StrategySkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full" />
      <div className="grid md:grid-cols-2 gap-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  )
}

function NoBrandState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Package className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-2xl font-bold mb-2">No brand yet</h2>
      <p className="text-muted-foreground max-w-md mb-6">
        Add your brand so we can recommend what to post.
      </p>
      <Button asChild>
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go to Overview
        </Link>
      </Button>
    </div>
  )
}

export default function StrategyPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.products,
    queryFn: fetchProducts,
  })

  const products = data?.products || []
  const activeProductId = data?.activeProductId
  const activeProduct = products.find((p: { id: string }) => p.id === activeProductId) || products[0]

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Marketing Intelligence</h1>
          <p className="text-muted-foreground mt-2">Loading your strategy...</p>
        </div>
        <StrategySkeleton />
      </div>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Couldn’t load your brands</CardTitle>
          <CardDescription>
            This is a load failure, not an empty workspace. Try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!activeProduct) {
    return <NoBrandState />
  }

  // Parse strategy data (visualStyle optional)
  const rawStrategy = activeProduct.strategy ? {
    platforms: JSON.parse(activeProduct.strategy.platforms || "[]"),
    contentTypes: JSON.parse(activeProduct.strategy.contentTypes || "[]"),
    tone: JSON.parse(activeProduct.strategy.tone || "{}"),
    ...(activeProduct.strategy.visualStyle
      ? { visualStyle: JSON.parse(activeProduct.strategy.visualStyle) }
      : {}),
    cadence: JSON.parse(activeProduct.strategy.cadence || "{}"),
    proofTypes: JSON.parse(activeProduct.strategy.proofTypes || "[]"),
    antiPatterns: JSON.parse(activeProduct.strategy.antiPatterns || "[]"),
    summary: activeProduct.strategy.summary,
    reasoning: activeProduct.strategy.reasoning,
    confidence: activeProduct.strategy.confidence,
  } : null

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <Target className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Marketing Intelligence
            </h1>
          </div>
          <p className="text-muted-foreground">
            Strategy and content pillars for{" "}
            <span className="font-medium text-foreground">{activeProduct.name}</span>.
          </p>
        </div>
        <Button asChild variant="outline" className="shrink-0">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Overview
          </Link>
        </Button>
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Brand profile
          </CardTitle>
          <CardDescription>This strategy is based on your brand details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Type</div>
              <div className="font-medium">
                {labelFor(PRODUCT_TYPES, activeProduct.type)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Industry</div>
              <div className="font-medium">
                {labelFor(INDUSTRIES, activeProduct.industry)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Audience</div>
              <div className="font-medium capitalize">{activeProduct.audience?.replace(/_/g, " ")}</div>
              {activeProduct.audienceDetail && (
                <div className="text-xs text-muted-foreground mt-1">Who exactly: {activeProduct.audienceDetail}</div>
              )}
            </div>
            <div>
              <div className="text-muted-foreground">Stage</div>
              <div className="font-medium">
                {labelFor(PRODUCT_STAGES, activeProduct.stage)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Sales approach</div>
              <div className="font-medium">
                {labelFor(SALES_APPROACHES, activeProduct.salesMotion)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {rawStrategy ? (
        <StrategyDisplay
          productId={activeProduct.id}
          productName={activeProduct.name}
          strategy={rawStrategy}
          generatedAt={activeProduct.strategy?.generatedAt}
        />
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground mb-4">No strategy generated yet.</p>
            <Button asChild>
              <Link href="/dashboard/brand">Complete Brand Studio first</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <PillarsPanel productId={activeProduct.id} />
    </div>
  )
}
