import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { ErrorBoundary } from "@/components/error-boundary"
import { DashboardHeader } from "@/components/navigation/dashboard-header"
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

  try {
    await ensureUserForClerkId(userId)
  } catch (error) {
    logServerError("DashboardLayout ensureUserForClerkId", error)
    return (
      <DashboardAuthError
        message={
          error instanceof Error ? error.message : "Something went wrong."
        }
      />
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <ErrorBoundary>
        <main className="container mx-auto px-4 py-6 sm:py-8">{children}</main>
      </ErrorBoundary>
    </div>
  )
}
