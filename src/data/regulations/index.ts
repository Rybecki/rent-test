import type { EquipmentId } from '../../types'
import { REGULATION_E_BIKE } from './eBike'
import { REGULATION_KAJAKI } from './kajaki'
import { REGULATION_VIP_BUS } from './vipBus'
import { REGULATION_AUTOLAWETA } from './autolaweta'
import { REGULATION_DMUCHANCE } from './dmuchance'

const MAP: Record<EquipmentId, string> = {
  'e-bike': REGULATION_E_BIKE,
  kajaki: REGULATION_KAJAKI,
  'vip-bus': REGULATION_VIP_BUS,
  autolaweta: REGULATION_AUTOLAWETA,
  dmuchance: REGULATION_DMUCHANCE,
}

export function getRegulationText(id: EquipmentId): string {
  return MAP[id] ?? ''
}
