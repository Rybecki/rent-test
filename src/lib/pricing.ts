import type { EquipmentId } from '../types'

const DAYS_MIN = 1

function basePrice(
  equipmentId: EquipmentId,
  packageName: string,
  days: number,
): number {
  const d = Math.max(DAYS_MIN, days || 0)

  switch (equipmentId) {
    case 'e-bike': {
      if (packageName.includes('Weekend')) return 350
      if (packageName.includes('Duo')) return 270 * d
      if (packageName.includes('Rodzinny') || packageName.includes('Ekipa'))
        return 500 * d
      return 150 * d
    }
    case 'kajaki': {
      if (packageName.includes('Weekend')) return 220
      if (packageName.includes('Mała Flota')) {
        const kayaks = 3
        return Math.round(90 * kayaks * d * 0.9)
      }
      if (packageName.includes('Wyprawa')) {
        const kayaks = 5
        return Math.round(90 * kayaks * d * 0.85)
      }
      return 90 * d
    }
    case 'vip-bus': {
      if (packageName.includes('LOKALNY'))
        return Math.round(175 * 8 * d)
      if (packageName.includes('TRASA')) return Math.round(2.85 * 120 * d)
      if (packageName.includes('BUSINESS')) return 1200 * d
      return 0
    }
    case 'autolaweta': {
      if (packageName.includes('Lokalny')) return Math.round(300 * d)
      if (packageName.includes('Trasa')) return Math.round(2.85 * 150 * d)
      if (packageName.includes('Ekipa')) return 1500 * d
      return 0
    }
    case 'dmuchance': {
      const base: Record<string, number> = {
        'Zjeżdżalnia': 1200,
        'Ścianka': 1500,
        'Zamek': 700,
        'Żółw': 1000,
        'Wytwornica': 900,
        'URODZINOWY': 1200,
        'PRZYGODA': 2200,
        'KOMPLETNY': 4500,
        'PIANA': 500,
      }
      for (const [k, v] of Object.entries(base)) {
        if (packageName.includes(k)) return v * d
      }
      return 0
    }
    default:
      return 0
  }
}

export function computePrice(
  equipmentId: EquipmentId,
  packageName: string,
  days: number,
  equipmentCount = 1,
): number {
  const count = Math.max(1, equipmentCount)
  return Math.round(basePrice(equipmentId, packageName, days) * count)
}
