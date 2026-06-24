<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminNotification;
use Illuminate\Http\Request;

class AdminNotificationController extends Controller
{
    public function index(Request $request)
    {
        $query = AdminNotification::latest();

        if ($type = $request->input('type')) {
            $query->where('type', $type);
        }

        if ($severity = $request->input('severity')) {
            $query->where('severity', $severity);
        }

        if ($read = $request->input('read')) {
            $query->where('is_read', $read === 'yes');
        }

        $notifications = $query->paginate(30)->withQueryString();
        $unreadCount   = AdminNotification::where('is_read', false)->count();
        $types         = AdminNotification::select('type')->distinct()->orderBy('type')->pluck('type');

        return view('admin.notifications', compact('notifications', 'unreadCount', 'types'));
    }

    public function markRead(AdminNotification $notification)
    {
        $notification->update([
            'is_read' => true,
            'read_at' => now(),
            'read_by' => auth()->id(),
        ]);

        return back()->with('success', 'Notification marked as read.');
    }

    public function markAllRead()
    {
        AdminNotification::where('is_read', false)->update([
            'is_read' => true,
            'read_at' => now(),
            'read_by' => auth()->id(),
        ]);

        return back()->with('success', 'All notifications marked as read.');
    }
}
