"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, Plus, CheckCircle2, XCircle } from "lucide-react"
import { format, startOfWeek, addDays, isSameDay, isToday, addWeeks, subWeeks } from "date-fns"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

async function fetchSchedules(startDate: Date, endDate: Date) {
  const res = await fetch(
    `/api/schedules?start=${startDate.toISOString()}&end=${endDate.toISOString()}`
  )
  if (!res.ok) throw new Error("Failed to fetch schedules")
  return res.json()
}

async function fetchDrafts() {
  const res = await fetch("/api/content/drafts?status=approved")
  if (!res.ok) throw new Error("Failed to fetch drafts")
  return res.json()
}

async function createSchedule(data: {
  contentDraftId: string
  platform: string
  scheduledAt: string
}) {
  const res = await fetch("/api/schedules", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to create schedule")
  return res.json()
}

async function deleteSchedule(id: string) {
  const res = await fetch(`/api/schedules/${id}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Failed to delete schedule")
  return res.json()
}

export default function CalendarPage() {
  const { toast } = useToast()
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const queryClient = useQueryClient()

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const weekEnd = addDays(weekStart, 6)

  const { data: schedulesData } = useQuery({
    queryKey: ["schedules", weekStart.toISOString(), weekEnd.toISOString()],
    queryFn: () => fetchSchedules(weekStart, weekEnd),
  })

  const { data: draftsData } = useQuery({
    queryKey: ["drafts", "approved"],
    queryFn: fetchDrafts,
  })

  const schedules = schedulesData?.schedules || []
  const drafts = draftsData?.drafts || []

  const createMutation = useMutation({
    mutationFn: createSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] })
      toast({
        title: "Content scheduled",
        description: "Your content has been scheduled for publishing.",
        variant: "success",
      })
      setIsDialogOpen(false)
      setSelectedDate(null)
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule content",
        variant: "destructive",
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] })
      toast({
        title: "Schedule cancelled",
        description: "The scheduled content has been removed.",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel schedule",
        variant: "destructive",
      })
    },
  })

  const getSchedulesForDate = (date: Date) => {
    return schedules.filter((schedule: any) =>
      isSameDay(new Date(schedule.scheduledAt), date)
    )
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setIsDialogOpen(true)
  }

  const handleSchedule = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const contentDraftId = formData.get("draftId") as string
    const platform = formData.get("platform") as string
    const date = formData.get("date") as string
    const time = formData.get("time") as string

    if (!selectedDate || !contentDraftId || !platform || !date || !time) return

    const scheduledAt = new Date(`${date}T${time}`)
    createMutation.mutate({
      contentDraftId,
      platform,
      scheduledAt: scheduledAt.toISOString(),
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Calendar</h1>
          <p className="text-muted-foreground mt-2">
            Schedule and manage your content publishing
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
          >
            Previous Week
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentWeek(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
          >
            Next Week
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day, index) => {
              const daySchedules = getSchedulesForDate(day)
              return (
                <div
                  key={index}
                  className={cn(
                    "border rounded-lg p-2 min-h-[120px] transition-colors",
                    isToday(day) && "bg-primary/5 border-primary/30",
                    !isToday(day) && "hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium">
                        {format(day, "EEE")}
                      </p>
                      <p
                        className={`text-lg ${
                          isToday(day) ? "font-bold" : ""
                        }`}
                      >
                        {format(day, "d")}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDateClick(day)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {daySchedules.map((schedule: any) => {
                      const isLinkedIn = schedule.platform?.toLowerCase() === "linkedin"
                      const isTwitter = schedule.platform?.toLowerCase() === "twitter"
                      const platformBadgeClass = isLinkedIn
                        ? "text-xs border-platform-linkedin/30 bg-platform-linkedin-muted text-platform-linkedin"
                        : isTwitter
                          ? "text-xs border-platform-twitter/30 bg-platform-twitter-muted text-platform-twitter"
                          : "text-xs"
                      return (
                        <div
                          key={schedule.id}
                          className={cn(
                            "text-xs p-2 rounded cursor-pointer transition-colors",
                            schedule.status === "published" &&
                              "bg-success-muted border border-success/30 hover:bg-success-muted/80",
                            schedule.status === "failed" &&
                              "bg-destructive/10 border border-destructive/30 hover:bg-destructive/20",
                            schedule.status === "pending" &&
                              "bg-primary/10 border border-primary/20 hover:bg-primary/20"
                          )}
                          onClick={() => {}}
                        >
                          <div className="flex items-center gap-1 mb-1">
                            <Badge variant="outline" className={platformBadgeClass}>
                              {schedule.platform}
                            </Badge>
                            <span className="text-muted-foreground">
                              {format(new Date(schedule.scheduledAt), "HH:mm")}
                            </span>
                            {schedule.status === "published" && (
                              <CheckCircle2 className="h-3 w-3 text-success ml-auto" />
                            )}
                            {schedule.status === "failed" && (
                              <XCircle className="h-3 w-3 text-destructive ml-auto" />
                            )}
                          </div>
                          <p className="truncate font-medium">
                            {schedule.contentDraft?.title || "Scheduled post"}
                          </p>
                          {schedule.status === "failed" && schedule.errorMessage && (
                            <p className="text-destructive text-[10px] mt-1 truncate" title={schedule.errorMessage}>
                              {schedule.errorMessage}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Content</DialogTitle>
            <DialogDescription>
              Schedule approved content for publishing
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSchedule}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="draftId">Content Draft</Label>
                <Select name="draftId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select content" />
                  </SelectTrigger>
                  <SelectContent>
                    {drafts.map((draft: any) => (
                      <SelectItem key={draft.id} value={draft.id}>
                        {draft.title || `${draft.type} for ${draft.platform || "general"}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Select name="platform" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="twitter">Twitter/X</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="blog">Blog</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  name="date"
                  type="date"
                  defaultValue={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  name="time"
                  type="time"
                  defaultValue="09:00"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} variant="default">
                <Calendar className="mr-2 h-4 w-4" />
                Schedule
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
