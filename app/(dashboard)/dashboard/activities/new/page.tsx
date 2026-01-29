"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

async function createActivity(data: {
  type: string
  title: string
  description?: string
}) {
  const res = await fetch("/api/activities", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to create activity")
  return res.json()
}

export default function NewActivityPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    type: "manual",
    title: "",
    description: "",
  })

  const mutation = useMutation({
    mutationFn: createActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] })
      queryClient.invalidateQueries({ queryKey: ["guide-next"] })
      toast({
        title: "Story saved",
        description: "Go to Home to get the angle and create a post.",
        variant: "success",
      })
      router.push("/dashboard")
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create activity",
        variant: "destructive",
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Share a story</h1>
        <p className="text-muted-foreground mt-2">
          What do you want to share with your audience? We'll help you turn it into one clear post angle.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your story</CardTitle>
          <CardDescription>
            What's the story? Who cares and why?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">What do you want to share? *</Label>
              <Input
                id="title"
                placeholder="e.g., We're optimizing performance and sharing before/after"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">More details (optional)</Label>
              <Textarea
                id="description"
                placeholder="Add context, who it helps, or why it matters..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save story
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
