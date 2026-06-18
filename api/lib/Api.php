<?php

declare(strict_types=1);

final class Api
{
    
    public static function handle(array $config, string $method, string $path): void
    {
        try {
            $pdo = Database::pdo($config);
        } catch (PDOException $e) {
            self::json(503, ['error' => Database::dbErrorMessage($e)]);
            return;
        }

        if ($method === 'GET' && $path === '/api/health') {
            self::health($pdo);
            return;
        }

        if ($method === 'GET' && $path === '/api/auth/me') {
            self::authMe();
            return;
        }

        if ($method === 'POST' && $path === '/api/auth/login') {
            self::authLogin($pdo);
            return;
        }

        if ($method === 'POST' && $path === '/api/auth/logout') {
            self::authLogout();
            return;
        }

        if ($method === 'GET' && $path === '/api/documents') {
            self::requireAuth();
            self::documentsList($pdo);
            return;
        }

        if ($method === 'POST' && $path === '/api/documents') {
            self::requireAuth();
            self::documentsCreate($pdo, $config);
            return;
        }

        if ($method === 'PATCH' && preg_match('#^/api/documents/([0-9a-f-]{36})/return-checklist$#', $path, $m)) {
            self::requireAuth();
            self::documentsReturnChecklist($pdo, $m[1]);
            return;
        }

        self::json(404, ['error' => 'Nie znaleziono']);
    }

    private static function health(PDO $pdo): void
    {
        try {
            $pdo->query('SELECT 1');
            self::json(200, ['ok' => true, 'db' => true]);
        } catch (PDOException $e) {
            self::json(503, [
                'ok' => false,
                'db' => false,
                'error' => Database::dbErrorMessage($e),
            ]);
        }
    }

    private static function authMe(): void
    {
        if (empty($_SESSION['userId'])) {
            self::json(401, ['error' => 'Nie zalogowano']);
            return;
        }
        self::json(200, [
            'email' => $_SESSION['email'] ?? '',
            'role' => $_SESSION['role'] ?? 'user',
        ]);
    }

