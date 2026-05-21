import type { EquipmentId } from '../types'

export const PACKAGE_OPTIONS: Record<EquipmentId, readonly string[]> = {
  'e-bike': [
    'Wypożyczenie (1 doba)',
    'Weekend (Pt–Nd)',
    'Pakiet „Duo” (2 rowery)',
    'Pakiet „Rodzinny/Ekipa” (4 rowery)',
  ],
  kajaki: [
    'Doba (1–2 dni)',
    'Weekend (pt–nd)',
    'Pakiet „Mała Flota” (3–4 kajaki)',
    'Pakiet „Wyprawa” (5+ kajaków)',
  ],
  'vip-bus': [
    'LOKALNY (Short Distance)',
    'TRASA (Long Distance)',
    'BUSINESS VIP',
  ],
  autolaweta: [
    'Pakiet Lokalny (Szybki Strzał)',
    'Pakiet Trasa (Polska)',
    'Pakiet Ekipa Remontowa',
  ],
  dmuchance: [
    'Zjeżdżalnia „Mario”',
    'Ścianka Wspinaczkowa',
    'Zamek Klasyczny',
    'Żółw „Suchy basen”',
    'Wytwornica Piany (1h)',
    'Pakiet URODZINOWY OGRÓD',
    'Pakiet PRZYGODA I ADRENALINA',
    'Pakiet KOMPLETNY FESTYN',
    'PIANA PARTY MIX (dodatek)',
  ],
}

export const EQUIPMENT_LABELS: Record<EquipmentId, string> = {
  'e-bike': 'E-Bike',
  kajaki: 'Kajaki',
  'vip-bus': 'VIP Bus',
  autolaweta: 'Autolaweta',
  dmuchance: 'Dmuchańce',
}

export const EQUIPMENT_ORDER: EquipmentId[] = [
  'e-bike',
  'kajaki',
  'vip-bus',
  'autolaweta',
  'dmuchance',
]
