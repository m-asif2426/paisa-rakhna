<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\User;
use App\Services\FcmService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransactionController extends Controller
{
    // GET /transactions
    public function index(Request $request)
    {
        $txns = $request->user()
            ->transactions()
            ->latest()
            ->paginate(20);

        return response()->json(['success' => true, 'data' => $txns]);
    }

    // POST /transactions/send
    public function send(Request $request)
    {
        $request->validate([
            'recipient_phone' => 'required|string',
            'amount'          => 'required|numeric|min:1',
        ]);

        $sender = $request->user()->load('wallet');
        $recipientPhone = preg_replace('/\D/', '', $request->recipient_phone);

        if ((float) $sender->wallet->balance < (float) $request->amount) {
            return response()->json(['success' => false, 'message' => 'Insufficient balance'], 422);
        }

        $recipient = User::where('phone', $recipientPhone)->first();

        if (!$recipient) {
            return response()->json(['success' => false, 'message' => 'Recipient not found'], 404);
        }

        if ($recipient->id === $sender->id) {
            return response()->json(['success' => false, 'message' => 'Cannot send money to yourself'], 422);
        }

        if (!$recipient->is_active) {
            return response()->json(['success' => false, 'message' => 'Recipient account is not active'], 422);
        }

        DB::transaction(function () use ($sender, $recipient, $request, $recipientPhone) {
            $ref = 'TXN-' . now()->format('Ymd') . '-' . strtoupper(substr(uniqid(), -6));

            $sender->wallet->decrement('balance', $request->amount);
            $recipient->wallet->increment('balance', $request->amount);

            Transaction::create([
                'user_id'         => $sender->id,
                'wallet_id'       => $sender->wallet->id,
                'reference'       => $ref,
                'type'            => 'send',
                'status'          => 'completed',
                'amount'          => $request->amount,
                'recipient_phone' => $recipientPhone,
                'recipient_name'  => $recipient->name,
                'description'     => $request->input('description', 'Money transfer'),
            ]);

            Transaction::create([
                'user_id'         => $recipient->id,
                'wallet_id'       => $recipient->wallet->id,
                'reference'       => $ref . '-R',
                'type'            => 'receive',
                'status'          => 'completed',
                'amount'          => $request->amount,
                'recipient_phone' => $sender->phone,
                'recipient_name'  => $sender->name,
                'description'     => 'Money received from ' . $sender->name,
            ]);
        });

        $freshWallet = $sender->wallet->fresh();

        // Send push notification to recipient
        if ($recipient->fcm_token) {
            app(FcmService::class)->notifyTransfer(
                $recipient->fcm_token,
                $sender->name,
                (float) $request->amount
            );
        }

        // Build transaction slip
        $ref   = Transaction::where('user_id', $sender->id)->where('type', 'send')->latest()->first()->reference;
        $slip  = [
            'reference'       => $ref,
            'type'            => 'send',
            'amount'          => (float) $request->amount,
            'currency'        => 'PKR',
            'status'          => 'completed',
            'description'     => $request->input('description', 'Money transfer'),
            'sender_name'     => $sender->name,
            'sender_phone'    => $sender->phone,
            'sender_account'  => $sender->wallet->account_number,
            'receiver_name'   => $recipient->name,
            'receiver_phone'  => $recipient->phone,
            'receiver_account'=> $recipient->wallet->account_number ?? null,
            'fee'             => 0,
            'timestamp'       => now()->toISOString(),
        ];

        return response()->json([
            'success' => true,
            'message' => 'PKR ' . number_format($request->amount, 2) . ' sent successfully',
            'balance' => (float) $freshWallet->balance,
            'slip'    => $slip,
        ]);
    }
}
