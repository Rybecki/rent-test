export type BikeModel = 'kross' | 'winora'

export type PaymentMethod = 'cash' | 'card' | 'prepayment'

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Gotówka',
  card: 'Karta/BLIK',
  prepayment: 'Przedpłata',
}

export type EquipmentId =
  | 'e-bike'
  | 'kajaki'
  | 'vip-bus'
  | 'autolaweta'
  | 'dmuchance'

export interface SignedDocument {
  id: string
  equipmentId: EquipmentId
  equipmentLabel: string
  fullName: string
  residentialAddress: string
  phone: string
  idDocument: string
  packageName: string
  dateFrom: string
  dateTo: string
  days: number
  pricePln: number
  signedAt: string
  signatureDataUrl: string
  filledRegulationText: string
  bikeModels?: BikeModel[]
  bikeModel?: BikeModel
  equipmentCount: number
  paymentMethod: PaymentMethod
  depositPln: number
  checklistCheckedIds?: string[]
  checklistCompleted?: boolean
  returnChecklistCheckedIds?: string[]
  returnChecklistCompleted?: boolean
}
