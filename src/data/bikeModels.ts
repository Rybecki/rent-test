import type { BikeModel, BikeModelCounts } from '../types'

export const BIKE_MODEL_OPTIONS: { id: BikeModel; label: string }[] = [
  { id: 'kross', label: 'KROSS Influx Hybrid 1.0' },
  { id: 'winora', label: 'WINORA Yucatan X8' },
]

export const BIKE_MODEL_LABELS: Record<BikeModel, string> = {
  kross: 'KROSS Influx Hybrid 1.0',
  winora: 'WINORA Yucatan X8',
}

export function emptyBikeModelCounts(): BikeModelCounts {
  return {}
}

export function sumBikeModelCounts(
  counts: BikeModelCounts | undefined,
  models?: BikeModel[],
  fallbackTotal = 1,
): number {
  if (counts && Object.keys(counts).length > 0) {
    return Object.values(counts).reduce((sum, n) => sum + Math.max(0, n ?? 0), 0)
  }
  if (models?.length) return Math.max(1, fallbackTotal)
  return Math.max(1, fallbackTotal)
}

export function normalizeBikeModelCounts(
  models: BikeModel[] | undefined,
  counts: BikeModelCounts | undefined,
  equipmentCount: number,
): BikeModelCounts {
  if (!models?.length) return {}
  if (counts && models.every((m) => (counts[m] ?? 0) >= 1)) {
    const out: BikeModelCounts = {}
    for (const m of models) out[m] = counts[m] ?? 1
    return out
  }
  const per = Math.max(1, Math.floor(equipmentCount / models.length))
  const out: BikeModelCounts = {}
  for (const m of models) out[m] = per
  return out
}

export function formatBikeCountsSummary(
  models: BikeModel[],
  counts: BikeModelCounts,
): string {
  return models
    .map((m) => `${BIKE_MODEL_LABELS[m]}: ${counts[m] ?? 0}`)
    .join(', ')
}
