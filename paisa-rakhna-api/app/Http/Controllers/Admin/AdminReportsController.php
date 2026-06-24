<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminReportsController extends Controller
{
    public function index(Request $request)
    {
        $period = $request->input('period', '30'); // days

        // Daily transaction volume (last N days)
        $dailyVolume = Transaction::where('status', 'completed')
            ->where('created_at', '>=', now()->subDays((int) $period))
            ->select(
                DB::raw("DATE(created_at) as date"),
                DB::raw("COUNT(*) as count"),
                DB::raw("SUM(amount) as volume"),
                DB::raw("SUM(CASE WHEN type IN ('send','bill_payment','easyload','withdrawal') THEN amount ELSE 0 END) as outflow"),
                DB::raw("SUM(CASE WHEN type IN ('receive','add_money') THEN amount ELSE 0 END) as inflow"),
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Transaction type breakdown
        $typeBreakdown = Transaction::where('status', 'completed')
            ->where('created_at', '>=', now()->subDays((int) $period))
            ->select('type', DB::raw('COUNT(*) as count'), DB::raw('SUM(amount) as total'))
            ->groupBy('type')
            ->orderByDesc('total')
            ->get();

        // User growth (registrations per day)
        $userGrowth = User::where('is_admin', false)
            ->where('created_at', '>=', now()->subDays((int) $period))
            ->select(DB::raw("DATE(created_at) as date"), DB::raw("COUNT(*) as count"))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Top users by volume
        $topUsers = Transaction::where('status', 'completed')
            ->where('created_at', '>=', now()->subDays((int) $period))
            ->select('user_id', DB::raw('COUNT(*) as txn_count'), DB::raw('SUM(amount) as total_volume'))
            ->groupBy('user_id')
            ->orderByDesc('total_volume')
            ->limit(10)
            ->with('user:id,name,phone')
            ->get();

        // Summary stats
        $summary = [
            'total_volume' => Transaction::where('status', 'completed')
                ->where('created_at', '>=', now()->subDays((int) $period))->sum('amount'),
            'total_txns'   => Transaction::where('status', 'completed')
                ->where('created_at', '>=', now()->subDays((int) $period))->count(),
            'avg_txn_size' => Transaction::where('status', 'completed')
                ->where('created_at', '>=', now()->subDays((int) $period))->avg('amount') ?? 0,
            'total_wallets_balance' => (float) Wallet::where('status', 'active')->sum('balance'),
            'new_users'    => User::where('is_admin', false)
                ->where('created_at', '>=', now()->subDays((int) $period))->count(),
            'active_rate'  => User::where('is_admin', false)->count() > 0
                ? round(User::where('is_admin', false)->whereHas('transactions', fn($q) => $q->where('created_at', '>=', now()->subDays((int) $period)))->count() / User::where('is_admin', false)->count() * 100, 1)
                : 0,
        ];

        $periods = ['7' => 'Last 7 days', '30' => 'Last 30 days', '90' => 'Last 90 days', '365' => 'Last 1 year'];

        return view('admin.reports', compact('dailyVolume', 'typeBreakdown', 'userGrowth', 'topUsers', 'summary', 'period', 'periods'));
    }
}
