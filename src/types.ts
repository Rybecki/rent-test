export type UserRole = 'admin' | 'user'

export interface AuthUser {
  email: string
  role: UserRole
}

export type BikeModel = 'kross' | 'winora'

export type BikeModelCounts = Partial<Record<BikeModel, number>>

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
  firstName: string
  lastName: string
  residentialAddress: string
  phone: string
  clientEmail: string
  idDocument: string
  pesel: string
  packageName: string
  dateFrom: string
  dateTo: string
  days: number
  pricePln: number
  signedAt: string
  signatureDataUrl: string
  issuerFirstName: string
  issuerLastName: string
  filledRegulationText: string
  bikeModels?: BikeModel[]
  bikeModel?: BikeModel
  bikeModelCounts?: BikeModelCounts
  equipmentCount: number
  paymentMethod: PaymentMethod
  depositPln: number
  wantsInvoice: boolean
  invoiceCompanyName: string
  invoiceNip: string
  invoiceCity: string
  invoiceStreet: string
  invoiceUnit: string
  invoicePostalCode: string
  invoiceEmail: string
  checklistCheckedIds?: string[]
  checklistCompleted?: boolean
  returnChecklistCheckedIds?: string[]
  returnChecklistCompleted?: boolean
}
