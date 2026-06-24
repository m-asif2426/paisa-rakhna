<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdminNotification extends Model
{
    protected $fillable = [
        'type', 'title', 'message', 'severity',
        'entity_type', 'entity_id',
        'is_read', 'read_at', 'read_by',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'read_at' => 'datetime',
    ];

    public function reader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'read_by');
    }

    /**
     * Create a notification for the admin panel.
     */
    public static function notify(string $type, string $title, string $message, string $severity = 'info', ?string $entityType = null, ?int $entityId = null): self
    {
        return static::create([
            'type'        => $type,
            'title'       => $title,
            'message'     => $message,
            'severity'    => $severity,
            'entity_type' => $entityType,
            'entity_id'   => $entityId,
        ]);
    }
}
