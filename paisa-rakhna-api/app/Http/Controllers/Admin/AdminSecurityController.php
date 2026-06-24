<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SecurityLog;
use App\Services\AuditService;
use Illuminate\Http\Request;

class AdminSecurityController extends Controller
{
    public function index(Request $request)
    {
        $query = SecurityLog::with('user')->latest();

        if ($event = $request->input('event')) {
            $query->where('event', $event);
        }

        if ($severity = $request->input('severity')) {
            $query->where('severity', $severity);
        }

        if ($resolved = $request->input('resolved')) {
            $query->where('is_resolved', $resolved === 'yes');
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('phone', 'like', "%{$search}%")
                  ->orWhere('ip_address', 'like', "%{$search}%")
                  ->orWhereHas('user', fn($u) => $u->where('name', 'like', "%{$search}%"));
            });
        }

        if ($from = $request->input('date_from')) {
            $query->whereDate('created_at', '>=', $from);
        }
        if ($to = $request->input('date_to')) {
            $query->whereDate('created_at', '<=', $to);
        }

        $logs = $query->paginate(30)->withQueryString();

        $events     = SecurityLog::select('event')->distinct()->orderBy('event')->pluck('event');
        $severities = ['info', 'warning', 'critical'];

        // Stats
        $stats = [
            'total_today'    => SecurityLog::whereDate('created_at', today())->count(),
            'critical_today' => SecurityLog::whereDate('created_at', today())->where('severity', 'critical')->count(),
            'unresolved'     => SecurityLog::where('is_resolved', false)->where('severity', '!=', 'info')->count(),
            'failed_logins'  => SecurityLog::where('event', 'login_failed')->whereDate('created_at', today())->count(),
        ];

        return view('admin.security-logs', compact('logs', 'events', 'severities', 'stats'));
    }

    public function resolve(Request $request, SecurityLog $log)
    {
        $request->validate(['note' => 'required|string|max:500']);

        $log->update([
            'is_resolved'     => true,
            'resolution_note' => $request->note,
            'resolved_at'     => now(),
            'resolved_by'     => auth()->id(),
        ]);

        AuditService::log('security.resolve', "Resolved security event #{$log->id}: {$log->event}", 'security_log', $log->id);

        return back()->with('success', 'Security event marked as resolved.');
    }
}
