<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AdminAuditController extends Controller
{
    public function index(Request $request)
    {
        $query = AuditLog::with('user')->latest();

        if ($action = $request->input('action')) {
            $query->where('action', 'like', "%{$action}%");
        }

        if ($severity = $request->input('severity')) {
            $query->where('severity', $severity);
        }

        if ($role = $request->input('role')) {
            $query->where('actor_role', $role);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('actor_name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('action', 'like', "%{$search}%")
                  ->orWhere('ip_address', 'like', "%{$search}%");
            });
        }

        if ($from = $request->input('date_from')) {
            $query->whereDate('created_at', '>=', $from);
        }
        if ($to = $request->input('date_to')) {
            $query->whereDate('created_at', '<=', $to);
        }

        $logs = $query->paginate(30)->withQueryString();

        $actions    = AuditLog::select('action')->distinct()->orderBy('action')->pluck('action');
        $severities = ['info', 'warning', 'critical'];

        return view('admin.audit-logs', compact('logs', 'actions', 'severities'));
    }
}
