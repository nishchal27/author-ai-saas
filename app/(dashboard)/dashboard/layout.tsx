import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { UserButton } from "@clerk/nextjs"
import { Target } from "lucide-react"
import { ErrorBoundary } from "@/components/error-boundary"
import { NavLinks } from "@/components/navigation/nav-links"
import { DashboardProductScope } from "@/components/navigation/dashboard-product-scope"
import { logServerError } from "@/lib/api-error"
import { ensureUserForClerkId } from "@/lib/users"
import { DashboardAuthError } from "@/components/dashboard-auth-error"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  let user
  try {
    user = await ensureUserForClerkId(userId)
  } catch (error) {
    logServerError("DashboardLayout ensureUserForClerkId", error)
    return <DashboardAuthError message={error instanceof Error ? error.message : "Something went wrong."} />
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
