<?php

declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;

final class Mail
{
    private const BIURO_EMAIL = 'biuro@ja-yhymm.pl';

    public static function sendSignedDocumentEmails(array $doc, array $config): array
    {
        $pdfBytes = null;
        $fileName = PdfBuilder::buildFileName($doc);
        try {
            $pdfBytes = PdfBuilder::build($doc);
        } catch (Throwable $e) {
            error_log('[email] PDF: ' . $e->getMessage());
            return ['sent' => false, 'reason' => 'pdf_not_configured'];
        }

        $from = (string) ($config['mail_from'] ?? ('"Rentally" <' . self::BIURO_EMAIL . '>'));
        $subject = 'Rentally — potwierdzenie podpisu: ' . ($doc['equipmentLabel'] ?? '');
        $text = self::buildBodyText($doc);
        $notifyEmails = self::getNotifyEmails($config);
        $clientEmail = strtolower(trim((string) ($doc['clientEmail'] ?? '')));

        $mailer = self::createMailer($config);
        if ($mailer === null) {
            return ['sent' => false, 'reason' => 'smtp_not_configured'];
        }

        try {
            if ($clientEmail !== '') {
                $bcc = array_values(array_filter(
                    $notifyEmails,
                    static fn (string $e) => strtolower($e) !== $clientEmail,
                ));
                self::sendWithMailer(
                    $mailer,
                    $from,
                    $clientEmail,
                    $bcc,
                    $subject,
                    $text,
                    $fileName,
                    $pdfBytes,
                );
            } else {
                self::sendWithMailer(
                    $mailer,
                    $from,
                    $notifyEmails,
                    [],
                    $subject . ' (brak e-mail klienta)',
                    $text,
                    $fileName,
                    $pdfBytes,
                );
            }
        } catch (Throwable $e) {
            error_log('[email] SMTP: ' . $e->getMessage());
            return ['sent' => false, 'reason' => 'mail_failed'];
        }

        return [
            'sent' => true,
            'clientEmail' => $clientEmail !== '' ? $clientEmail : null,
            'notifyEmails' => $notifyEmails,
        ];
    }

    private static function createMailer(array $config): ?PHPMailer
    {
        $autoload = dirname(__DIR__) . '/vendor/autoload.php';
        if (!is_file($autoload)) {
            return null;
        }
        require_once $autoload;

        $host = trim((string) ($config['smtp_host'] ?? ''));
        $user = trim((string) ($config['smtp_user'] ?? ''));
        $pass = (string) ($config['smtp_pass'] ?? '');
        if ($host === '' || $user === '' || $pass === '') {
            return null;
        }

        $mail = new PHPMailer(true);
        $mail->isSMTP();
        $mail->Host = $host;
        $mail->SMTPAuth = true;
        $mail->Username = $user;
        $mail->Password = $pass;
        $mail->Port = (int) ($config['smtp_port'] ?? 465);
        $secure = $config['smtp_secure'] ?? true;
        if ($secure === true || $secure === 1 || $secure === '1' || $secure === 'true') {
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        }
        $mail->CharSet = 'UTF-8';
        $mail->Encoding = 'base64';

        return $mail;
    }

    private static function sendWithMailer(
        PHPMailer $mail,
        string $from,
        string|array $to,
        array $bcc,
        string $subject,
        string $text,
        string $fileName,
        string $pdfBytes,
    ): void {
        $mail->clearAllRecipients();
        $mail->clearAttachments();
        if (preg_match('/^"([^"]+)"\s*<([^>]+)>$/', $from, $m)) {
            $mail->setFrom($m[2], $m[1]);
        } elseif (preg_match('/<([^>]+)>/', $from, $m)) {
            $mail->setFrom($m[1], '');
        } else {
            $mail->setFrom(trim($from), '');
        }

        foreach ((array) $to as $addr) {
            $a = trim($addr);
            if ($a !== '') {
                $mail->addAddress($a);
            }
        }
        foreach ($bcc as $addr) {
            $a = trim($addr);
            if ($a !== '') {
                $mail->addBCC($a);
            }
        }

        $mail->isHTML(false);
        $mail->Subject = $subject;
        $mail->Body = $text;
        $mail->addStringAttachment($pdfBytes, $fileName, 'base64', 'application/pdf');
        $mail->send();
    }

    private static function buildBodyText(array $doc): string
    {
        $lines = [
            'Dzień dobry,',
            '',
            'W załączniku przesyłamy podpisany dokument (' . ($doc['equipmentLabel'] ?? '') . ').',
            'Imię i nazwisko: ' . trim(($doc['firstName'] ?? '') . ' ' . ($doc['lastName'] ?? '')),
            'Osoba wydająca sprzęt: ' . trim(($doc['issuerFirstName'] ?? '') . ' ' . ($doc['issuerLastName'] ?? '')),
            'Termin wynajmu: ' . ($doc['dateFrom'] ?? '') . ' — ' . ($doc['dateTo'] ?? ''),
        ];
        return implode("\n", array_merge($lines, ValidateInvoice::formatInvoiceTextLines($doc), [
            '',
            'Pozdrawiamy,',
            'Rentally',
        ]));
    }

    private static function getNotifyEmails(array $config): array
    {
        $parts = array_filter([
            (string) ($config['notify_emails'] ?? ''),
            (string) ($config['office_email'] ?? ''),
        ]);
        $raw = $parts !== [] ? implode(',', $parts) : (self::BIURO_EMAIL . ',kontakt@rent-aboco.pl');
        $emails = [];
        foreach (explode(',', $raw) as $part) {
            $e = strtolower(trim($part));
            if ($e !== '') {
                $emails[$e] = true;
            }
        }
        $emails[strtolower(self::BIURO_EMAIL)] = true;
        return array_keys($emails);
    }
}
