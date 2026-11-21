"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Target, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { PRODUCT_NAME } from "@/lib/constants"

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-16 lg:pt-36 lg:pb-24">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-white" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.06),transparent_55%)]" />

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 shadow-sm">
            <Target className="h-4 w-4 text-primary" />
            {PRODUCT_NAME} — brand-aware marketing workspace
          </p>

          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
            Teach {PRODUCT_NAME} about your brand.
            <span className="mt-2 block text-primary">
              Decide what to create. Stay consistent.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            A practical workspace for small businesses and solo founders to capture
            brand identity, organize marketing direction, turn ideas into drafts,
            and plan the week — without pretending to auto-publish for you.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link href="/sign-up">
                Start free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
              <Link href="#features">Explore features</Link>
            </Button>
          </div>

          <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Brand Studio
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Ideas & drafts
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Weekly planner
            </li>
          </ul>
        </div>

        {/* Product UI preview */}
        <div className="mx-auto mt-14 max-w-5xl">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              <span className="ml-3 text-xs text-muted-foreground">
                Overview · next action for your brand
              </span>
            </div>
            <div className="grid gap-0 md:grid-cols-[200px_1fr]">
              <aside className="hidden border-r border-slate-100 bg-slate-50/80 p-4 md:block">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Workspace
                </p>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="rounded-md bg-white px-2 py-1.5 font-medium text-primary shadow-sm">
                    Overview
                  </li>
                  <li className="px-2 py-1.5">Brand Studio</li>
                  <li className="px-2 py-1.5">Marketing Intelligence</li>
                  <li className="px-2 py-1.5">Content Studio</li>
                  <li className="px-2 py-1.5">Content Planner</li>
                </ul>
              </aside>
              <div className="space-y-4 p-5 sm:p-6">
                <div className="rounded-lg border border-primary/15 bg-primary/5 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-primary">
                    Next action
                  </p>
                  <p className="mt-1 font-semibold text-foreground">
                    Complete your brand profile in Brand Studio
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Teach {PRODUCT_NAME} who you are, who you serve, and how you sound —
                    then approve facts before generating ideas.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { title: "Brand", status: "Incomplete" },
                    { title: "Pillars", status: "Not started" },
                    { title: "This week", status: "0 planned" },
                  ].map((card) => (
                    <div
                      key={card.title}
                      className="rounded-lg border border-slate-150 border-slate-200 p-3"
                    >
                      <p className="text-xs text-muted-foreground">{card.title}</p>
                      <p className="mt-1 text-sm font-medium">{card.status}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
