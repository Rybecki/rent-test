<?php

declare(strict_types=1);

final class DocumentsMap
{
    
    public static function rowToDocument(array $row): array
    {
        $fullName = (string) ($row['full_name'] ?? '');
        $parts = preg_split('/\s+/', trim($fullName), -1, PREG_SPLIT_NO_EMPTY) ?: [];

        return [
            'id' => $row['id'],
            'equipmentId' => $row['equipment_id'],
            'equipmentLabel' => $row['equipment_label'],
            'firstName' => $row['first_name'] ?? ($parts[0] ?? ''),
            'lastName' => $row['last_name'] ?? (count($parts) > 1 ? implode(' ', array_slice($parts, 1)) : ''),
            'residentialAddress' => $row['residential_address'],
            'phone' => $row['phone'],
            'clientEmail' => $row['client_email'] ?? '',
            'idDocument' => $row['id_document'],
            'pesel' => $row['pesel'] ?? '',
            'packageName' => $row['package_name'],
            'dateFrom' => self::formatDate($row['date_from'] ?? ''),
            'dateTo' => self::formatDate($row['date_to'] ?? ''),
            'days' => (int) $row['days'],
            'pricePln' => (float) $row['price_pln'],
            'signedAt' => self::formatDateTime($row['signed_at']),
            'signatureDataUrl' => $row['signature_data_url'],
            'issuerFirstName' => $row['issuer_first_name'] ?? '',
            'issuerLastName' => $row['issuer_last_name'] ?? '',
            'filledRegulationText' => $row['filled_regulation_text'],
            'bikeModels' => self::parseJson($row['bike_models'] ?? null),
            'bikeModelCounts' => self::parseJson($row['bike_model_counts'] ?? null),
            'equipmentCount' => (int) ($row['equipment_count'] ?? 1),
            'paymentMethod' => $row['payment_method'],
            'depositPln' => (float) ($row['deposit_pln'] ?? 0),
            'wantsInvoice' => ValidateInvoice::readWantsInvoiceFromRow($row),
            'invoiceCompanyName' => $row['invoice_company_name'] ?? '',
            'invoiceNip' => $row['invoice_nip'] ?? '',
            'invoiceCity' => $row['invoice_city'] ?? '',
            'invoiceStreet' => $row['invoice_street'] ?? '',
            'invoiceUnit' => $row['invoice_unit'] ?? '',
            'invoicePostalCode' => $row['invoice_postal_code'] ?? '',
            'invoiceEmail' => $row['invoice_email'] ?? '',
            'checklistCheckedIds' => self::parseJson($row['checklist_checked_ids'] ?? null),
            'checklistCompleted' => (bool) ($row['checklist_completed'] ?? false),
            'returnChecklistCheckedIds' => self::parseJson($row['return_checklist_checked_ids'] ?? null),
            'returnChecklistCompleted' => (bool) ($row['return_checklist_completed'] ?? false),
        ];
    }

    
    public static function documentToRow(array $doc, ?int $userId): array
    {
        $first = trim((string) ($doc['firstName'] ?? ''));
        $last = trim((string) ($doc['lastName'] ?? ''));
        $full = trim($first . ' ' . $last);

        $bikeModels = $doc['bikeModels'] ?? null;
        $bikeCounts = $doc['bikeModelCounts'] ?? null;

        return [
            'id' => $doc['id'],
            'equipment_id' => $doc['equipmentId'],
            'equipment_label' => $doc['equipmentLabel'],
            'first_name' => $first,
            'last_name' => $last,
            'full_name' => $full,
            'residential_address' => $doc['residentialAddress'],
            'phone' => $doc['phone'],
            'client_email' => $doc['clientEmail'] ?? '',
            'id_document' => $doc['idDocument'],
            'pesel' => $doc['pesel'] ?? '',
            'package_name' => $doc['packageName'],
            'date_from' => $doc['dateFrom'],
            'date_to' => $doc['dateTo'],
            'days' => $doc['days'],
            'price_pln' => $doc['pricePln'],
            'signed_at' => $doc['signedAt'],
            'signature_data_url' => $doc['signatureDataUrl'],
            'issuer_first_name' => trim((string) ($doc['issuerFirstName'] ?? '')),
            'issuer_last_name' => trim((string) ($doc['issuerLastName'] ?? '')),
            'filled_regulation_text' => $doc['filledRegulationText'],
            'bike_models' => is_array($bikeModels) && count($bikeModels) > 0
                ? json_encode($bikeModels, JSON_UNESCAPED_UNICODE)
                : null,
            'bike_model_counts' => is_array($bikeCounts) && count($bikeCounts) > 0
                ? json_encode($bikeCounts, JSON_UNESCAPED_UNICODE)
                : null,
            'equipment_count' => $doc['equipmentCount'] ?? 1,
            'payment_method' => $doc['paymentMethod'],
            'deposit_pln' => $doc['depositPln'] ?? 0,
            'wants_invoice' => !empty($doc['wantsInvoice']) ? 1 : 0,
            'invoice_company_name' => trim((string) ($doc['invoiceCompanyName'] ?? '')),
            'invoice_nip' => ValidateInvoice::normalizeNip($doc['invoiceNip'] ?? ''),
            'invoice_city' => trim((string) ($doc['invoiceCity'] ?? '')),
            'invoice_street' => trim((string) ($doc['invoiceStreet'] ?? '')),
            'invoice_unit' => trim((string) ($doc['invoiceUnit'] ?? '')),
            'invoice_postal_code' => trim((string) ($doc['invoicePostalCode'] ?? '')),
            'invoice_email' => strtolower(trim((string) ($doc['invoiceEmail'] ?? ''))),
            'checklist_checked_ids' => is_array($doc['checklistCheckedIds'] ?? null) && count($doc['checklistCheckedIds']) > 0
                ? json_encode($doc['checklistCheckedIds'], JSON_UNESCAPED_UNICODE)
                : null,
            'checklist_completed' => !empty($doc['checklistCompleted']) ? 1 : 0,
            'return_checklist_checked_ids' => is_array($doc['returnChecklistCheckedIds'] ?? null) && count($doc['returnChecklistCheckedIds']) > 0
                ? json_encode($doc['returnChecklistCheckedIds'], JSON_UNESCAPED_UNICODE)
                : null,
            'return_checklist_completed' => !empty($doc['returnChecklistCompleted']) ? 1 : 0,
            'created_by_user_id' => $userId,
        ];
    }

    private static function formatDate(mixed $d): string
    {
        if ($d === null || $d === '') {
            return '';
        }
        if (is_string($d)) {
            return substr($d, 0, 10);
        }
        return '';
    }

    private static function formatDateTime(mixed $d): string
    {
        if ($d === null || $d === '') {
            return gmdate('c');
        }
        $ts = strtotime((string) $d);
        return $ts !== false ? gmdate('c', $ts) : gmdate('c');
    }

    private static function parseJson(mixed $val): mixed
    {
        if ($val === null) {
            return null;
        }
        if (is_array($val)) {
            return $val;
        }
        if (!is_string($val) || $val === '') {
            return null;
        }
        $decoded = json_decode($val, true);
        return json_last_error() === JSON_ERROR_NONE ? $decoded : null;
    }

    
    public static function stripOptionalNulls(array $doc): array
    {
        foreach (['bikeModels', 'bikeModelCounts', 'checklistCheckedIds', 'returnChecklistCheckedIds'] as $key) {
            if (array_key_exists($key, $doc) && $doc[$key] === null) {
                unset($doc[$key]);
            }
        }
        return $doc;
    }
}
