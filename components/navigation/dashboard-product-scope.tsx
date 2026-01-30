"use client"

import { ProductSwitcher } from "@/components/navigation/product-switcher"

export function DashboardProductScope() {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
        Working on:
      </span>
      <ProductSwitcher compact={false} />
    </div>
  )
}
