<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FcmService
{
    private string $serverKey;
    private string $fcmUrl = 'https://fcm.googleapis.com/fcm/send';

    public function __construct()
    {
        $this->serverKey = config('services.fcm.server_key', '');
    }

    /**
     * Send a push notification to a single FCM token.
     */
    public function sendToDevice(string $fcmToken, string $title, string $body, array $data = []): bool
    {
        if (empty($this->serverKey) || empty($fcmToken)) {
            Log::info('FCM: skipped (no server key or token)', compact('title', 'body'));
            return true; // non-fatal in dev
        }

        $payload = [
            'to'           => $fcmToken,
            'notification' => [
                'title' => $title,
                'body'  => $body,
                'sound' => 'default',
                'badge' => 1,
            ],
            'data'         => $data,
            'priority'     => 'high',
        ];

        try {
            $response = Http::withHeaders([
                'Authorization' => "key={$this->serverKey}",
                'Content-Type'  => 'application/json',
            ])->post($this->fcmUrl, $payload);

            if (!$response->successful()) {
                Log::warning('FCM send failed', ['status' => $response->status(), 'body' => $response->body()]);
                return false;
            }

            return true;
        } catch (\Throwable $e) {
            Log::error('FCM exception: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Notify user of a successful money transfer.
     */
    public function notifyTransfer(string $fcmToken, string $senderName, float $amount): bool
    {
        return $this->sendToDevice(
            $fcmToken,
            'Money Received 💸',
            sprintf('PKR %s received from %s', number_format($amount, 0), $senderName),
            ['type' => 'transaction', 'action' => 'receive']
        );
    }

    /**
     * Notify admin of a new KYC submission.
     */
    public function notifyKycSubmitted(string $fcmToken, string $userName): bool
    {
        return $this->sendToDevice(
            $fcmToken,
            'New KYC Submission 📋',
            "{$userName} submitted KYC documents for review.",
            ['type' => 'kyc', 'action' => 'submitted']
        );
    }
}
