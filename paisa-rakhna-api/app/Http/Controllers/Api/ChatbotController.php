<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ChatbotController extends Controller
{
    // POST /chatbot
    public function chat(Request $request)
    {
        $request->validate(['message' => 'required|string|max:500']);

        $user   = $request->user();
        $wallet = $user?->wallet;

        // Build user context for AI
        $balance      = $wallet ? number_format((float) $wallet->balance, 2) : 'N/A';
        $accountNo    = $wallet?->account_number ?? 'N/A';
        $recentTxns   = $user ? Transaction::where('user_id', $user->id)
            ->latest()->limit(3)->get()
            ->map(fn($t) => "{$t->type}: PKR {$t->amount} — {$t->description} ({$t->created_at->diffForHumans()})")
            ->implode("\n") : 'No transactions';

        // Sanitize user-controlled data to prevent prompt injection
        $safeName    = preg_replace('/[^\p{L}\p{N} ]/u', '', $user?->name ?? 'Unknown');
        $safeBalance = preg_replace('/[^0-9.,]/', '', $balance);
        $safeAccount = preg_replace('/[^A-Z0-9\-]/', '', $accountNo);

        $systemPrompt = "You are 'Paisa Rakhna AI', a helpful banking assistant for a Pakistani fintech app called Paisa Rakhna.

User's name: {$safeName}
Current wallet balance: PKR {$safeBalance}
Account number: {$safeAccount}
Recent transactions:\n{$recentTxns}

Rules:
- Reply in the SAME language as the user (Urdu → Roman Urdu, English → English)
- For Urdu use Roman Urdu script, NOT Arabic/Nastaliq
- NEVER reveal sensitive data like full card numbers or passwords
- Keep responses concise — 2-3 sentences max
- For actual transactions, always direct user to use the app buttons
- If asked about balance, use the real balance shown above
- Be friendly and helpful";

        $apiKey = config('services.openai.key');

        if (!$apiKey) {
            return response()->json([
                'success' => true,
                'reply'   => $this->localFallback($request->message, $balance),
            ]);
        }

        $response = Http::withToken($apiKey)
            ->timeout(15)
            ->post('https://api.openai.com/v1/chat/completions', [
                'model'       => 'gpt-4o-mini',
                'max_tokens'  => 200,
                'temperature' => 0.7,
                'messages'    => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user',   'content' => $request->message],
                ],
            ]);

        if ($response->failed()) {
            return response()->json([
                'success' => true,
                'reply'   => $this->localFallback($request->message, $balance),
            ]);
        }

        return response()->json([
            'success' => true,
            'reply'   => $response->json('choices.0.message.content'),
        ]);
    }

    private function localFallback(string $msg, string $balance): string
    {
        $lower = strtolower($msg);
        if (str_contains($lower, 'balance') || str_contains($lower, 'kitna'))
            return "Aapka current balance PKR {$balance} hai.";
        if (str_contains($lower, 'send') || str_contains($lower, 'bhej'))
            return 'Paise bhejne ke liye Home screen pe "Send" button press karein aur recipient ka number enter karein.';
        if (str_contains($lower, 'otp'))
            return 'OTP aapke registered number pe SMS ke zariye aata hai — 5 minutes mein expire hota hai.';
        if (str_contains($lower, 'pin') || str_contains($lower, 'mpin'))
            return 'M-PIN 4-digit hota hai jo har transaction pe verify hota hai. More > Security mein change kar sakte hain.';
        if (str_contains($lower, 'zakat'))
            return 'Zakat calculate karne ke liye More > Zakat Calculator use karein — live gold/silver rates pe based hai.';
        if (str_contains($lower, 'bill'))
            return 'Bill payment ke liye Home screen pe "Bill Pay" service use karein.';
        if (str_contains($lower, 'card'))
            return 'Apne cards manage karne ke liye Cards tab use karein — freeze, controls, aur limits sab wahan hain.';
        return 'Mujhe samajh nahi aaya. Paisa Rakhna app ke baare mein koi bhi sawal poochhein!';
    }
}
