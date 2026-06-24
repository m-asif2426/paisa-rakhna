<?php

namespace Tests\Feature;

use Tests\TestCase;

class TransactionTest extends TestCase
{
    // ────────────────────────────────────────────────────────────────────────
    // GET /transactions
    // ────────────────────────────────────────────────────────────────────────

    public function test_authenticated_user_can_list_transactions(): void
    {
        $user = $this->makeUser();

        $this->getJson('/api/transactions', $this->authHeader($user))
             ->assertOk()
             ->assertJsonPath('success', true)
             ->assertJsonStructure(['data']);
    }

    public function test_transactions_list_requires_authentication(): void
    {
        $this->getJson('/api/transactions')->assertUnauthorized();
    }

    public function test_transactions_list_is_paginated(): void
    {
        $user = $this->makeUser();

        $response = $this->getJson('/api/transactions', $this->authHeader($user));

        // Laravel paginator keys
        $response->assertOk()->assertJsonStructure(['data' => ['data', 'total', 'per_page']]);
    }

    // ────────────────────────────────────────────────────────────────────────
    // POST /transactions/send
    // ────────────────────────────────────────────────────────────────────────

    public function test_send_money_transfers_balance_between_users(): void
    {
        $sender    = $this->makeUser(['phone' => '03001111111']);
        $recipient = $this->makeUser(['phone' => '03002222222']);

        $response = $this->postJson('/api/transactions/send', [
            'recipient_phone' => '03002222222',
            'amount'          => 2000,
        ], $this->authHeader($sender));

        $response->assertOk()->assertJsonPath('success', true);

        // Sender balance: 10000 - 2000 = 8000
        $this->assertEquals(8000.00, (float) $sender->wallet->fresh()->balance);
        // Recipient balance: 10000 + 2000 = 12000
        $this->assertEquals(12000.00, (float) $recipient->wallet->fresh()->balance);
    }

    public function test_send_creates_two_transaction_records(): void
    {
        $sender    = $this->makeUser(['phone' => '03001111111']);
        $recipient = $this->makeUser(['phone' => '03002222222']);

        $this->postJson('/api/transactions/send', [
            'recipient_phone' => '03002222222',
            'amount'          => 500,
        ], $this->authHeader($sender));

        $this->assertDatabaseHas('transactions', [
            'user_id' => $sender->id,
            'type'    => 'send',
            'amount'  => 500,
            'status'  => 'completed',
        ]);
        $this->assertDatabaseHas('transactions', [
            'user_id' => $recipient->id,
            'type'    => 'receive',
            'amount'  => 500,
            'status'  => 'completed',
        ]);
    }

    public function test_send_returns_slip(): void
    {
        $sender    = $this->makeUser(['phone' => '03001111111']);
        $this->makeUser(['phone' => '03002222222']);

        $response = $this->postJson('/api/transactions/send', [
            'recipient_phone' => '03002222222',
            'amount'          => 300,
        ], $this->authHeader($sender));

        $response->assertOk()
                 ->assertJsonStructure(['slip' => ['reference', 'type', 'amount', 'fee']]);
    }

    public function test_send_fails_on_insufficient_balance(): void
    {
        $sender    = $this->makeUser(['phone' => '03001111111']); // balance 10000
        $this->makeUser(['phone' => '03002222222']);

        $this->postJson('/api/transactions/send', [
            'recipient_phone' => '03002222222',
            'amount'          => 99999, // more than balance
        ], $this->authHeader($sender))
             ->assertStatus(422)
             ->assertJsonPath('success', false);
    }

    public function test_send_fails_for_nonexistent_recipient(): void
    {
        $sender = $this->makeUser(['phone' => '03001111111']);

        $this->postJson('/api/transactions/send', [
            'recipient_phone' => '03009999999', // nobody registered
            'amount'          => 100,
        ], $this->authHeader($sender))
             ->assertStatus(404);
    }

    public function test_send_fails_when_sending_to_self(): void
    {
        $user = $this->makeUser(['phone' => '03001111111']);

        $this->postJson('/api/transactions/send', [
            'recipient_phone' => '03001111111',
            'amount'          => 100,
        ], $this->authHeader($user))
             ->assertStatus(422);
    }

    public function test_send_fails_for_inactive_recipient(): void
    {
        $sender    = $this->makeUser(['phone' => '03001111111']);
        $this->makeUser(['phone' => '03002222222', 'is_active' => false]);

        $this->postJson('/api/transactions/send', [
            'recipient_phone' => '03002222222',
            'amount'          => 100,
        ], $this->authHeader($sender))
             ->assertStatus(422);
    }

    public function test_send_requires_authentication(): void
    {
        $this->postJson('/api/transactions/send', [
            'recipient_phone' => '03001234567',
            'amount'          => 100,
        ])->assertUnauthorized();
    }

    public function test_send_requires_positive_amount(): void
    {
        $sender = $this->makeUser(['phone' => '03001111111']);
        $this->makeUser(['phone' => '03002222222']);

        $this->postJson('/api/transactions/send', [
            'recipient_phone' => '03002222222',
            'amount'          => 0,
        ], $this->authHeader($sender))->assertUnprocessable();
    }
}
