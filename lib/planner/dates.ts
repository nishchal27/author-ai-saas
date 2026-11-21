/** UTC Monday 00:00 for the calendar week containing `date`. */
export function weekStartUtc(date: Date = new Date()): Date {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  )
  const day = d.getUTCDay() // 0 Sun .. 6 Sat
  const diff = day === 0 ? -6 : 1 - day
  d.setUTCDate(d.getUTCDate() + diff)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

export function shiftWeekIso(isoMonday: string, deltaWeeks: number): string {
  const d = new Date(isoMonday)
  d.setUTCDate(d.getUTCDate() + deltaWeeks * 7)
  return weekStartUtc(d).toISOString()
}
