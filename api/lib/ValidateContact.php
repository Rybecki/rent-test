<?php

declare(strict_types=1);

final class ValidateContact
{
    private const EMAIL_RE = '/^[a-zA-Z0-9.!#$%&\'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/';

    public static function normalizePhoneDigits(string $phone): string
    {
        $digits = preg_replace('/\D/', '', $phone) ?? '';
        if (str_starts_with($digits, '48') && strlen($digits) >= 11) {
            $digits = substr($digits, 2);
        }
        if (str_starts_with($digits, '0') && strlen($digits) === 10) {
            $digits = substr($digits, 1);
        }
        return substr($digits, 0, 9);
    }

    public static function isValidPolishPhone(string $phone): bool
    {
        $digits = self::normalizePhoneDigits($phone);
        return (bool) preg_match('/^[1-9]\d{8}$/', $digits);
    }

    public static function isValidClientEmail(string $email): bool
    {
        $t = strtolower(trim($email));
        if (strlen($t) < 5 || strlen($t) > 254) {
            return false;
        }
        return (bool) preg_match(self::EMAIL_RE, $t);
    }

    public static function formatPhoneForStorage(string $phone): string
    {
        return self::normalizePhoneDigits($phone);
    }
}
