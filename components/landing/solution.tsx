"use client"

import { PRODUCT_NAME } from "@/lib/constants"

export function Solution() {
  return (
    <section id="solution" className="py-20 lg:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl items-start gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              One workspace that remembers your brand
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Teach {PRODUCT_NAME} about your business once. Use that approved context to
              shape pillars, ideas, and platform drafts you can review and edit —
              then organize the week in a simple planner.
            </p>
          </div>
          <ul className="space-y-4 text-sm leading-relaxed text-muted-foreground">
            <li className="rounded-lg border border-slate-200 bg-slate-50/80 p-4">
              <span className="font-medium text-foreground">Brand understanding first.</span>{" "}
              Facts and voice stay under your control — AI never auto-approves.
            </li>
            <li className="rounded-lg border border-slate-200 bg-slate-50/80 p-4">
              <span className="font-medium text-foreground">Decide what to create.</span>{" "}
              Pillars and ideas give you direction instead of another blank page.
            </li>
            <li className="rounded-lg border border-slate-200 bg-slate-50/80 p-4">
              <span className="font-medium text-foreground">Produce drafts you own.</span>{" "}
              Platform-specific drafts are starting points you refine — not autopilot posts.
            </li>
            <li className="rounded-lg border border-slate-200 bg-slate-50/80 p-4">
              <span className="font-medium text-foreground">Not a publishing network.</span>{" "}
              {PRODUCT_NAME} helps you plan and write; you still publish where you choose.
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}
