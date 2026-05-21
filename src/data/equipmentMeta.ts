import type { EquipmentId } from '../types'

export const DEPOSIT_PER_UNIT_PLN: Record<EquipmentId, number> = {
  'e-bike': 500,
  kajaki: 200,
  'vip-bus': 0,
  autolaweta: 0,
  dmuchance: 0,
}

export const EQUIPMENT_QUANTITY_LABEL: Record<EquipmentId, string> = {
  'e-bike': 'Liczba rowerów',
  kajaki: 'Liczba kajaków',
  'vip-bus': 'Liczba pojazdów / przejazdów',
  autolaweta: 'Liczba zleceń transportowych',
  dmuchance: 'Liczba atrakcji / zestawów',
}

export function computeDepositPln(
  equipmentId: EquipmentId,
  equipmentCount: number,
): number {
  const per = DEPOSIT_PER_UNIT_PLN[equipmentId] ?? 0
  return per * Math.max(1, equipmentCount)
}
