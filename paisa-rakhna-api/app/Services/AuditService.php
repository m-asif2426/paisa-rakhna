<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\SecurityLog;
use App\Models\AdminNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuditService
{
    /**
     * Log an action in the audit trail.
     */
    public static function log(
        string $action,
        ?string $description = null,
        ?string $entityType = null,
        ?int $entityId = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        string $severity = 'info',
    ): AuditLog {
        $user = Auth::user();
        $request = request();

        return AuditLog::create([
            'user_id'     => $user?->id,
            'actor_name'  => $user?->name ?? 'System',
            'actor_role'  => $user?->is_admin ? 'admin' : 'user',
            'action'      => $action,
            'entity_type' => $entityType,
            'entity_id'   => $entityId,
            'old_values'  => $oldValues,
            'new_values'  => $newValues,
            'ip_address'  => $request?->ip(),
            'user_agent'  => $request?->userAgent(),
            'description' => $description,
            'severity'    => $severity,
        ]);
    }

    /**
     * Log a security event.
     */
    public static function security(
        string $event,
        ?int $userId = null,
        ?string $phone = null,
        string $severity = 'info',
        ?array $metadata = null,
    ): SecurityLog {
        $request = request();

        return SecurityLog::create([
            'user_id'    => $userId ?? Auth::id(),
            'event'      => $event,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
            'phone'      => $phone,
            'severity'   => $severity,
            'metadata'   => $metadata,
        ]);
    }

    /**
     * Send an admin notification.
     */
    public static function notify(
        string $type,
        string $title,
        string $message,
        string $severity = 'info',
        ?string $entityType = null,
        ?int $entityId = null,
    ): AdminNotification {
        return AdminNotification::notify($type, $title, $message, $severity, $entityType, $entityId);
    }
}
