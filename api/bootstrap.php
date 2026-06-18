<?php

declare(strict_types=1);

$configPath = __DIR__ . '/config.php';
if (!is_file($configPath)) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'error' => 'Brak pliku api/config.php',
    ]);
    exit;
}

$config = require $configPath;

$sessionPath = (string) ($config['session_path'] ?? '');
if ($sessionPath === '') {
    $script = str_replace('\\', '/', (string) ($_SERVER['SCRIPT_NAME'] ?? '/api/index.php'));
    $base = dirname(dirname($script));
    $sessionPath = ($base === '/' || $base === '.') ? '/' : rtrim($base, '/') . '/';
}

session_name('rentaboco_sid');
session_set_cookie_params([
    'lifetime' => 7 * 24 * 60 * 60,
    'path' => $sessionPath,
    'httponly' => true,
    'samesite' => 'Lax',
    'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
]);
session_start();

header('Content-Type: application/json; charset=utf-8');

$origin = $config['client_origin'] ?? '';
if ($origin !== '' && isset($_SERVER['HTTP_ORIGIN']) && $_SERVER['HTTP_ORIGIN'] === $origin) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/lib/Database.php';
require_once __DIR__ . '/lib/ValidateContact.php';
require_once __DIR__ . '/lib/ValidateInvoice.php';
require_once __DIR__ . '/lib/DocumentsMap.php';
require_once __DIR__ . '/lib/PdfBuilder.php';
require_once __DIR__ . '/lib/Mail.php';
require_once __DIR__ . '/lib/Api.php';
