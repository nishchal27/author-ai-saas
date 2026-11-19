"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { CalendarCheck, ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { queryKeys } from "@/lib/query-keys"
import { Skeleton } from "@/components/ui/skeleton"

async function fetchProducts() {
  const res = await fetch("/api/products")
  if (!res.ok) throw new Error("Failed to fetch products")
  return res.json()
}

async function fetchPlan(productId: string) {
  const res = await fetch(`/api/products/${productId}/plan`)
  if (!res.ok) throw new Error("Failed to fetch plan")
  return res.json()
}

/**
 * Phase 4.2 placeholder — weekly plan API exists; full planner UX is Phase 4.3.
 */
export default function ContentPlannerPage() {
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: queryKeys.products,
    queryFn: fetchProducts,
  })

  const productId =
    productsData?.activeProductId || productsData?.products?.[0]?.id || null

  const { data: planData, isLoading: planLoading } = useQuery({
    queryKey: queryKeys.plan(productId || "none"),
    queryFn: () => fetchPlan(productId!),
    enabled: Boolean(productId),
  })

  const items = planData?.plan?.items || []
  const completed = items.filter((i: { status: string }) => i.status === "completed").length

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Content Planner
        </h1>
        <p className="mt-1 text-muted-foreground">
          A simple weekly checklist for ideas and drafts — not a publishing calendar.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarCheck className="h-5 w-5 text-primary" />
                This week
              </CardTitle>
              <CardDescription>
                Full planning workflows arrive in the next phase. You can already see
                progress for the selected brand.
              </CardDescription>
            </div>
            <Badge variant="secondary">Preview</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {productsLoading || planLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : !productId ? (
            <p className="text-sm text-muted-foreground">
              Add a brand first, then plan the week.
            </p>
          ) : items.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                No items planned for this week yet. Create ideas or drafts in Content
                Studio, then return here to organize them.
              </p>
              <Button asChild variant="outline">
                <Link href="/dashboard/content">
                  Go to Content Studio
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm">
                <span className="font-medium">
                  {completed} of {items.length}
                </span>{" "}
                items completed
              </p>
              <ul className="divide-y rounded-md border">
                {items.map(
                  (item: {
                    id: string
                    status: string
                    contentIdea?: { title?: string } | null
                    contentDraft?: { title?: string } | null
                  }) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between px-3 py-2 text-sm"
                    >
                      <span>
                        {item.contentIdea?.title ||
                          item.contentDraft?.title ||
                          "Plan item"}
                      </span>
                      <Badge variant="outline">{item.status.replace("_", " ")}</Badge>
                    </li>
                  )
                )}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
