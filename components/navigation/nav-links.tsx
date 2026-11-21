"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Building2,
  Target,
  FileText,
  CalendarCheck,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const PRIMARY_NAV = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Overview",
    shortLabel: "Overview",
    exact: true,
  },
  {
    href: "/dashboard/brand",
    icon: Building2,
    label: "Brand Studio",
    shortLabel: "Brand",
  },
  {
    href: "/dashboard/strategy",
    icon: Target,
    label: "Marketing Intelligence",
    shortLabel: "Strategy",
  },
  {
    href: "/dashboard/content",
    icon: FileText,
    label: "Content Studio",
    shortLabel: "Content",
  },
  {
    href: "/dashboard/plan",
    icon: CalendarCheck,
    label: "Content Planner",
    shortLabel: "Plan",
  },
  {
    href: "/dashboard/settings",
    icon: Settings,
    label: "Settings",
    shortLabel: "Settings",
  },
] as const

function isActivePath(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function NavLinks({
  orientation = "horizontal",
  onNavigate,
}: {
  orientation?: "horizontal" | "vertical"
  onNavigate?: () => void
}) {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        orientation === "horizontal"
          ? "hidden items-center gap-0.5 lg:flex"
          : "flex flex-col gap-1"
      )}
      aria-label="Primary"
    >
      {PRIMARY_NAV.map((item) => {
        const active = isActivePath(pathname, item.href, "exact" in item ? item.exact : false)
        return (
          <Button
            key={item.href}
            variant={active ? "secondary" : "ghost"}
            asChild
            className={cn(
              "justify-start px-2.5",
              active && "bg-secondary font-medium"
            )}
          >
            <Link href={item.href} onClick={onNavigate} title={item.label}>
              <item.icon className="mr-2 h-4 w-4 shrink-0" />
              <span className={orientation === "vertical" ? "inline" : "hidden xl:inline"}>
                {orientation === "vertical" ? item.label : item.shortLabel}
              </span>
              {orientation === "horizontal" && (
                <span className="xl:hidden sr-only">{item.label}</span>
              )}
            </Link>
          </Button>
        )
      })}
    </nav>
  )
}
