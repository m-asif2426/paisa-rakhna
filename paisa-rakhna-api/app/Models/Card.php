<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Card extends Model
{
    protected $fillable = [
        'user_id', 'label', 'card_number_masked', 'expiry', 'network',
        'balance', 'spending_limit', 'color1', 'color2',
        'is_frozen', 'online_payments', 'international',
        'atm_withdrawals', 'nfc_tap_pay', 'status',
    ];

    protected function casts(): array
    {
        return [
            'balance'         => 'decimal:2',
            'spending_limit'  => 'decimal:2',
            'is_frozen'       => 'boolean',
            'online_payments' => 'boolean',
            'international'   => 'boolean',
            'atm_withdrawals' => 'boolean',
            'nfc_tap_pay'     => 'boolean',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
