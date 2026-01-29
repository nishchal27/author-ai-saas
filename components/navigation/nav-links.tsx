"use client"

import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { FileText, Settings, LayoutDashboard, Target, Calendar, TrendingUp, ChevronDown } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/dashboard/strategy", icon: Target, label: "Strategy" },
  { href: "/dashboard/content", icon: FileText, label: "Content" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
]

const moreItems = [
  { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
  { href: "/dashboard/analytics", label: "Analytics", icon: TrendingUp },
]

export function NavLinks() {
  const pathname = usePathname()
  const router = useRouter()
  const isMoreActive = moreItems.some((item) => pathname.startsWith(item.href))

  return (
    <div className="flex items-center gap-1">
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
      <Select
        onValueChange={(value) => {
          if (value) router.push(value)
        }}
      >
        <SelectTrigger
          className={cn(
            "w-[100px] justify-between border-0 bg-transparent shadow-none hover:bg-secondary",
            isMoreActive && "bg-secondary font-medium"
          )}
        >
          <SelectValue placeholder="More" />
          <ChevronDown className="h-4 w-4 opacity-50" />
        </SelectTrigger>
        <SelectContent>
          {moreItems.map((item) => (
            <SelectItem key={item.href} value={item.href}>
              <span className="flex items-center gap-2">
                <item.icon className="h-4 w-4" />
                {item.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
