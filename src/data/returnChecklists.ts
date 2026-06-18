import type { EquipmentId } from '../types'
import type { ChecklistDef } from './checklistTypes'

export type { ChecklistDef } from './checklistTypes'
export { isChecklistComplete, countChecked } from './checklistUtils'

export const KAJAKI_RETURN_CHECKLIST: ChecklistDef = {
  modalTitle: 'ODBIÓR SPRZĘTU (Po zwrocie)',
  sections: [
    {
      title: 'ODBIÓR SPRZĘTU (Po zwrocie)',
      subsections: [
        {
          title: '1. Kontrola czystości:',
          items: [
            {
              id: 'kj-r-1-1',
              label:
                'Sprawdzenie wnętrza kajaka (brak piasku, błota, resztek jedzenia).',
            },
          ],
          infoNote:
            'Uwaga: W razie silnego zabrudzenia poinformuj klienta o opłacie serwisowej.',
        },
        {
          title: '2. Kontrola kompletności:',
          items: [
            { id: 'kj-r-2-1', label: 'Czy wróciły wszystkie wiosła i kamizelki?' },
            {
              id: 'kj-r-2-2',
              label: 'Czy siedzisko dla dziecka jest nieuszkodzone?',
            },
          ],
        },
        {
          title: '3. Kontrola techniczna:',
          items: [
            {
              id: 'kj-r-3-1',
              label:
                'Sprawdzenie dna kajaka pod kątem nowych, głębokich uszkodzeń mechanicznych (poza standardowymi rysami).',
            },
            {
              id: 'kj-r-3-2',
              label: 'Sprawdzenie stanu rączek transportowych i oparć.',
            },
          ],
        },
        {
          title: '4. Rozliczenie finansowe:',
          items: [
            {
              id: 'kj-r-4-1',
              label:
                'Zwrot kaucji (jeśli sprzęt jest w stanie nienaruszonym i czystym).',
            },
            {
              id: 'kj-r-4-2',
              label:
                'Ewentualne spisanie protokołu szkody (jeśli wystąpiły braki lub zniszczenia).',
            },
          ],
        },
        {
          title: '5. Finalizacja:',
          items: [
            { id: 'kj-r-5-1', label: 'Podpisanie protokołu odbioru.' },
          ],
        },
      ],
    },
  ],
}

export const E_BIKE_RETURN_CHECKLIST: ChecklistDef = {
  modalTitle: 'Przy odbiorze roweru (od klienta)',
  sections: [
    {
      title: 'Przy odbiorze roweru (od klienta)',
      subsections: [
        {
          title: '1. Oględziny wizualne:',
          items: [
            {
              id: 'eb-r-1-1',
              label:
                'Rama i widelec: Sprawdź, czy nie pojawiły się nowe, głębokie rysy lub pęknięcia.',
            },
            {
              id: 'eb-r-1-2',
              label:
                'Wyświetlacz i koła: Sprawdź ekran, manetki oraz czy felgi są proste.',
            },
          ],
        },
        {
          title: '2. Sprawdzenie elektroniki:',
          items: [
            {
              id: 'eb-r-2-1',
              label:
                'Włącz rower i sprawdź, czy nie wyświetlają się błędy na ekranie.',
            },
            {
              id: 'eb-r-2-2',
              label:
                'Sprawdź, czy system wspomagania reaguje na nacisk na pedały.',
            },
          ],
        },
        {
          title: '3. Kompletność zestawu:',
          items: [
            { id: 'eb-r-3-1', label: 'Czy zwrócono kluczyki, zapięcie i kask?' },
            {
              id: 'eb-r-3-3',
              label: 'Czy zwrócono ładowarkę (jeśli była wydana)?',
              optional: true,
            },
          ],
        },
        {
          title: '4. Rozliczenie:',
          items: [
            {
              id: 'eb-r-4-1',
              label:
                'Jeśli rower jest bardzo brudny (błoto), pobierz opłatę za mycie (zgodnie z regulaminem).',
            },
            {
              id: 'eb-r-4-2',
              label:
                'Jeśli wszystko jest OK – zwróć kaucję lub anuluj blokadę na karcie.',
            },
          ],
        },
      ],
    },
  ],
  infoNotes: `Wskazówki dla pracownika:

Zasada „Zdjęcie”: Jeśli zauważysz jakąś rysę przy wydawaniu, której nie ma w opisie – zrób zdjęcie i dopisz do umowy. To ucina dyskusje przy zwrocie.

Uśmiech: Zapytaj klienta, jak mu się jeździło i czy trasa była ciekawa. Zadowolony klient wróci do „Złotego Jelenia” i poleci nas znajomym!

Katowice vs Jura: Pamiętaj, aby przy transporcie rowerów między bazą w Katowicach a Złotym Jeleniem zawsze zdejmować baterie i panele (jeśli to możliwe), aby nie drgały niepotrzebnie na przyczepie.`,
}

const RETURN_BY_EQUIPMENT: Partial<Record<EquipmentId, ChecklistDef>> = {
  'e-bike': E_BIKE_RETURN_CHECKLIST,
  kajaki: KAJAKI_RETURN_CHECKLIST,
}

export function getReturnChecklist(
  equipmentId: EquipmentId,
): ChecklistDef | null {
  return RETURN_BY_EQUIPMENT[equipmentId] ?? null
}

export function hasReturnChecklist(equipmentId: EquipmentId): boolean {
  return getReturnChecklist(equipmentId) !== null
}
