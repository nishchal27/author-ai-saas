"use client"

import { ProductSwitcher } from "@/components/navigation/product-switcher"

export function DashboardProductScope({
  onAddProduct,
}: {
  onAddProduct?: () => void
}) {
  return (
    <div className="hidden items-center gap-2 md:flex">
      <span className="hidden text-sm font-medium text-muted-foreground whitespace-nowrap lg:inline">
        Working on:
      </span>
      <ProductSwitcher compact={false} onAddProduct={onAddProduct} />
    </div>
  )
}
