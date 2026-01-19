"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Activity, Sparkles, FileText, Calendar, TrendingUp, Check } from "lucide-react"
import { useRouter } from "next/navigation"

interface OnboardingStep {
  title: string
  description: string
  icon: React.ReactNode
  action?: {
    label: string
    href: string
  }
}

const steps: OnboardingStep[] = [
  {
    title: "Welcome to Founder OS",
    description: "Turn your real product work into trust-building content. No marketing experience needed.",
    icon: <Activity className="h-8 w-8" />,
  },
  {
    title: "Track Your Activity",
    description: "Add activities manually or connect GitHub to automatically track commits and PRs.",
    icon: <Activity className="h-8 w-8" />,
    action: {
      label: "Add Activity",
      href: "/dashboard/activities/new",
    },
  },
  {
    title: "Extract Insights",
    description: "AI extracts meaningful insights from your work - problem, solution, and impact.",
    icon: <Sparkles className="h-8 w-8" />,
    action: {
      label: "View Insights",
      href: "/dashboard/insights",
    },
  },
  {
    title: "Generate Content",
    description: "Create posts, blogs, and carousels from insights. All content requires your approval.",
    icon: <FileText className="h-8 w-8" />,
    action: {
      label: "View Content",
      href: "/dashboard/content",
    },
  },
  {
    title: "Schedule & Publish",
    description: "Schedule content across platforms and track performance with analytics.",
    icon: <Calendar className="h-8 w-8" />,
    action: {
      label: "View Calendar",
      href: "/dashboard/calendar",
    },
  },
]

export function OnboardingModal() {
  const [open, setOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const router = useRouter()

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem("onboarding_completed")
    if (!hasCompletedOnboarding) {
      setOpen(true)
    }
  }, [])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = () => {
    localStorage.setItem("onboarding_completed", "true")
    setOpen(false)
  }

  const handleAction = (href: string) => {
    handleComplete()
    router.push(href)
  }

  const step = steps[currentStep]
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">{step.title}</DialogTitle>
          <DialogDescription className="text-base mt-2">
            {step.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-8">
          <div className="mb-6 text-primary">
            {step.icon}
          </div>
          <Progress value={progress} className="w-full mb-4" />
          <p className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleSkip}>
            Skip
          </Button>
          {step.action ? (
            <Button onClick={() => handleAction(step.action!.href)}>
              {step.action.label}
            </Button>
          ) : (
            <Button onClick={handleNext}>
              {currentStep === steps.length - 1 ? "Get Started" : "Next"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
