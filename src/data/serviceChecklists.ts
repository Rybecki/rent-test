import type { EquipmentId } from '../types'
import type { ChecklistDef } from './checklistTypes'

export type { ChecklistDef, ChecklistItemDef } from './checklistTypes'
export { isChecklistComplete, countChecked } from './checklistUtils'

export const E_BIKE_CHECKLIST: ChecklistDef = {
  modalTitle: 'LISTA KONTROLNA OBSŁUGI KLIENTA (E-BIKE)',
  sections: [
    {
      title: 'KROK 1: Przed wydaniem roweru (w obecności klienta)',
      subsections: [
        {
          title: '1. Formalności i dokumenty:',
          items: [
            {
              id: 'eb-k1-1-1',
              label:
                'Sprawdź dowód tożsamości klienta (czy dane zgadzają się z umową).',
            },
            {
              id: 'eb-k1-1-2',
              label:
                'Pobierz kaucję (gotówka lub terminal) i odnotuj to w umowie.',
            },
            {
              id: 'eb-k1-1-3',
              label:
                'Podpisz umowę z klientem i daj mu kopię (lub regulamin).',
            },
          ],
        },
        {
          title: '2. Stan techniczny roweru:',
          items: [
            {
              id: 'eb-k1-2-1',
              label:
                'Bateria: Pokaż klientowi, że bateria jest naładowana na 100%.',
            },
            {
              id: 'eb-k1-2-2',
              label:
                'Opony: Sprawdź ciśnienie (rower elektryczny musi mieć twarde opony).',
            },
            {
              id: 'eb-k1-2-3',
              label:
                'Hamulce: Zaciśnij klamki, upewnij się, że rower staje w miejscu.',
            },
            {
              id: 'eb-k1-2-4',
              label: 'Napęd: Sprawdź, czy łańcuch jest czysty i nasmarowany.',
            },
          ],
        },
        {
          title: '3. Instruktaż dla klienta (Kluczowe!):',
          items: [
            {
              id: 'eb-k1-3-1',
              label:
                'Obsługa kontrolera: Pokaż jak włączyć/wyłączyć system i jak zmieniać tryby wspomagania.',
            },
            {
              id: 'eb-k1-3-2',
              label:
                'Biegi: Przypomnij, żeby zmieniać biegi podczas pedałowania (nie na postoju!).',
            },
            {
              id: 'eb-k1-3-3',
              label:
                'Zabezpieczenie: Pokaż jak prawidłowo przypiąć rower zapięciem (zawsze o ramę!).',
            },
            {
              id: 'eb-k1-3-4',
              label:
                'Waga: Ostrzeż, że e-bike jest cięższy od zwykłego roweru przy manewrowaniu.',
            },
          ],
        },
        {
          title: '4. Wydanie akcesoriów:',
          items: [
            {
              id: 'eb-k1-4-1',
              label: 'Dopasuj kask do głowy klienta.',
            },
            {
              id: 'eb-k1-4-2',
              label: 'Wydaj zapięcie i kluczyk do baterii/zapięcia.',
            },
            {
              id: 'eb-k1-4-3',
              label:
                '(Opcjonalnie) Przekaż ładowarkę, jeśli wynajem jest na więcej niż 1 dobę.',
              optional: true,
            },
          ],
        },
      ],
    },
  ],
}

export const KAJAKI_CHECKLIST: ChecklistDef = {
  modalTitle: 'CHECKLISTA OBSŁUGI KLIENTA',
  sections: [
    {
      title: 'I. WYDANIE SPRZĘTU (Przed wypłynięciem)',
      subsections: [
        {
          title: '1. Formalności i dokumenty:',
          items: [
            {
              id: 'kj-1-1',
              label:
                'Sprawdzenie tożsamości Klienta (dowód osobisty/paszport).',
            },
            {
              id: 'kj-1-2',
              label: 'Weryfikacja podpisania Umowy Najmu i Regulaminu.',
            },
            {
              id: 'kj-1-3',
              label:
                'Pobranie kaucji i odnotowanie formy płatności (gotówka/blokada na karcie).',
            },
          ],
        },
        {
          title: '2. Przegląd kajaka:',
          items: [
            { id: 'kj-2-1', label: 'Sprawdzenie czy korki spustowe są zakręcone.' },
            {
              id: 'kj-2-2',
              label: 'Kontrola kadłuba (brak nowych, głębokich pęknięć).',
            },
            {
              id: 'kj-2-3',
              label: 'Montaż trzeciego siedziska dla dziecka (jeśli zamówiono).',
            },
          ],
        },
        {
          title: '3. Dobór osprzętu:',
          items: [
            {
              id: 'kj-3-1',
              label:
                'Wydanie wioseł (sprawdzenie czy pióra są całe, a drążek prosty).',
            },
            {
              id: 'kj-3-2',
              label:
                'Dopasowanie kamizelek asekuracyjnych do wagi i wzrostu pasażerów (obowiązkowe!).',
            },
          ],
        },
        {
          title: '4. Logistyka i bezpieczeństwo:',
          items: [
            {
              id: 'kj-4-1',
              label:
                'Pomoc w bezpiecznym zamocowaniu kajaka na dachu klienta (użycie pasów).',
            },
            {
              id: 'kj-4-2',
              label:
                'Krótkie przeszkolenie: jak nie uszkodzić polietylenu (np. nie przeciągać po asfalcie/betonie).',
            },
            { id: 'kj-4-3', label: 'Przekazanie kontaktu alarmowego do wypożyczalni.' },
          ],
        },
        {
          title: '5. Finalizacja:',
          items: [
            { id: 'kj-5-1', label: 'Podpisanie protokołu wydania przez obie strony.' },
          ],
        },
      ],
    },
  ],
}

const CHECKLIST_BY_EQUIPMENT: Partial<Record<EquipmentId, ChecklistDef>> = {
  'e-bike': E_BIKE_CHECKLIST,
  kajaki: KAJAKI_CHECKLIST,
}

export function getServiceChecklist(
  equipmentId: EquipmentId | '',
): ChecklistDef | null {
  if (!equipmentId) return null
  return CHECKLIST_BY_EQUIPMENT[equipmentId] ?? null
}

export function hasServiceChecklist(equipmentId: EquipmentId | ''): boolean {
  return getServiceChecklist(equipmentId) !== null
}
