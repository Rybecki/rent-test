export function countInclusiveDays(from: string, to: string): number {
  if (!from || !to) return 0
  const a = new Date(from + 'T12:00:00')
  const b = new Date(to + 'T12:00:00')
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0
  if (b < a) return 0
  const ms = 86400000
  return Math.round((b.getTime() - a.getTime()) / ms) + 1
}
