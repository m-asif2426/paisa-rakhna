<?php

namespace Tests\Feature;

use App\Models\Card;
use Tests\TestCase;

class CardTest extends TestCase
{
    // ────────────────────────────────────────────────────────────────────────
    // GET /cards
    // ────────────────────────────────────────────────────────────────────────

    public function test_authenticated_user_can_list_their_cards(): void
    {
        $user = $this->makeUser(); // makeUser auto-creates a Silver Card

        $response = $this->getJson('/api/cards', $this->authHeader($user));

        $response->assertOk()
                 ->assertJsonPath('success', true)
                 ->assertJsonCount(1, 'cards');
    }

    public function test_cards_requires_authentication(): void
    {
        $this->getJson('/api/cards')->assertUnauthorized();
    }

    public function test_user_cannot_see_another_users_cards(): void
    {
        $user1 = $this->makeUser(['phone' => '03001111111']);
        $user2 = $this->makeUser(['phone' => '03002222222']);

        $response = $this->getJson('/api/cards', $this->authHeader($user1));

        // user1 only sees their own card (1 card), not user2's
        $response->assertOk()->assertJsonCount(1, 'cards');
    }

    // ────────────────────────────────────────────────────────────────────────
    // POST /cards/{card}/toggle
    // ────────────────────────────────────────────────────────────────────────

    public function test_freeze_card_updates_frozen_status(): void
    {
        $user = $this->makeUser();
        $card = $user->cards()->first();

        $response = $this->postJson("/api/cards/{$card->id}/toggle", [
            'field' => 'is_frozen',
        ], $this->authHeader($user));

        $response->assertOk()
                 ->assertJsonPath('success', true);

        $this->assertTrue((bool) $card->fresh()->is_frozen);
        $this->assertEquals('frozen', $card->fresh()->status);
    }

    public function test_unfreeze_card_restores_active_status(): void
    {
        $user = $this->makeUser();
        $card = $user->cards()->first();
        $card->update(['is_frozen' => true, 'status' => 'frozen']);

        $this->postJson("/api/cards/{$card->id}/toggle", [
            'field' => 'is_frozen',
        ], $this->authHeader($user));

        $this->assertFalse((bool) $card->fresh()->is_frozen);
        $this->assertEquals('active', $card->fresh()->status);
    }

    public function test_toggle_online_payments(): void
    {
        $user = $this->makeUser();
        $card = $user->cards()->first(); // online_payments = true

        $this->postJson("/api/cards/{$card->id}/toggle", [
            'field' => 'online_payments',
        ], $this->authHeader($user))->assertOk();

        $this->assertFalse((bool) $card->fresh()->online_payments);
    }

    public function test_toggle_atm_withdrawals(): void
    {
        $user = $this->makeUser();
        $card = $user->cards()->first(); // atm_withdrawals = true

        $this->postJson("/api/cards/{$card->id}/toggle", [
            'field' => 'atm_withdrawals',
        ], $this->authHeader($user))->assertOk();

        $this->assertFalse((bool) $card->fresh()->atm_withdrawals);
    }

    public function test_toggle_nfc_tap_pay(): void
    {
        $user = $this->makeUser();
        $card = $user->cards()->first(); // nfc_tap_pay = false

        $this->postJson("/api/cards/{$card->id}/toggle", [
            'field' => 'nfc_tap_pay',
        ], $this->authHeader($user))->assertOk();

        $this->assertTrue((bool) $card->fresh()->nfc_tap_pay);
    }

    public function test_toggle_rejects_invalid_field(): void
    {
        $user = $this->makeUser();
        $card = $user->cards()->first();

        $this->postJson("/api/cards/{$card->id}/toggle", [
            'field' => 'hacked_field',
        ], $this->authHeader($user))->assertUnprocessable();
    }

    public function test_user_cannot_toggle_another_users_card(): void
    {
        $user1 = $this->makeUser(['phone' => '03001111111']);
        $user2 = $this->makeUser(['phone' => '03002222222']);
        $card2 = $user2->cards()->first();

        $this->postJson("/api/cards/{$card2->id}/toggle", [
            'field' => 'is_frozen',
        ], $this->authHeader($user1))->assertForbidden();
    }

    public function test_toggle_requires_authentication(): void
    {
        $user = $this->makeUser();
        $card = $user->cards()->first();

        $this->postJson("/api/cards/{$card->id}/toggle", ['field' => 'is_frozen'])
             ->assertUnauthorized();
    }
}
