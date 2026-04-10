<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Mpin extends Model
{
    protected $fillable = ['user_id', 'pin_hash', 'is_set', 'failed_attempts', 'locked_until'];

    protected $hidden = ['pin_hash'];

    protected function casts(): array
    {
        return [
            'is_set'       => 'boolean',
            'locked_until' => 'datetime',
        ];
    }

    public function isLocked(): bool
    {
        return $this->locked_until && $this->locked_until->isFuture();
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