    private static function authLogin(PDO $pdo): void
    {
        $body = self::jsonBody();
        $email = strtolower(trim((string) ($body['email'] ?? '')));
        $password = (string) ($body['password'] ?? '');

        if ($email === '' || $password === '') {
            self::json(400, ['error' => 'Podaj e-mail i hasło']);
            return;
        }

        $stmt = $pdo->prepare(
            'SELECT id, email, password_hash, role FROM users WHERE email = ? LIMIT 1',
        );
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, (string) $user['password_hash'])) {
            self::json(401, ['error' => 'Nieprawidłowy e-mail lub hasło']);
            return;
        }

        $_SESSION['userId'] = (int) $user['id'];
        $_SESSION['email'] = $user['email'];
        $_SESSION['role'] = $user['role'];

        self::json(200, [
            'email' => $user['email'],
            'role' => $user['role'],
        ]);
    }

    private static function authLogout(): void
    {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $p = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $p['path'],
                $p['domain'],
                (bool) $p['secure'],
                (bool) $p['httponly'],
            );
        }
        session_destroy();
        self::json(200, ['ok' => true]);
    }

    private static function documentsList(PDO $pdo): void
    {
        $stmt = $pdo->query('SELECT * FROM signed_documents ORDER BY signed_at DESC');
        $rows = $stmt->fetchAll();
        $docs = array_map(
            static fn (array $row) => DocumentsMap::stripOptionalNulls(DocumentsMap::rowToDocument($row)),
            $rows,
        );
        self::json(200, $docs);
    }

    
    private static function documentsCreate(PDO $pdo, array $config): void
    {
        $body = self::jsonBody();
        $id = self::uuidV4();
        $signedAt = self::nowIso();

        $doc = [
            'id' => $id,
            'equipmentId' => $body['equipmentId'] ?? null,
            'equipmentLabel' => $body['equipmentLabel'] ?? null,
            'firstName' => trim((string) ($body['firstName'] ?? '')),
            'lastName' => trim((string) ($body['lastName'] ?? '')),
            'residentialAddress' => $body['residentialAddress'] ?? '',
            'phone' => $body['phone'] ?? '',
            'clientEmail' => strtolower(trim((string) ($body['clientEmail'] ?? ''))),
            'idDocument' => $body['idDocument'] ?? '',
            'pesel' => $body['pesel'] ?? '',
            'packageName' => $body['packageName'] ?? '',
            'dateFrom' => $body['dateFrom'] ?? '',
            'dateTo' => $body['dateTo'] ?? '',
            'days' => $body['days'] ?? 0,
            'pricePln' => $body['pricePln'] ?? 0,
            'signedAt' => $signedAt,
            'signatureDataUrl' => $body['signatureDataUrl'] ?? '',
            'issuerFirstName' => trim((string) ($body['issuerFirstName'] ?? '')),
            'issuerLastName' => trim((string) ($body['issuerLastName'] ?? '')),
            'filledRegulationText' => $body['filledRegulationText'] ?? '',
            'bikeModels' => $body['bikeModels'] ?? null,
            'bikeModelCounts' => $body['bikeModelCounts'] ?? null,
            'equipmentCount' => $body['equipmentCount'] ?? 1,
            'paymentMethod' => $body['paymentMethod'] ?? 'cash',
            'depositPln' => $body['depositPln'] ?? 0,
            'checklistCheckedIds' => $body['checklistCheckedIds'] ?? null,
            'checklistCompleted' => !empty($body['checklistCompleted']),
            'returnChecklistCheckedIds' => $body['returnChecklistCheckedIds'] ?? null,
            'returnChecklistCompleted' => !empty($body['returnChecklistCompleted']),
            'wantsInvoice' => ValidateInvoice::parseWantsInvoice($body['wantsInvoice'] ?? false),
            'invoiceCompanyName' => trim((string) ($body['invoiceCompanyName'] ?? '')),
            'invoiceNip' => trim((string) ($body['invoiceNip'] ?? '')),
            'invoiceCity' => trim((string) ($body['invoiceCity'] ?? '')),
            'invoiceStreet' => trim((string) ($body['invoiceStreet'] ?? '')),
            'invoiceUnit' => trim((string) ($body['invoiceUnit'] ?? '')),
            'invoicePostalCode' => trim((string) ($body['invoicePostalCode'] ?? '')),
            'invoiceEmail' => strtolower(trim((string) ($body['invoiceEmail'] ?? ''))),
        ];

        if (!ValidateContact::isValidClientEmail($doc['clientEmail'])) {
            self::json(400, ['error' => 'Podaj prawidłowy adres e-mail klienta']);
            return;
        }
        if (!ValidateContact::isValidPolishPhone((string) $doc['phone'])) {
            self::json(400, ['error' => 'Podaj prawidłowy numer telefonu (9 cyfr)']);
            return;
        }
        $doc['phone'] = ValidateContact::formatPhoneForStorage((string) $doc['phone']);

        if (strlen($doc['firstName']) < 2 || strlen($doc['lastName']) < 2) {
            self::json(400, ['error' => 'Podaj imię i nazwisko (oba pola są wymagane)']);
            return;
        }
        if (strlen($doc['issuerFirstName']) < 2 || strlen($doc['issuerLastName']) < 2) {
            self::json(400, ['error' => 'Podaj imię i nazwisko osoby wydającej sprzęt (oba pola są wymagane)']);
            return;
        }

        $invoiceError = ValidateInvoice::validateInvoiceFields($doc);
        if ($invoiceError !== null) {
            self::json(400, ['error' => $invoiceError]);
            return;
        }

        $userId = isset($_SESSION['userId']) ? (int) $_SESSION['userId'] : null;
        $row = DocumentsMap::documentToRow($doc, $userId);

        $sql = 'INSERT INTO signed_documents (
            id, equipment_id, equipment_label, first_name, last_name, full_name, residential_address, phone,
            client_email, id_document, pesel, package_name, date_from, date_to, days, price_pln,
            signed_at, signature_data_url, issuer_first_name, issuer_last_name,
            filled_regulation_text, bike_models, bike_model_counts, equipment_count, payment_method, deposit_pln,
            wants_invoice, invoice_company_name, invoice_nip, invoice_city, invoice_street,
            invoice_unit, invoice_postal_code, invoice_email,
            checklist_checked_ids, checklist_completed, return_checklist_checked_ids,
            return_checklist_completed, created_by_user_id
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )';

        $pdo->prepare($sql)->execute([
            $row['id'],
            $row['equipment_id'],
            $row['equipment_label'],
            $row['first_name'],
            $row['last_name'],
            $row['full_name'],
            $row['residential_address'],
            $row['phone'],
            $row['client_email'],
            $row['id_document'],
            $row['pesel'],
            $row['package_name'],
            $row['date_from'],
            $row['date_to'],
            $row['days'],
            $row['price_pln'],
            $row['signed_at'],
            $row['signature_data_url'],
            $row['issuer_first_name'],
            $row['issuer_last_name'],
            $row['filled_regulation_text'],
            $row['bike_models'],
            $row['bike_model_counts'],
            $row['equipment_count'],
            $row['payment_method'],
            $row['deposit_pln'],
            $row['wants_invoice'],
            $row['invoice_company_name'],
            $row['invoice_nip'],
            $row['invoice_city'],
            $row['invoice_street'],
            $row['invoice_unit'],
            $row['invoice_postal_code'],
            $row['invoice_email'],
            $row['checklist_checked_ids'],
            $row['checklist_completed'],
            $row['return_checklist_checked_ids'],
            $row['return_checklist_completed'],
            $row['created_by_user_id'],
        ]);

        $stmt = $pdo->prepare('SELECT * FROM signed_documents WHERE id = ?');
        $stmt->execute([$id]);
        $saved = DocumentsMap::stripOptionalNulls(
            DocumentsMap::rowToDocument($stmt->fetch() ?: []),
        );
        $docForEmail = ValidateInvoice::mergeInvoiceFields($saved, $doc);

        try {
            $emailStatus = Mail::sendSignedDocumentEmails($docForEmail, $config);
        } catch (Throwable $e) {
            error_log('[email] ' . $e->getMessage());
            $emailStatus = [
                'sent' => false,
                'reason' => $e->getMessage(),
            ];
        }

        $response = array_merge($docForEmail, ['emailStatus' => $emailStatus]);
        self::json(201, $response);
    }

    private static function documentsReturnChecklist(PDO $pdo, string $id): void
    {
        $body = self::jsonBody();
        $checkedIds = is_array($body['checkedIds'] ?? null) ? $body['checkedIds'] : [];
        $completed = !empty($body['completed']);

        $json = count($checkedIds) > 0
            ? json_encode($checkedIds, JSON_UNESCAPED_UNICODE)
            : null;

        $exists = $pdo->prepare('SELECT id FROM signed_documents WHERE id = ?');
        $exists->execute([$id]);
        if (!$exists->fetch()) {
            self::json(404, ['error' => 'Nie znaleziono dokumentu']);
            return;
        }

        $stmt = $pdo->prepare(
            'UPDATE signed_documents SET
                return_checklist_checked_ids = ?,
                return_checklist_completed = ?
            WHERE id = ?',
        );
        $stmt->execute([$json, $completed ? 1 : 0, $id]);

        $sel = $pdo->prepare('SELECT * FROM signed_documents WHERE id = ?');
        $sel->execute([$id]);
        $row = $sel->fetch();
        if (!$row) {
            self::json(404, ['error' => 'Nie znaleziono dokumentu']);
            return;
        }
        self::json(200, DocumentsMap::stripOptionalNulls(DocumentsMap::rowToDocument($row)));
    }

    private static function nowIso(): string
    {
        $micro = microtime(true);
        $ms = sprintf('%03d', (int) round(($micro - floor($micro)) * 1000));
        return gmdate('Y-m-d\TH:i:s', (int) $micro) . '.' . $ms . 'Z';
    }

    private static function requireAuth(): void
    {
        if (empty($_SESSION['userId'])) {
            self::json(401, ['error' => 'Wymagane logowanie']);
            exit;
        }
    }

    
    private static function jsonBody(): array
    {
        $raw = file_get_contents('php://input');
        if ($raw === false || $raw === '') {
            return [];
        }
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }

    private static function uuidV4(): string
    {
        $data = random_bytes(16);
        $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
        $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);
        return vsprintf(
            '%s%s-%s-%s-%s-%s%s%s',
            str_split(bin2hex($data), 4),
        );
    }

    private static function json(int $status, mixed $data): void
    {
        http_response_code($status);
        if (is_array($data) && array_is_list($data)) {
            echo json_encode($data, JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode($data, JSON_UNESCAPED_UNICODE);
        }
        exit;
    }
}
