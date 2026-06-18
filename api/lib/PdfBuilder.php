<?php

declare(strict_types=1);

final class PdfBuilder
{
    private const PAYMENT_LABELS = [
        'cash' => 'Gotówka',
        'card' => 'Karta/BLIK',
        'prepayment' => 'Przedpłata',
    ];

    
    public static function buildFileName(array $doc): string
    {
        $parts = array_filter([
            'Rentally',
            self::sanitizeFileNamePart(trim(($doc['firstName'] ?? '') . ' ' . ($doc['lastName'] ?? ''))),
            self::sanitizeFileNamePart((string) ($doc['equipmentLabel'] ?? '')),
        ], static fn (string $p) => $p !== '');

        return implode(' - ', $parts) . '.pdf';
    }

    
    public static function build(array $doc): string
    {
        $autoload = __DIR__ . '/../vendor/autoload.php';
        if (!is_file($autoload)) {
            throw new RuntimeException(
                'Brak api/vendor — uruchom w katalogu api: composer install',
            );
        }
        require_once $autoload;

        $pdf = new TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);
        $pdf->SetCreator('Rentally');
        $pdf->setPrintHeader(false);
        $pdf->setPrintFooter(false);
        $margin = 14.0;
        $pdf->SetMargins($margin, $margin, $margin);
        $pdf->SetAutoPageBreak(true, $margin);
        $pdf->AddPage();

        $maxW = $pdf->getPageWidth() - $margin * 2;

        $pdf->SetFont('dejavusans', '', 10);
        foreach (self::headerLines($doc) as $line) {
            self::multiCell($pdf, $maxW, 5, $line, 10);
        }

        $pdf->SetFont('dejavusans', '', 9);
        $body = (string) ($doc['filledRegulationText'] ?? '');
        if ($body !== '') {
            self::multiCell($pdf, $maxW, 4.2, $body, 9);
        }

        $y = $pdf->GetY() + 6;
        $pageH = $pdf->getPageHeight();
        if ($y > $pageH - 70) {
            $pdf->AddPage();
            $y = $margin;
        }

        $pdf->SetFont('dejavusans', '', 10);
        $pdf->SetXY($margin, $y);
        $pdf->Cell($maxW, 5, 'Podpis Najemcy (wygenerowany elektronicznie):', 0, 1, 'L');
        $y = $pdf->GetY() + 3;

        $sig = (string) ($doc['signatureDataUrl'] ?? '');
        if ($sig !== '') {
            $binary = self::decodeDataUrl($sig);
            if ($binary !== null) {
                $fmt = str_contains($sig, 'image/png') ? 'PNG' : 'JPEG';
                try {
                    $pdf->Image('@' . $binary, $margin, $y, 80, 30, $fmt);
                } catch (Throwable) {
                    $pdf->SetXY($margin, $y);
                    $pdf->Cell($maxW, 5, '(Nie udało się osadzić obrazu podpisu.)', 0, 1, 'L');
                }
            } else {
                $pdf->SetXY($margin, $y);
                $pdf->Cell($maxW, 5, '(Nie udało się osadzić obrazu podpisu.)', 0, 1, 'L');
            }
        }

        return $pdf->Output('', 'S');
    }

    private static function multiCell(TCPDF $pdf, float $w, float $h, string $text, int $fontSize): void
    {
        $margin = 14.0;
        $pageH = $pdf->getPageHeight();
        $pdf->SetFont('dejavusans', '', $fontSize);
        if ($pdf->GetY() > $pageH - $margin) {
            $pdf->AddPage();
        }
        $pdf->MultiCell($w, $h, $text, 0, 'L', false, 1, $margin, '', true, 0, false, true, 0);
    }

    
    private static function headerLines(array $doc): array
    {
        $payment = self::PAYMENT_LABELS[$doc['paymentMethod'] ?? ''] ?? (string) ($doc['paymentMethod'] ?? '');
        $price = (float) ($doc['pricePln'] ?? 0);
        $deposit = (float) ($doc['depositPln'] ?? 0);

        $lines = [
            'Rentally — dokument podpisany',
            'Imię i nazwisko: ' . trim(($doc['firstName'] ?? '') . ' ' . ($doc['lastName'] ?? '')),
            'Adres: ' . ($doc['residentialAddress'] ?? ''),
            'Telefon: ' . ($doc['phone'] ?? ''),
            'E-mail: ' . ($doc['clientEmail'] ?? ''),
            'Dokument tożsamości: ' . ($doc['idDocument'] ?? ''),
        ];

        if (!empty($doc['pesel'])) {
            $lines[] = 'PESEL: ' . $doc['pesel'];
        }

        $lines[] = 'Przedmiot: ' . ($doc['equipmentLabel'] ?? '');
        $lines[] = 'Pakiet: ' . ($doc['packageName'] ?? '');
        $lines[] = 'Termin: ' . ($doc['dateFrom'] ?? '') . ' — ' . ($doc['dateTo'] ?? '') . ' (' . (int) ($doc['days'] ?? 0) . ' dni)';

        if (($doc['equipmentId'] ?? '') === 'e-bike' && !empty($doc['bikeModels']) && is_array($doc['bikeModels'])) {
            $lines[] = 'Rowerów łącznie: ' . (int) ($doc['equipmentCount'] ?? 1);
            $counts = is_array($doc['bikeModelCounts'] ?? null) ? $doc['bikeModelCounts'] : [];
            foreach ($doc['bikeModels'] as $m) {
                $label = $m === 'kross' ? 'KROSS Influx Hybrid 1.0' : 'WINORA Yucatan X8';
                $lines[] = $label . ': ' . (int) ($counts[$m] ?? 0);
            }
        } else {
            $lines[] = 'Liczba sprzętu: ' . (int) ($doc['equipmentCount'] ?? 1);
        }

        $lines[] = 'Kwota: ' . number_format($price, 2, '.', '') . ' PLN';
        $lines[] = 'Płatność: ' . $payment;
        if ($deposit > 0) {
            $lines[] = 'Kaucja zwrotna: ' . number_format($deposit, 0, '.', '') . ' PLN';
        }
        $lines[] = 'Data podpisania: ' . self::formatSignedAt($doc['signedAt'] ?? '');
        $lines[] = 'Osoba wydająca sprzęt: ' . trim(($doc['issuerFirstName'] ?? '') . ' ' . ($doc['issuerLastName'] ?? ''));
        $lines[] = '';

        return $lines;
    }

    private static function formatSignedAt(mixed $signedAt): string
    {
        $ts = strtotime((string) $signedAt);
        if ($ts === false) {
            return (string) $signedAt;
        }
        $prev = date_default_timezone_get();
        date_default_timezone_set('Europe/Warsaw');
        $formatted = date('d.m.Y, H:i:s', $ts);
        date_default_timezone_set($prev);
        return $formatted;
    }

    private static function sanitizeFileNamePart(string $value): string
    {
        $v = preg_replace('/[<>:"\/\\\\|?*]/', '', trim($value)) ?? '';
        return preg_replace('/\s+/', ' ', $v) ?? '';
    }

    private static function decodeDataUrl(string $dataUrl): ?string
    {
        $pos = strpos($dataUrl, 'base64,');
        if ($pos === false) {
            return null;
        }
        $raw = base64_decode(substr($dataUrl, $pos + 7), true);
        return $raw !== false ? $raw : null;
    }
}
