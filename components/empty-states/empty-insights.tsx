"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, ArrowRight } from "lucide-react"
import Link from "next/link"

export function EmptyInsights() {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No angles yet</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
          Share a story on Home to get your first post angle.
        </p>
        <Button asChild variant="outline">
          <Link href="/dashboard">
            Go to Home
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
