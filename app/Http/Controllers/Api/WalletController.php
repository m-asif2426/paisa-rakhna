<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WalletController extends Controller
{
    // GET /wallet
    public function show(Request $request)
    {
        $wallet = $request->user()->wallet;

        if (!$wallet) {
            return response()->json(['success' => false, 'message' => 'Wallet not found'], 404);
        }

        return response()->json([
            'success' => true,
            'wallet'  => [
                'balance'        => (float) $wallet->balance,
                'account_number' => $wallet->account_number,
                'currency'       => $wallet->currency,
                'status'         => $wallet->status,
            ],
        ]);
    }

    // POST /wallet/topup
    // Simulated top-up — in production this would be triggered by a payment gateway callback
    public function topup(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:100|max:100000',
        ]);

        $user   = $request->user()->load('wallet');
        $wallet = $user->wallet;

        if (!$wallet) {
            return response()->json(['success' => false, 'message' => 'Wallet not found'], 404);
        }

        DB::transaction(function () use ($wallet, $user, $request) {
            $ref = 'TOP-' . now()->format('Ymd') . '-' . strtoupper(substr(uniqid(), -6));

            $wallet->increment('balance', $request->amount);

            Transaction::create([
                'user_id'     => $user->id,
                'wallet_id'   => $wallet->id,
                'reference'   => $ref,
                'type'        => 'add_money',
                'status'      => 'completed',
                'amount'      => $request->amount,
                'description' => 'Wallet top-up',
                'currency'    => $wallet->currency,
            ]);
        });

        $newBalance = (float) $wallet->fresh()->balance;
        $ref = 'TOP-' . now()->format('Ymd') . '-' . strtoupper(substr(uniqid(), -6));
        // Note: ref was generated inside DB::transaction above — retrieve it
        $lastTx = \App\Models\Transaction::where('user_id', $user->id)
            ->where('type', 'add_money')->latest()->first();

        $slip = [
            'reference'      => $lastTx?->reference ?? $ref,
            'type'           => 'topup',
            'amount'         => (float) $request->amount,
            'currency'       => 'PKR',
            'status'         => 'completed',
            'description'    => 'Wallet top-up',
            'sender_name'    => $user->name,
            'sender_phone'   => $user->phone,
            'sender_account' => $wallet->account_number,
            'receiver_name'  => $user->name,
            'receiver_phone' => $user->phone,
            'receiver_account'=> $wallet->account_number,
            'fee'            => 0,
            'timestamp'      => now()->toISOString(),
        ];

        return response()->json([
            'success' => true,
            'message' => 'PKR ' . number_format($request->amount, 2) . ' added to your wallet',
            'balance' => $newBalance,
            'slip'    => $slip,
        ]);
    }
}
