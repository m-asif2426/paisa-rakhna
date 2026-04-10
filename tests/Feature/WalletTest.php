<?php

namespace Tests\Feature;

use Tests\TestCase;

class WalletTest extends TestCase
{
    // ────────────────────────────────────────────────────────────────────────
    // GET /wallet
    // ────────────────────────────────────────────────────────────────────────

    public function test_authenticated_user_can_fetch_wallet(): void
    {
        $user = $this->makeUser();

        $this->getJson('/api/wallet', $this->authHeader($user))
             ->assertOk()
             ->assertJsonPath('success', true)
             ->assertJsonStructure(['wallet' => [
                 'balance', 'account_number', 'currency', 'status',
             ]]);
    }

    public function test_wallet_balance_is_correct(): void
    {
        $user = $this->makeUser();

        $response = $this->getJson('/api/wallet', $this->authHeader($user));

        $response->assertOk();
        $this->assertEquals(10000.00, $response->json('wallet.balance'));
        $this->assertEquals('PKR',    $response->json('wallet.currency'));
        $this->assertEquals('active', $response->json('wallet.status'));
    }

    public function test_wallet_requires_authentication(): void
    {
        $this->getJson('/api/wallet')->assertUnauthorized();
    }

    // ────────────────────────────────────────────────────────────────────────
    // POST /wallet/topup
    // ────────────────────────────────────────────────────────────────────────

    public function test_topup_increases_balance_and_creates_transaction(): void
    {
        $user = $this->makeUser();

        $response = $this->postJson('/api/wallet/topup', ['amount' => 5000], $this->authHeader($user));

        $response->assertOk()
                 ->assertJsonPath('success', true)
                 ->assertJsonStructure(['balance', 'slip']);

        // Balance should now be 10000 + 5000 = 15000
        $this->assertEquals(15000.00, $response->json('balance'));

        $this->assertDatabaseHas('transactions', [
            'type'   => 'add_money',
            'amount' => 5000,
            'status' => 'completed',
        ]);
    }

    public function test_topup_returns_slip_with_correct_fields(): void
    {
        $user = $this->makeUser();

        $response = $this->postJson('/api/wallet/topup', ['amount' => 1000], $this->authHeader($user));

        $slip = $response->json('slip');

        $this->assertNotNull($slip);
        $this->assertEquals('topup',     $slip['type']);
        $this->assertEquals(1000,        $slip['amount']);
        $this->assertEquals('completed', $slip['status']);
        $this->assertEquals('PKR',       $slip['currency']);
        $this->assertEquals(0,           $slip['fee']);
    }

    public function test_topup_minimum_amount_is_100(): void
    {
        $user = $this->makeUser();

        $this->postJson('/api/wallet/topup', ['amount' => 50], $this->authHeader($user))
             ->assertUnprocessable();
    }

    public function test_topup_maximum_amount_is_100000(): void
    {
        $user = $this->makeUser();

        $this->postJson('/api/wallet/topup', ['amount' => 200000], $this->authHeader($user))
             ->assertUnprocessable();
    }

    public function test_topup_requires_authentication(): void
    {
        $this->postJson('/api/wallet/topup', ['amount' => 1000])->assertUnauthorized();
    }
}
