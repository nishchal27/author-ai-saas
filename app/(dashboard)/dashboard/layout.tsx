import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { UserButton } from "@clerk/nextjs"
import { Target } from "lucide-react"
import { ErrorBoundary } from "@/components/error-boundary"
import { NavLinks } from "@/components/navigation/nav-links"
import { DashboardProductScope } from "@/components/navigation/dashboard-product-scope"

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
            <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Target className="h-5 w-5 text-primary" />
              <span className="text-xl font-semibold">AuthorAI</span>
            </Link>
            <DashboardProductScope />
            <NavLinks />
          </div>
          <UserButton />
        </div>
      </nav>
      <ErrorBoundary>
        <main className="container mx-auto px-4 py-8">{children}</main>
      </ErrorBoundary>
    </div>
  )
}
