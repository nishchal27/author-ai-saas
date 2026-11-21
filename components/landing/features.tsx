"use client"

import {
  Building2,
  Compass,
  Lightbulb,
  PenLine,
  CalendarDays,
} from "lucide-react"

const modules = [
  {
    icon: Building2,
    title: "Brand Studio",
    description:
      "Teach Varabhi about your business, audience, and voice. Approve facts before they guide content.",
    preview: "Profile · summary · approved facts",
  },
  {
    icon: Compass,
    title: "Marketing Intelligence",
    description:
      "Organize marketing direction and content pillars so every idea has a clear theme.",
    preview: "Pillars · approve · reorder",
  },
  {
    icon: Lightbulb,
    title: "Content Ideas",
    description:
      "Discover and organize relevant ideas — create them manually anytime, generate when AI is configured.",
    preview: "Ideas board · save · edit",
  },
  {
    icon: PenLine,
    title: "Content Studio",
    description:
      "Turn ideas into platform-specific drafts you can review, edit, and reuse.",
    preview: "Drafts · platforms · refine",
  },
  {
    icon: CalendarDays,
    title: "Content Planner",
    description:
      "Organize and track weekly marketing activities without a full social publishing stack.",
    preview: "Weekly plan · status · focus",
  },
]

export function Features() {
  return (
    <section id="features" className="py-20 lg:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Five modules. One marketing workspace.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Built around what small brands actually need — not a checklist of enterprise tools.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-5 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod) => {
            const Icon = mod.icon
            return (
              <article
                key={mod.title}
                className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{mod.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {mod.description}
                </p>
                <div className="mt-4 rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  {mod.preview}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
