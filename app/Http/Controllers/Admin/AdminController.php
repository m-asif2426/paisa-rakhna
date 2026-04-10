<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    public function dashboard()
    {
        $stats = [
            'total_users'        => User::where('is_admin', false)->count(),
            'active_users'       => User::where('is_admin', false)->where('is_active', true)->count(),
            'new_users_month'    => User::where('is_admin', false)->whereMonth('created_at', now()->month)->count(),
            'total_transactions' => Transaction::count(),
            'total_volume'       => (float) Transaction::where('status', 'completed')->sum('amount'),
            'completed_txns'     => Transaction::where('status', 'completed')->count(),
            'pending_txns'       => Transaction::where('status', 'pending')->count(),
            'total_balance'      => (float) Wallet::where('status', 'active')->sum('balance'),
        ];

        $recent = Transaction::with('user')->latest()->take(10)->get();

        return view('admin.dashboard', compact('stats', 'recent'));
    }

    public function users(Request $request)
    {
        $query = User::where('is_admin', false)
            ->withCount('transactions')
            ->with('wallet');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($kyc = $request->input('kyc_status')) {
            $query->where('kyc_status', $kyc);
        }

        $users = $query->latest()->paginate(20)->withQueryString();

        return view('admin.users', compact('users'));
    }

    public function showUser(User $user)
    {
        $user->load(['wallet', 'mpin']);
        $transactions = Transaction::where('user_id', $user->id)->latest()->paginate(15);
        $kyc          = \App\Models\KycDocument::where('user_id', $user->id)->latest()->first();

        return view('admin.user-detail', compact('user', 'transactions', 'kyc'));
    }

    public function toggleUser(User $user)
    {
        if ($user->is_admin) {
            return back()->with('error', 'Cannot deactivate admin accounts.');
        }

        $user->update(['is_active' => !$user->is_active]);
        $status = $user->is_active ? 'activated' : 'deactivated';

        return back()->with('success', "User \"{$user->name}\" has been {$status}.");
    }

    public function walletAdjust(Request $request, User $user)
    {
        $request->validate([
            'action' => 'required|in:add,deduct',
            'amount' => 'required|numeric|min:1|max:1000000',
            'note'   => 'required|string|max:255',
        ]);

        if ($user->is_admin) {
            return back()->with('error', 'Cannot adjust admin wallet.');
        }

        $wallet = $user->wallet;
        if (!$wallet) {
            return back()->with('error', 'User has no wallet.');
        }

        $amount = (float) $request->amount;

        if ($request->action === 'deduct' && $wallet->balance < $amount) {
            return back()->with('error', 'Cannot deduct more than current balance (PKR ' . number_format($wallet->balance, 2) . ').');
        }

        DB::transaction(function () use ($wallet, $user, $request, $amount) {
            $ref = 'ADJ-' . now()->format('Ymd') . '-' . strtoupper(substr(uniqid(), -6));

            if ($request->action === 'add') {
                $wallet->increment('balance', $amount);
                $type = 'add_money';
            } else {
                $wallet->decrement('balance', $amount);
                $type = 'withdrawal';
            }

            Transaction::create([
                'user_id'     => $user->id,
                'wallet_id'   => $wallet->id,
                'reference'   => $ref,
                'type'        => $type,
                'status'      => 'completed',
                'amount'      => $amount,
                'description' => '[Admin Adjustment] ' . $request->note,
                'currency'    => $wallet->currency,
            ]);
        });

        $action = $request->action === 'add' ? 'added to' : 'deducted from';
        return back()->with('success', "PKR " . number_format($amount, 2) . " {$action} {$user->name}'s wallet.");
    }

    public function transactions(Request $request)
    {
        $query = Transaction::with('user')->latest();

        if ($type = $request->input('type')) {
            $query->where('type', $type);
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                  ->orWhere('recipient_name', 'like', "%{$search}%")
                  ->orWhere('recipient_phone', 'like', "%{$search}%")
                  ->orWhereHas('user', fn($u) => $u->where('name', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%"));
            });
        }

        if ($from = $request->input('date_from')) {
            $query->whereDate('created_at', '>=', $from);
        }

        if ($to = $request->input('date_to')) {
            $query->whereDate('created_at', '<=', $to);
        }

        $transactions = $query->paginate(25)->withQueryString();

        $types    = ['send', 'receive', 'add_money', 'withdrawal', 'bill_payment', 'easyload', 'exchange', 'easyloan_repay'];
        $statuses = ['pending', 'completed', 'failed', 'reversed'];

        return view('admin.transactions', compact('transactions', 'types', 'statuses'));
    }

    public function exportUsers(Request $request)
    {
        $query = User::where('is_admin', false)->with('wallet');

        if ($kyc = $request->input('kyc_status')) {
            $query->where('kyc_status', $kyc);
        }

        $users = $query->latest()->get();

        $headers = ['ID', 'Name', 'Phone', 'Email', 'KYC Status', 'Balance (PKR)', 'Status', 'Joined'];
        $rows    = $users->map(fn($u) => [
            $u->id,
            $u->name,
            $u->phone,
            $u->email ?? '',
            $u->kyc_status,
            $u->wallet ? number_format($u->wallet->balance, 2) : '0.00',
            $u->is_active ? 'Active' : 'Inactive',
            $u->created_at->format('Y-m-d H:i'),
        ]);

        return $this->csvResponse('users_export_' . now()->format('Ymd') . '.csv', $headers, $rows);
    }

    public function exportTransactions(Request $request)
    {
        $query = Transaction::with('user')->latest();

        if ($type = $request->input('type')) {
            $query->where('type', $type);
        }
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }
        if ($from = $request->input('date_from')) {
            $query->whereDate('created_at', '>=', $from);
        }
        if ($to = $request->input('date_to')) {
            $query->whereDate('created_at', '<=', $to);
        }

        $transactions = $query->limit(5000)->get();

        $headers = ['Reference', 'User', 'Phone', 'Type', 'Amount (PKR)', 'Fee', 'Recipient', 'Status', 'Date'];
        $rows    = $transactions->map(fn($t) => [
            $t->reference,
            $t->user?->name ?? '',
            $t->user?->phone ?? '',
            $t->type,
            number_format($t->amount, 2),
            number_format($t->fee ?? 0, 2),
            $t->recipient_name ?? $t->recipient_phone ?? '',
            $t->status,
            $t->created_at->format('Y-m-d H:i'),
        ]);

        return $this->csvResponse('transactions_export_' . now()->format('Ymd') . '.csv', $headers, $rows);
    }

    private function csvResponse(string $filename, array $headers, $rows)
    {
        $callback = function () use ($headers, $rows) {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF)); // UTF-8 BOM for Excel
            fputcsv($handle, $headers);
            foreach ($rows as $row) {
                fputcsv($handle, $row);
            }
            fclose($handle);
        };

        return response()->stream($callback, 200, [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}
