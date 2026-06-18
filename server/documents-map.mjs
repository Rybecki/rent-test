import { readWantsInvoiceFromRow } from './validate-invoice.mjs'


export function rowToDocument(row) {
  return {
    id: row.id,
    equipmentId: row.equipment_id,
    equipmentLabel: row.equipment_label,
    firstName: row.first_name ?? row.full_name?.split(/\s+/)[0] ?? '',
    lastName:
      row.last_name ??
      row.full_name?.split(/\s+/).slice(1).join(' ') ??
      '',
    residentialAddress: row.residential_address,
    phone: row.phone,
    clientEmail: row.client_email ?? '',
    idDocument: row.id_document,
    pesel: row.pesel ?? '',
    packageName: row.package_name,
    dateFrom: formatDate(row.date_from),
    dateTo: formatDate(row.date_to),
    days: row.days,
    pricePln: Number(row.price_pln),
    signedAt: new Date(row.signed_at).toISOString(),
    signatureDataUrl: row.signature_data_url,
    issuerFirstName: row.issuer_first_name ?? '',
    issuerLastName: row.issuer_last_name ?? '',
    filledRegulationText: row.filled_regulation_text,
    bikeModels: parseJson(row.bike_models),
    bikeModelCounts: parseJson(row.bike_model_counts),
    equipmentCount: row.equipment_count,
    paymentMethod: row.payment_method,
    depositPln: Number(row.deposit_pln),
    wantsInvoice: readWantsInvoiceFromRow(row),
    invoiceCompanyName: row.invoice_company_name ?? '',
    invoiceNip: row.invoice_nip ?? '',
    invoiceCity: row.invoice_city ?? '',
    invoiceStreet: row.invoice_street ?? '',
    invoiceUnit: row.invoice_unit ?? '',
    invoicePostalCode: row.invoice_postal_code ?? '',
    invoiceEmail: row.invoice_email ?? '',
    checklistCheckedIds: parseJson(row.checklist_checked_ids) ?? undefined,
    checklistCompleted: Boolean(row.checklist_completed),
    returnChecklistCheckedIds:
      parseJson(row.return_checklist_checked_ids) ?? undefined,
    returnChecklistCompleted: Boolean(row.return_checklist_completed),
  }
}

function formatDate(d) {
  if (!d) return ''
  if (typeof d === 'string') return d.slice(0, 10)
  return d.toISOString().slice(0, 10)
}

function parseJson(val) {
  if (val == null) return undefined
  if (typeof val === 'object') return val
  try {
    return JSON.parse(val)
  } catch {
    return undefined
  }
}


export function documentToRow(doc, userId) {
  return {
    id: doc.id,
    equipment_id: doc.equipmentId,
    equipment_label: doc.equipmentLabel,
    first_name: doc.firstName?.trim() ?? '',
    last_name: doc.lastName?.trim() ?? '',
    full_name:
      [doc.firstName, doc.lastName]
        .map((s) => String(s ?? '').trim())
        .filter(Boolean)
        .join(' ') || '',
    residential_address: doc.residentialAddress,
    phone: doc.phone,
    client_email: doc.clientEmail ?? '',
    id_document: doc.idDocument,
    pesel: doc.pesel ?? '',
    package_name: doc.packageName,
    date_from: doc.dateFrom,
    date_to: doc.dateTo,
    days: doc.days,
    price_pln: doc.pricePln,
    signed_at: doc.signedAt,
    signature_data_url: doc.signatureDataUrl,
    issuer_first_name: doc.issuerFirstName?.trim() ?? '',
    issuer_last_name: doc.issuerLastName?.trim() ?? '',
    filled_regulation_text: doc.filledRegulationText,
    bike_models:
      doc.bikeModels?.length ? JSON.stringify(doc.bikeModels) : null,
    bike_model_counts:
      doc.bikeModelCounts && Object.keys(doc.bikeModelCounts).length
        ? JSON.stringify(doc.bikeModelCounts)
        : null,
    equipment_count: doc.equipmentCount ?? 1,
    payment_method: doc.paymentMethod,
    deposit_pln: doc.depositPln ?? 0,
    wants_invoice: doc.wantsInvoice ? 1 : 0,
    invoice_company_name: doc.invoiceCompanyName?.trim() ?? '',
    invoice_nip: doc.invoiceNip?.trim() ?? '',
    invoice_city: doc.invoiceCity?.trim() ?? '',
    invoice_street: doc.invoiceStreet?.trim() ?? '',
    invoice_unit: doc.invoiceUnit?.trim() ?? '',
    invoice_postal_code: doc.invoicePostalCode?.trim() ?? '',
    invoice_email: doc.invoiceEmail?.trim().toLowerCase() ?? '',
    checklist_checked_ids: doc.checklistCheckedIds?.length
      ? JSON.stringify(doc.checklistCheckedIds)
      : null,
    checklist_completed: doc.checklistCompleted ? 1 : 0,
    return_checklist_checked_ids: doc.returnChecklistCheckedIds?.length
      ? JSON.stringify(doc.returnChecklistCheckedIds)
      : null,
    return_checklist_completed: doc.returnChecklistCompleted ? 1 : 0,
    created_by_user_id: userId,
  }
}
