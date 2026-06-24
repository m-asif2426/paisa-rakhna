<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Otp extends Model
{
    protected $fillable = ['phone', 'email', 'channel', 'code', 'purpose', 'used', 'expires_at'];

    protected function casts(): array
    {
        return [
            'used'       => 'boolean',
            'expires_at' => 'datetime',
        ];
    }

    public function isValid(): bool
    {
        return !$this->used && $this->expires_at->isFuture();
    }
}
