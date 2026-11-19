"use client"

import { useState } from "react"
import Link from "next/link"
import { UserButton } from "@clerk/nextjs"
import { Target } from "lucide-react"
import { PRODUCT_NAME } from "@/lib/constants"
import { NavLinks } from "@/components/navigation/nav-links"
import { DashboardProductScope } from "@/components/navigation/dashboard-product-scope"
import { MobileNav } from "@/components/navigation/mobile-nav"
import { ProductOnboarding } from "@/components/onboarding/product-onboarding"

export function DashboardHeader() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const openAdd = () => setShowOnboarding(true)

  return (
    <>
      <nav className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto flex h-16 items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <MobileNav onAddProduct={openAdd} />
            <Link
              href="/dashboard"
              className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-80"
            >
              <Target className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold sm:text-xl">
                {PRODUCT_NAME}
              </span>
            </Link>
            <DashboardProductScope onAddProduct={openAdd} />
            <NavLinks />
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>
      <ProductOnboarding
        open={showOnboarding}
        onOpenChange={setShowOnboarding}
      />
    </>
  )
}
