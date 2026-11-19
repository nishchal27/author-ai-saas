"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { NavLinks } from "@/components/navigation/nav-links"
import { ProductSwitcher } from "@/components/navigation/product-switcher"
import { PRODUCT_NAME } from "@/lib/constants"

export function MobileNav({ onAddProduct }: { onAddProduct?: () => void }) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:max-w-sm">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            {PRODUCT_NAME}
          </SheetTitle>
        </SheetHeader>
        <div className="mb-6 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Working on
          </p>
          <ProductSwitcher compact={false} onAddProduct={onAddProduct} />
        </div>
        <NavLinks orientation="vertical" onNavigate={() => setOpen(false)} />
        <div className="mt-8 border-t pt-4">
          <p className="mb-2 text-xs text-muted-foreground">
            Advanced routes remain available:
          </p>
          <div className="flex flex-col gap-1 text-sm">
            <Link
              href="/dashboard/calendar"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              Calendar
            </Link>
            <Link
              href="/dashboard/analytics"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              Analytics
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
