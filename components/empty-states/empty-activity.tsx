"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Activity, Plus } from "lucide-react"
import Link from "next/link"

export function EmptyActivity() {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No activities yet</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
          Start by adding your first activity. This could be a feature you built, a problem you solved, or feedback you received.
        </p>
        <Button asChild>
          <Link href="/dashboard/activities/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Activity
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
