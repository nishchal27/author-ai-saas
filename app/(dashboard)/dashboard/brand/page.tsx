"use client"

import { useQuery } from "@tanstack/react-query"
import { AlertCircle, Building2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { BrandProfileForm } from "@/components/brand/brand-profile-form"
import { BrandProposalPanel } from "@/components/brand/brand-proposal-panel"
import { BrandSuggestionsPanel } from "@/components/brand/brand-suggestions-panel"
import { queryKeys } from "@/lib/query-keys"
import { Button } from "@/components/ui/button"
import Link from "next/link"

async function fetchProducts() {
  const res = await fetch("/api/products")
  if (!res.ok) throw new Error("Failed to fetch products")
  return res.json()
}

async function fetchProduct(id: string) {
  const res = await fetch(`/api/products/${id}`)
  if (!res.ok) throw new Error("Failed to fetch product")
  return res.json()
}

async function fetchBrand(id: string) {
  const res = await fetch(`/api/products/${id}/brand`)
  if (!res.ok) throw new Error("Failed to fetch brand")
  return res.json()
}

function statusBadge(status?: string) {
  if (status === "approved") {
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">Approved</Badge>
  }
  if (status === "proposed") {
    return <Badge variant="secondary">Proposed — needs approval</Badge>
  }
  return <Badge variant="outline">Incomplete</Badge>
}

export default function BrandStudioPage() {
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: queryKeys.products,
    queryFn: fetchProducts,
  })

  const productId =
    productsData?.activeProductId || productsData?.products?.[0]?.id || null

  const {
    data: productData,
    isLoading: productLoading,
    isError: productError,
  } = useQuery({
    queryKey: queryKeys.product(productId || "none"),
    queryFn: () => fetchProduct(productId!),
    enabled: Boolean(productId),
  })

  const {
    data: brand,
    isLoading: brandLoading,
    isError: brandError,
    error: brandErr,
  } = useQuery({
    queryKey: queryKeys.brand(productId || "none"),
    queryFn: () => fetchBrand(productId!),
    enabled: Boolean(productId),
  })

  if (productsLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!productId) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <Building2 className="mx-auto mb-4 h-10 w-10 text-primary" />
        <h1 className="text-2xl font-semibold">Brand Studio</h1>
        <p className="mt-2 text-muted-foreground">
          Add a brand first, then teach Varabhi what makes it unique.
        </p>
        <Button asChild className="mt-6">
          <Link href="/dashboard?addBrand=1">Add your brand</Link>
        </Button>
      </div>
    )
  }

  const product = productData?.product
  const missing = brand?.context?.missingFields || []

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Brand Studio
          </h1>
          <p className="mt-1 text-muted-foreground">
            Teach Varabhi about your brand. Approve facts before they ground content.
          </p>
        </div>
        {statusBadge(brand?.status)}
      </div>

      {(productError || brandError) && (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-4 w-4 text-destructive" />
              Couldn’t load brand data
            </CardTitle>
            <CardDescription>
              {(brandErr as Error)?.message || "Try refreshing the page."}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile</CardTitle>
          <CardDescription>
            These fields are user-provided. Saving them does not auto-approve AI summaries.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {productError ? (
            <p className="text-sm text-muted-foreground">
              Brand profile unavailable until the brand loads successfully.
            </p>
          ) : productLoading || !product ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <BrandProfileForm product={product} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Completeness</CardTitle>
          <CardDescription>
            Completing these helps proposals stay accurate. No score is invented.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {brandLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : missing.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No critical gaps reported for this brand right now.
            </p>
          ) : (
            <ul className="list-inside list-disc text-sm text-muted-foreground">
              {missing.map((field: string) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Brand summary & approval</CardTitle>
          <CardDescription>
            Write a summary manually or generate with AI, edit freely, then approve
            explicitly. Approved context is never replaced until you approve again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {brandLoading || !brand ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <BrandProposalPanel
              productId={productId}
              brand={brand}
              profileDescription={product?.description}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Suggestions</CardTitle>
          <CardDescription>
            Optional tips to strengthen your profile. Not treated as approved facts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BrandSuggestionsPanel productId={productId} />
        </CardContent>
      </Card>
    </div>
  )
}
