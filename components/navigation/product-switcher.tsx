"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Package, Plus, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

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

export function ProductSwitcher({ compact = false, onAddProduct }: ProductSwitcherProps) {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  })

  const switchProduct = useMutation({
    mutationFn: async (productId: string) => {
      const res = await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeProductId: productId }),
      })
      if (!res.ok) throw new Error("Failed to switch product")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      // Refresh other data that depends on active product
      queryClient.invalidateQueries({ queryKey: ["activities"] })
      queryClient.invalidateQueries({ queryKey: ["insights"] })
      queryClient.invalidateQueries({ queryKey: ["drafts"] })
    },
  })

  const products: Product[] = data?.products || []
  const activeProductId = data?.activeProductId
  const activeProduct = products.find(p => p.id === activeProductId) || products[0]

  if (isLoading) {
    return (
      <div className="h-10 w-40 bg-muted animate-pulse rounded-md" />
    )
  }

  if (products.length === 0) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onAddProduct}
        className="text-muted-foreground"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Product
      </Button>
    )
  }

  if (compact || products.length === 1) {
    return (
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{activeProduct?.name}</span>
        {products.length > 1 && (
          <Badge variant="secondary" className="text-xs">
            +{products.length - 1}
          </Badge>
        )}
      </div>
    )
  }

  return (
    <Select
      value={activeProduct?.id || ""}
      onValueChange={(value) => {
        if (value === "add-new") {
          onAddProduct?.()
        } else {
          switchProduct.mutate(value)
        }
      }}
    >
      <SelectTrigger className="w-[200px] border-dashed">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <SelectValue>
            {activeProduct?.name || "Select product"}
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent>
        {products.map((product) => (
          <SelectItem key={product.id} value={product.id}>
            <div className="flex items-center justify-between w-full">
              <span>{product.name}</span>
              <span className="text-xs text-muted-foreground ml-2">
                {product.type}
              </span>
            </div>
          </SelectItem>
        ))}
        <SelectItem value="add-new" className="border-t mt-1 pt-1">
          <div className="flex items-center gap-2 text-primary">
            <Plus className="h-4 w-4" />
            Add new product
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
