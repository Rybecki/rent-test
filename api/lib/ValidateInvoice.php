<?php

declare(strict_types=1);

final class ValidateInvoice
{
    public static function normalizeNip(mixed $nip): string
    {
        $d = preg_replace('/\D/', '', (string) $nip) ?? '';
        return substr($d, 0, 10);
    }

    public static function isValidNip(mixed $nip): bool
    {
        $d = self::normalizeNip($nip);
        if (!preg_match('/^\d{10}$/', $d)) {
            return false;
        }
        $weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
        $sum = 0;
        for ($i = 0; $i < 9; $i++) {
            $sum += (int) $d[$i] * $weights[$i];
        }
        $check = $sum % 11;
        $last = $check === 10 ? 0 : $check;
        return $last === (int) $d[9];
    }

    public static function isValidPostalCode(mixed $code): bool
    {
        return (bool) preg_match('/^\d{2}-\d{3}$/', trim((string) $code));
    }

    public static function parseWantsInvoice(mixed $value): bool
    {
        return $value === true || $value === 1 || $value === '1' || $value === 'true';
    }

    
    public static function hasInvoiceData(array $doc): bool
    {
        if (self::parseWantsInvoice($doc['wantsInvoice'] ?? false)) {
            return true;
        }
        return strlen(trim((string) ($doc['invoiceCompanyName'] ?? ''))) >= 2
            && self::isValidNip($doc['invoiceNip'] ?? '');
    }

    
    public static function readWantsInvoiceFromRow(array $row): bool
    {
        $flag = $row['wants_invoice'] ?? null;
        if ($flag === 1 || $flag === true || $flag === '1') {
            return true;
        }
        if ($flag === 0 || $flag === false || $flag === null || $flag === '') {
            return self::hasInvoiceData([
                'wantsInvoice' => false,
                'invoiceCompanyName' => $row['invoice_company_name'] ?? '',
                'invoiceNip' => $row['invoice_nip'] ?? '',
            ]);
        }
        return (int) $flag === 1;
    }

    
    public static function mergeInvoiceFields(array $saved, array $source): array
    {
        if (!self::hasInvoiceData($source)) {
            return $saved;
        }
        return array_merge($saved, [
            'wantsInvoice' => true,
            'invoiceCompanyName' => trim((string) ($source['invoiceCompanyName'] ?? $saved['invoiceCompanyName'] ?? '')),
            'invoiceNip' => self::normalizeNip($source['invoiceNip'] ?? $saved['invoiceNip'] ?? ''),
            'invoiceCity' => trim((string) ($source['invoiceCity'] ?? $saved['invoiceCity'] ?? '')),
            'invoiceStreet' => trim((string) ($source['invoiceStreet'] ?? $saved['invoiceStreet'] ?? '')),
            'invoiceUnit' => trim((string) ($source['invoiceUnit'] ?? $saved['invoiceUnit'] ?? '')),
            'invoicePostalCode' => trim((string) ($source['invoicePostalCode'] ?? $saved['invoicePostalCode'] ?? '')),
            'invoiceEmail' => strtolower(trim((string) ($source['invoiceEmail'] ?? $saved['invoiceEmail'] ?? ''))),
        ]);
    }

    
    public static function validateInvoiceFields(array $doc): ?string
    {
        if (!self::parseWantsInvoice($doc['wantsInvoice'] ?? false)) {
            return null;
        }
        if (strlen(trim((string) ($doc['invoiceCompanyName'] ?? ''))) < 2) {
            return 'Podaj nazwę firmy do faktury';
        }
        if (!self::isValidNip($doc['invoiceNip'] ?? '')) {
            return 'Podaj poprawny NIP (10 cyfr)';
        }
        if (strlen(trim((string) ($doc['invoiceCity'] ?? ''))) < 2) {
            return 'Podaj miasto (faktura)';
        }
        if (strlen(trim((string) ($doc['invoiceStreet'] ?? ''))) < 2) {
            return 'Podaj ulicę i numer (faktura)';
        }
        if (!self::isValidPostalCode($doc['invoicePostalCode'] ?? '')) {
            return 'Podaj kod pocztowy (np. 00-001)';
        }
        $invoiceEmail = strtolower(trim((string) ($doc['invoiceEmail'] ?? '')));
        if ($invoiceEmail !== '' && !ValidateContact::isValidClientEmail($invoiceEmail)) {
            return 'Podaj poprawny e-mail do wysłania faktury';
        }
        return null;
    }

    
    public static function formatInvoiceTextLines(array $doc): array
    {
        if (!self::hasInvoiceData($doc)) {
            return [];
        }
        $lines = [
            '',
            'Dane do faktury:',
            'Nazwa firmy: ' . trim((string) ($doc['invoiceCompanyName'] ?? '')),
            'NIP: ' . self::normalizeNip($doc['invoiceNip'] ?? ''),
            'Miasto: ' . trim((string) ($doc['invoiceCity'] ?? '')),
            'Ulica i numer: ' . trim((string) ($doc['invoiceStreet'] ?? '')),
        ];
        $unit = trim((string) ($doc['invoiceUnit'] ?? ''));
        if ($unit !== '') {
            $lines[] = 'Lokal: ' . $unit;
        }
        $lines[] = 'Kod pocztowy: ' . trim((string) ($doc['invoicePostalCode'] ?? ''));
        $email = trim((string) ($doc['invoiceEmail'] ?? ''));
        if ($email !== '') {
            $lines[] = 'E-mail do faktury: ' . $email;
        }
        return $lines;
    }
}
