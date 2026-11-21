"use client"

import { PRODUCT_NAME } from "@/lib/constants"

const problems = [
  {
    title: "Inconsistent marketing",
    body: "Some weeks you post. Most weeks you don’t — and momentum disappears.",
  },
  {
    title: "Not knowing what to post",
    body: "Blank screens and recycled “new arrival” posts that don’t sound like you.",
  },
  {
    title: "Reinventing ideas every time",
    body: "You burn energy deciding what to say instead of saying it well.",
  },
  {
    title: "Drifting brand voice",
    body: "Captions sound different every week because nothing remembers your brand.",
  },
  {
    title: "Scattered planning",
    body: "Notes, drafts, and half-finished posts live in chat threads and folders.",
  },
]

export function Problem() {
  return (
    <section id="problem" className="border-y border-slate-100 bg-slate-50 py-20 lg:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Marketing shouldn’t depend on a good week
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Small brands and solo founders don’t lack effort — they lack a clear place
            to decide what to create and keep it on-brand. {PRODUCT_NAME} is built for that gap.
          </p>
        </div>
        <ul className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {problems.map((item) => (
            <li
              key={item.title}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h3 className="font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
