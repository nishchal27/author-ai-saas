"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Package,
  Sparkles,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DashboardSkeleton } from "@/components/loading/dashboard-skeleton"
import { ProductOnboarding } from "@/components/onboarding/product-onboarding"
import { queryKeys } from "@/lib/query-keys"
import { useSearchParams } from "next/navigation"

async function fetchProducts() {
  const res = await fetch("/api/products")
  if (!res.ok) throw new Error("Failed to fetch products")
  return res.json()
}

async function fetchGuide(productId: string) {
  const res = await fetch(`/api/guide/next?productId=${productId}`)
  if (!res.ok) throw new Error("Failed to fetch next action")
  return res.json()
}

async function fetchBrand(productId: string) {
  const res = await fetch(`/api/products/${productId}/brand`)
  if (!res.ok) throw new Error("Failed to fetch brand")
  return res.json()
}

async function fetchPillars(productId: string) {
  const res = await fetch(`/api/products/${productId}/pillars`)
  if (!res.ok) throw new Error("Failed to fetch pillars")
  return res.json()
}

async function fetchIdeas(productId: string) {
  const res = await fetch(`/api/products/${productId}/ideas`)
  if (!res.ok) throw new Error("Failed to fetch ideas")
  return res.json()
}

async function fetchPlan(productId: string) {
  const res = await fetch(`/api/products/${productId}/plan`)
  if (!res.ok) throw new Error("Failed to fetch plan")
  return res.json()
}

async function fetchDrafts() {
  const res = await fetch("/api/content/drafts?scope=active")
  if (!res.ok) throw new Error("Failed to fetch drafts")
  return res.json()
}

function statusBadge(status?: string) {
  switch (status) {
    case "approved":
      return <Badge className="bg-emerald-600 hover:bg-emerald-600">Approved</Badge>
    case "proposed":
      return <Badge variant="secondary">Awaiting approval</Badge>
    default:
      return <Badge variant="outline">Incomplete</Badge>
  }
}

