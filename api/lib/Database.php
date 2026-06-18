<?php

declare(strict_types=1);

final class Database
{
    private static ?PDO $pdo = null;

    
    public static function pdo(array $config): PDO
    {
        if (self::$pdo !== null) {
            return self::$pdo;
        }

        $db = $config['db'] ?? [];
        $host = (string) ($db['host'] ?? 'localhost');
        $port = (int) ($db['port'] ?? 3306);
        $name = (string) ($db['name'] ?? '');
        $user = (string) ($db['user'] ?? '');
        $pass = (string) ($db['pass'] ?? '');

        $dsn = "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4";

        self::$pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);

        return self::$pdo;
    }

    public static function dbErrorMessage(PDOException $e): string
    {
        $code = (int) ($e->errorInfo[1] ?? 0);
        if ($code === 1045) {
            return 'Brak dostępu do bazy MySQL (zły login/hasło).';
        }
        if ($code === 2002 || $code === 2003) {
            return 'Nie można połączyć się z serwerem bazy — sprawdź DB_HOST w api/config.php (na hostingu: localhost).';
        }
        return 'Błąd połączenia z bazą danych.';
    }
}
