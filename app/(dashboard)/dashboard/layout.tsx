import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { UserButton } from "@clerk/nextjs"
import { Activity, FileText, Settings, Sparkles, Calendar, TrendingUp } from "lucide-react"
import { OnboardingModal } from "@/components/onboarding/onboarding-modal"
import { ErrorBoundary } from "@/components/error-boundary"
import { NavLinks } from "@/components/navigation/nav-links"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  // Ensure user exists in database
  let user = await db.user.findFirst({
    where: { clerkId: userId },
  })

  if (!user) {
    // Try to get user info from Clerk
    try {
      const clerkUser = await fetch(
        `https://api.clerk.com/v1/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          },
        }
      ).then((res) => res.json())

      user = await db.user.create({
        data: {
          clerkId: userId,
          email: clerkUser.email_addresses?.[0]?.email_address || "",
          name: clerkUser.first_name || clerkUser.username || null,
        },
      })
    } catch (error) {
      // Fallback: create user with minimal info
      user = await db.user.create({
        data: {
          clerkId: userId,
          email: `${userId}@temp.com`,
        },
      })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-xl font-semibold hover:opacity-80 transition-opacity">
              Founder OS
            </Link>
            <NavLinks />
          </div>
          <UserButton />
        </div>
      </nav>
      <ErrorBoundary>
        <main className="container mx-auto px-4 py-8">{children}</main>
      </ErrorBoundary>
      <OnboardingModal />
    </div>
  )
}
