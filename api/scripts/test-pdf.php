<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/lib/PdfBuilder.php';

$sampleDoc = [
    'id' => '00000000-0000-4000-8000-000000000001',
    'equipmentId' => 'e-bike',
    'equipmentLabel' => 'Rower elektryczny',
    'firstName' => 'Jan',
    'lastName' => 'Kowalski',
    'residentialAddress' => 'ul. Testowa 1, 00-001 Warszawa',
    'phone' => '501234567',
    'clientEmail' => 'jan@example.com',
    'idDocument' => 'ABC123456',
    'pesel' => '',
    'packageName' => 'Pakiet standard',
    'dateFrom' => '2026-05-27',
    'dateTo' => '2026-05-30',
    'days' => 3,
    'pricePln' => 299.5,
    'signedAt' => gmdate('Y-m-d\TH:i:s.v\Z'),
    'signatureDataUrl' => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'issuerFirstName' => 'Anna',
    'issuerLastName' => 'Nowak',
    'filledRegulationText' => "§1 Przykładowy regulamin.\n§2 Drugi akapit z polskimi znakami: ąęółżźćń.",
    'bikeModels' => ['kross', 'winora'],
    'bikeModelCounts' => ['kross' => 1, 'winora' => 1],
    'equipmentCount' => 2,
    'paymentMethod' => 'card',
    'depositPln' => 200,
    'wantsInvoice' => false,
];

$outDir = dirname(__DIR__, 2) . '/tmp';
if (!is_dir($outDir)) {
    mkdir($outDir, 0755, true);
}

$bytes = PdfBuilder::build($sampleDoc);
$name = PdfBuilder::buildFileName($sampleDoc);
$path = $outDir . '/sample-php.pdf';
file_put_contents($path, $bytes);
echo "Zapisano: {$path} ({$name}, " . strlen($bytes) . " bajtów)\n";
