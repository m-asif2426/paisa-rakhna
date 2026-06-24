<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SecurityLog extends Model
{
    protected $fillable = [
        'user_id', 'event', 'ip_address', 'user_agent', 'phone',
        'severity', 'metadata', 'is_resolved', 'resolution_note',
        'resolved_at', 'resolved_by',
    ];

    protected $casts = [
        'metadata'    => 'array',
        'is_resolved' => 'boolean',
        'resolved_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function resolver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }
}
