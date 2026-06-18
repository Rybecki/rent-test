<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

if (preg_match('#(/api/.*)$#', $path, $m)) {
    $path = $m[1];
}

try {
    Api::handle($config, $method, $path);
} catch (PDOException $e) {
    http_response_code(503);
    echo json_encode(['error' => Database::dbErrorMessage($e)], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    error_log('[api] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Wewnętrzny błąd serwera'], JSON_UNESCAPED_UNICODE);
}
