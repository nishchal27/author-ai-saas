"use client"

import {
  Building2,
  Compass,
  Lightbulb,
  FileText,
  CalendarDays,
} from "lucide-react"

const steps = [
  {
    number: "1",
    icon: Building2,
    title: "Create your brand",
    description:
      "Add your business once — type, industry, audience, and voice. Start in Brand Studio.",
  },
  {
    number: "2",
    icon: Compass,
    title: "Build marketing direction",
    description:
      "Define or refine content pillars so ideas stay aligned with what you want to be known for.",
  },
  {
    number: "3",
    icon: Lightbulb,
    title: "Discover content ideas",
    description:
      "Capture ideas manually or generate them when AI is available — then save what you’ll use.",
  },
  {
    number: "4",
    icon: FileText,
    title: "Create drafts",
    description:
      "Turn ideas into platform-specific drafts in Content Studio. Edit until they sound like you.",
  },
  {
    number: "5",
    icon: CalendarDays,
    title: "Plan your week",
    description:
      "Put ideas and drafts on a simple weekly plan and track status as you go.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-y border-slate-100 bg-slate-50 py-20 lg:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How it works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A clear weekly loop: brand → direction → ideas → drafts → plan.
          </p>
        </div>

        <ol className="mx-auto mt-14 max-w-3xl space-y-6">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <li
                key={step.number}
                className="flex gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:gap-5"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    Step {step.number}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
