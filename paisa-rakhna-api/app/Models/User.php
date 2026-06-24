<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name', 'email', 'password',
        'phone', 'cnic', 'kyc_status', 'is_active', 'is_admin', 'phone_verified_at',
        'failed_login_attempts', 'login_locked_until', 'fcm_token',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at'      => 'datetime',
            'phone_verified_at'      => 'datetime',
            'login_locked_until'     => 'datetime',
            'password'               => 'hashed',
            'is_active'              => 'boolean',
            'is_admin'               => 'boolean',
            'failed_login_attempts'  => 'integer',
        ];
    }

    public function wallet()
    {
        return $this->hasOne(Wallet::class);
    }

    public function cards()
    {
        return $this->hasMany(Card::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function mpin()
    {
        return $this->hasOne(Mpin::class);
    }
}