export default function OverviewPage() {
  const searchParams = useSearchParams()
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    if (searchParams.get("addBrand") === "1") setShowOnboarding(true)
  }, [searchParams])

  const {
    data: productsData,
    isLoading: productsLoading,
    isError: productsError,
  } = useQuery({
    queryKey: queryKeys.products,
    queryFn: fetchProducts,
  })

  const products = productsData?.products || []
  const activeProductId =
    productsData?.activeProductId || products[0]?.id || null
  const activeProduct = products.find(
    (p: { id: string }) => p.id === activeProductId
  )

  const enabled = Boolean(activeProductId)

  const { data: guide, isLoading: guideLoading } = useQuery({
    queryKey: queryKeys.guide(activeProductId),
    queryFn: () => fetchGuide(activeProductId!),
    enabled,
  })

  const { data: brand, isLoading: brandLoading } = useQuery({
    queryKey: queryKeys.brand(activeProductId || "none"),
    queryFn: () => fetchBrand(activeProductId!),
    enabled,
  })

  const { data: pillarsData } = useQuery({
    queryKey: queryKeys.pillars(activeProductId || "none"),
    queryFn: () => fetchPillars(activeProductId!),
    enabled,
  })

  const { data: ideasData } = useQuery({
    queryKey: queryKeys.ideas(activeProductId || "none"),
    queryFn: () => fetchIdeas(activeProductId!),
    enabled,
  })

  const { data: planData } = useQuery({
    queryKey: queryKeys.plan(activeProductId || "none"),
    queryFn: () => fetchPlan(activeProductId!),
    enabled,
  })

  const { data: draftsData } = useQuery({
    queryKey: queryKeys.drafts("active"),
    queryFn: fetchDrafts,
    enabled,
  })

  const attention = useMemo(() => {
    const items: { id: string; label: string; href: string }[] = []
    if (brand?.status === "proposed") {
      items.push({
        id: "brand-approve",
        label: "Brand summary awaiting your approval",
        href: "/dashboard/brand",
      })
    }
    const proposedPillars = (pillarsData?.pillars || []).filter(
      (p: { approvalStatus: string; isActive: boolean }) =>
        p.isActive && p.approvalStatus === "proposed"
    )
    if (proposedPillars.length > 0) {
      items.push({
        id: "pillars",
        label: `${proposedPillars.length} content pillar${proposedPillars.length === 1 ? "" : "s"} awaiting review`,
        href: "/dashboard/strategy",
      })
    }
    const ideasWithoutDraft = (ideasData?.ideas || []).filter(
      (i: { status: string; drafts?: unknown[] }) =>
        (i.status === "saved" || i.status === "proposed") &&
        (!i.drafts || i.drafts.length === 0)
    )
    if (ideasWithoutDraft.length > 0) {
      items.push({
        id: "ideas",
        label: `${ideasWithoutDraft.length} saved idea${ideasWithoutDraft.length === 1 ? "" : "s"} without drafts`,
        href: "/dashboard/content",
      })
    }
    const drafts = (draftsData?.drafts || []) as {
      status: string
      productId?: string
    }[]
    const draftList = drafts.filter(
      (d) =>
        d.status === "draft" &&
        (!activeProductId || d.productId === activeProductId)
    )
    if (draftList.length > 0) {
      items.push({
        id: "drafts",
        label: `${draftList.length} draft${draftList.length === 1 ? "" : "s"} needing review`,
        href: "/dashboard/content",
      })
    }
    return items
  }, [brand, pillarsData, ideasData, draftsData, activeProductId])

  const planItems = planData?.plan?.items || []
  const planCompleted = planItems.filter(
    (i: { status: string }) => i.status === "completed"
  ).length

  if (productsLoading) return <DashboardSkeleton />

  if (productsError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Couldn’t load your brands</CardTitle>
          <CardDescription>Refresh the page or try again shortly.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (products.length === 0) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center py-16 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Package className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome to Varabhi</h1>
        <p className="mt-2 text-muted-foreground">
          Add your brand once. We’ll help you approve facts, decide what to create,
          and draft on-brand content.
        </p>
        <Button size="lg" className="mt-6" onClick={() => setShowOnboarding(true)}>
          Add your brand
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <ProductOnboarding
          open={showOnboarding}
          onOpenChange={setShowOnboarding}
        />
      </div>
    )
  }

  const missing = brand?.context?.missingFields || []
  const loadingBrand = brandLoading || guideLoading

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Overview
        </h1>
        <p className="mt-1 text-muted-foreground">
          Your next useful step for{" "}
          <span className="font-medium text-foreground">
            {activeProduct?.name || "your brand"}
          </span>
          .
        </p>
      </div>

      {/* Brand readiness */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-lg">Brand readiness</CardTitle>
            <CardDescription>
              Approved brand context grounds every idea and draft.
            </CardDescription>
          </div>
          {statusBadge(brand?.status)}
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingBrand ? (
            <p className="text-sm text-muted-foreground">Loading brand status…</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-base font-medium">{brand?.name || activeProduct?.name}</p>
                {brand?.context?.hasApprovedContext ? (
                  <span className="inline-flex items-center gap-1 text-sm text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Trusted context ready
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-sm text-amber-700">
                    <AlertCircle className="h-4 w-4" />
                    Not yet approved for generation
                  </span>
                )}
              </div>
              {missing.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium">Missing information</p>
                  <ul className="list-inside list-disc text-sm text-muted-foreground">
                    {missing.map((field: string) => (
                      <li key={field}>{field}</li>
                    ))}
                  </ul>
                </div>
              )}
              <Button asChild variant={brand?.status === "approved" ? "outline" : "default"}>
                <Link href="/dashboard/brand">
                  {brand?.status === "approved"
                    ? "Review Brand Studio"
                    : brand?.status === "proposed"
                      ? "Review and approve"
                      : "Complete Brand Studio"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Next action */}
      <Card className="border-primary/25">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Next action
          </CardTitle>
          <CardDescription>
            {guide?.reason || "We’ll suggest one clear step once your brand loads."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {guide?.cta && guide?.href ? (
            <Button asChild size="lg">
              <Link href={guide.href}>
                {guide.cta}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link href="/dashboard/brand">Open Brand Studio</Link>
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* This week */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">This week</CardTitle>
            <CardDescription>Simple plan progress for the selected brand.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {planItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing planned yet. Add ideas or drafts when you’re ready.
              </p>
            ) : (
              <p className="text-sm">
                <span className="text-xl font-semibold">{planCompleted}</span>
                <span className="text-muted-foreground">
                  {" "}
                  of {planItems.length} completed
                </span>
              </p>
            )}
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/plan">
                Open Content Planner
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Needs attention */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Needs attention</CardTitle>
            <CardDescription>Only items that unblock useful work.</CardDescription>
          </CardHeader>
          <CardContent>
            {attention.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You’re clear — no urgent brand or content blockers.
              </p>
            ) : (
              <ul className="space-y-2">
                {attention.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="flex items-start gap-2 text-sm text-foreground hover:underline"
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <ProductOnboarding
        open={showOnboarding}
        onOpenChange={setShowOnboarding}
      />
    </div>
  )
}
