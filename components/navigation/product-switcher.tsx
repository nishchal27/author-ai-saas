"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Package, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { clearBrandScopedQueries, queryKeys } from "@/lib/query-keys"

interface Product {
  id: string
  name: string
  type: string
  stage: string
  isActive: boolean
}

interface ProductSwitcherProps {
  compact?: boolean
  onAddProduct?: () => void
}

async function fetchProducts() {
  const res = await fetch("/api/products")
  if (!res.ok) throw new Error("Failed to fetch products")
  return res.json()
}

export function ProductSwitcher({
  compact = false,
  onAddProduct,
}: ProductSwitcherProps) {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.products,
    queryFn: fetchProducts,
  })

  const switchProduct = useMutation({
    mutationFn: async (productId: string) => {
      const res = await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeProductId: productId }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Failed to switch product")
      }
      return res.json() as Promise<{ activeProductId: string }>
    },
    onSuccess: (result) => {
      clearBrandScopedQueries(queryClient)
      queryClient.setQueryData(
        queryKeys.products,
        (old: { products?: Product[]; activeProductId?: string | null } | undefined) => {
          if (!old) return old
          return {
            ...old,
            activeProductId: result.activeProductId,
          }
        }
      )
    },
  })

  const products: Product[] = data?.products || []
  const activeProductId = data?.activeProductId as string | null | undefined
  const activeFromServer = activeProductId
    ? products.find((p) => p.id === activeProductId)
    : undefined
  const activeProduct = activeFromServer || products[0]
  const selectValue =
    activeFromServer?.id ||
    (activeProductId && products.some((p) => p.id === activeProductId)
      ? activeProductId
      : activeProduct?.id) ||
    ""

  if (isLoading) {
    return <div className="h-10 w-40 animate-pulse rounded-md bg-muted" />
  }

  if (products.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onAddProduct}
        className="text-muted-foreground"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add brand
      </Button>
    )
  }

  if (compact && products.length === 1) {
    return (
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{activeProduct?.name}</span>
      </div>
    )
  }

  return (
    <Select
      value={selectValue}
      onValueChange={(value) => {
        if (value === "add-new") {
          onAddProduct?.()
        } else if (value !== selectValue) {
          switchProduct.mutate(value)
        }
      }}
      disabled={switchProduct.isPending}
    >
      <SelectTrigger className="w-[min(100%,200px)] border-dashed">
        <div className="flex min-w-0 items-center gap-2">
          <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
          <SelectValue>
            <span className="truncate">
              {activeProduct?.name || "Select brand"}
            </span>
          </SelectValue>
          {products.length > 1 && (
            <Badge variant="secondary" className="ml-1 hidden text-xs sm:inline-flex">
              {products.length}
            </Badge>
          )}
        </div>
      </SelectTrigger>
      <SelectContent>
        {products.map((product) => (
          <SelectItem key={product.id} value={product.id}>
            <div className="flex w-full items-center justify-between">
              <span>{product.name}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                {product.type}
              </span>
            </div>
          </SelectItem>
        ))}
        <SelectItem value="add-new" className="mt-1 border-t pt-1">
          <div className="flex items-center gap-2 text-primary">
            <Plus className="h-4 w-4" />
            Add new brand
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
