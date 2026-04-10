<?php

namespace Tests;

use App\Models\Card;
use App\Models\Mpin;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Hash;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    /**
     * Create a regular user with a wallet, mpin and a card.
     * Optionally pass attribute overrides for the User row.
     */
    protected function makeUser(array $overrides = []): User
    {
        $attrs = array_merge([
            'name'              => 'Test User',
            'phone'             => '03001234567',
            'password'          => Hash::make('1234'),
            'phone_verified_at' => now(),
            'kyc_status'        => 'pending',
            'is_active'         => true,
            'is_admin'          => false,
        ], $overrides);

        $user = User::create($attrs);

        Wallet::create([
            'user_id'        => $user->id,
            'balance'        => 10000.00,
            'currency'       => 'PKR',
            'account_number' => 'PR-' . str_pad($user->id, 10, '0', STR_PAD_LEFT),
            'status'         => 'active',
        ]);

        Mpin::create([
            'user_id'  => $user->id,
            'pin_hash' => Hash::make('1234'),
            'is_set'   => true,
        ]);

        $last4 = str_pad((string) ($user->id * 7 % 10000), 4, '0', STR_PAD_LEFT);
        Card::create([
            'user_id'            => $user->id,
            'label'              => 'Silver Card',
            'card_number_masked' => "**** **** **** {$last4}",
            'expiry'             => now()->addYears(4)->format('m/y'),
            'network'            => 'Visa',
            'balance'            => 0.00,
            'spending_limit'     => 50000,
            'color1'             => '#1a1a2e',
            'color2'             => '#16213e',
            'is_frozen'          => false,
            'online_payments'    => true,
            'international'      => false,
            'atm_withdrawals'    => true,
            'nfc_tap_pay'        => false,
            'status'             => 'active',
        ]);

        return $user->fresh();
    }

    /**
     * Create an admin user (no wallet/card needed for web panel tests).
     */
    protected function makeAdmin(array $overrides = []): User
    {
        $attrs = array_merge([
            'name'     => 'Admin User',
            'email'    => 'admin@paisarakhna.pk',
            'phone'    => '03009999999',
            'password' => Hash::make('admin1234'),
            'is_admin' => true,
            'is_active'=> true,
        ], $overrides);

        return User::create($attrs);
    }

    /**
     * Return an Authorization header array for Sanctum API calls.
     */
    protected function authHeader(User $user): array
    {
        $token = $user->createToken('test')->plainTextToken;
        return ['Authorization' => "Bearer {$token}"];
    }
}
