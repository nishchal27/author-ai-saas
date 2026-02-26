"use client"

import { SignOutButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"

export function DashboardAuthError({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
      <p className="text-center text-muted-foreground">{message}</p>
      <div className="flex gap-2">
        <Button variant="outline" asChild>
          <a href="/dashboard">Try again</a>
        </Button>
        <SignOutButton>
          <Button>Sign out</Button>
        </SignOutButton>
      </div>
    </div>
  )
}
