"use client"

import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Activity, FileText, Settings, Sparkles, Calendar, TrendingUp, LayoutDashboard } from "lucide-react"

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/activities", icon: Activity, label: "Activities" },
  { href: "/dashboard/insights", icon: Sparkles, label: "Insights" },
  { href: "/dashboard/content", icon: FileText, label: "Content" },
  { href: "/dashboard/calendar", icon: Calendar, label: "Calendar" },
  { href: "/dashboard/analytics", icon: TrendingUp, label: "Analytics" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
]

export function NavLinks() {
  const pathname = usePathname()

  return (
    <div className="flex gap-1">
      {navItems.map((item) => {
        const isActive =
          item.href === pathname ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href))

        return (
          <Button
            key={item.href}
            variant={isActive ? "secondary" : "ghost"}
            asChild
            className={cn(
              "justify-start",
              isActive && "bg-secondary font-medium"
            )}
          >
            <Link href={item.href}>
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </Link>
          </Button>
        )
      })}
    </div>
  )
}
