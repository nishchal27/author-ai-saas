"use client"

const audiences = [
  {
    title: "Small ecommerce brands",
    body: "Tell product stories beyond “new arrival” posts and keep a consistent voice.",
  },
  {
    title: "Independent businesses",
    body: "Organize pillars, ideas, and drafts without hiring a dedicated marketer.",
  },
  {
    title: "Solo founders",
    body: "Get clear next actions for your brand when marketing isn’t your full-time job.",
  },
  {
    title: "Creators & freelancers",
    body: "Capture your offer and audience once, then reuse a simple weekly content loop.",
  },
  {
    title: "Small marketing teams",
    body: "Keep brand context and weekly plans in one place — collaboration workflows come later.",
  },
]

export function Audience() {
  return (
    <section id="who" className="border-y border-slate-100 bg-slate-50 py-20 lg:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Who it’s for
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Built for people who need practical marketing help — not another enterprise suite.
          </p>
        </div>
        <ul className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {audiences.map((a) => (
            <li
              key={a.title}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h3 className="font-semibold">{a.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {a.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
