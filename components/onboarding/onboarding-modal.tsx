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
    title: "Welcome to Varabhi",
    description: "We'll help you decide what to post next and why. One step at a time.",
    icon: <Activity className="h-8 w-8" />,
  },
  {
    title: "Share a story",
    description: "Tell us what you're working on. We'll turn it into one clear post angle.",
    icon: <Activity className="h-8 w-8" />,
    action: {
      label: "Share a story",
      href: "/dashboard/activities/new",
    },
  },
  {
    title: "Get your next step",
    description: "Home always shows the one thing to do next: get the angle, create a post, or review your draft.",
    icon: <Sparkles className="h-8 w-8" />,
    action: {
      label: "Go to Home",
      href: "/dashboard",
    },
  },
  {
    title: "Review and post",
    description: "Review your drafts, then approve or edit. Schedule when you're ready.",
    icon: <FileText className="h-8 w-8" />,
    action: {
      label: "View Content",
      href: "/dashboard/content",
    },
  },
  {
    title: "You're set",
    description: "Calendar and analytics are under More when you need them.",
    icon: <Calendar className="h-8 w-8" />,
    action: {
      label: "Get started",
      href: "/dashboard",
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
