<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;

class StatementController extends Controller
{
    // GET /statement?from=2026-01-01&to=2026-04-30&format=json|html
    public function download(Request $request)
    {
        $request->validate([
            'from'   => 'nullable|date',
            'to'     => 'nullable|date|after_or_equal:from',
            'format' => 'nullable|in:json,html',
        ]);

        $user  = $request->user();
        $from  = $request->input('from', now()->subMonths(3)->toDateString());
        $to    = $request->input('to', now()->toDateString());
        $format = $request->input('format', 'json');

        $transactions = Transaction::where('user_id', $user->id)
            ->whereBetween(\DB::raw('date(created_at)'), [$from, $to])
            ->latest()
            ->get();

        $openingBalance = (float) Transaction::where('user_id', $user->id)
            ->whereDate('created_at', '<', $from)
            ->selectRaw("sum(case when type in ('receive','add_money') then amount else -amount end) as bal")
            ->value('bal') ?? 0;

        $summary = [
            'total_in'  => $transactions->whereIn('type', ['receive', 'add_money'])->sum('amount'),
            'total_out' => $transactions->whereIn('type', ['send', 'withdrawal', 'bill_payment', 'easyload'])->sum('amount'),
            'count'     => $transactions->count(),
        ];

        if ($format === 'html') {
            $html = view('statement.pdf', compact('user', 'transactions', 'from', 'to', 'summary', 'openingBalance'))->render();
            return response($html, 200)->header('Content-Type', 'text/html');
        }

        return response()->json([
            'success'          => true,
            'user'             => ['name' => $user->name, 'phone' => $user->phone, 'account' => $user->wallet->account_number ?? '—'],
            'period'           => ['from' => $from, 'to' => $to],
            'summary'          => $summary,
            'opening_balance'  => $openingBalance,
            'closing_balance'  => $user->wallet->balance ?? 0,
            'transactions'     => $transactions->map(fn($t) => [
                'reference'   => $t->reference,
                'type'        => $t->type,
                'amount'      => $t->amount,
                'description' => $t->description,
                'status'      => $t->status,
                'date'        => $t->created_at->format('d M Y H:i'),
            ]),
        ]);
    }
}
