<?php

namespace Tests\Feature;

use App\Models\Mpin;
use App\Models\Otp;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class MpinTest extends TestCase
{
    // ────────────────────────────────────────────────────────────────────────
    // GET /mpin/status
    // ────────────────────────────────────────────────────────────────────────

    public function test_status_shows_mpin_is_set(): void
    {
        $user = $this->makeUser(); // makeUser already sets M-PIN

        $this->getJson('/api/mpin/status', $this->authHeader($user))
             ->assertOk()
             ->assertJsonPath('success', true)
             ->assertJsonPath('is_set', true)
             ->assertJsonPath('is_locked', false);
    }

    public function test_status_shows_mpin_not_set_for_new_user(): void
    {
        $user = $this->makeUser();
        // Remove M-PIN
        $user->mpin()->delete();

        $this->getJson('/api/mpin/status', $this->authHeader($user))
             ->assertOk()
             ->assertJsonPath('is_set', false);
    }

    public function test_status_requires_authentication(): void
    {
        $this->getJson('/api/mpin/status')->assertUnauthorized();
    }

    // ────────────────────────────────────────────────────────────────────────
    // POST /mpin/set
    // ────────────────────────────────────────────────────────────────────────

    public function test_set_mpin_creates_or_updates_record(): void
    {
        $user = $this->makeUser();

        $this->postJson('/api/mpin/set', ['pin' => '5678'], $this->authHeader($user))
             ->assertOk()
             ->assertJsonPath('success', true);

        $mpin = $user->mpin()->first();
        $this->assertNotNull($mpin);
        $this->assertTrue($mpin->is_set);
        $this->assertTrue(Hash::check('5678', $mpin->pin_hash));
    }

    public function test_set_mpin_requires_4_digits(): void
    {
        $user = $this->makeUser();

        $this->postJson('/api/mpin/set', ['pin' => '12'], $this->authHeader($user))
             ->assertUnprocessable();
    }

    public function test_set_mpin_requires_authentication(): void
    {
        $this->postJson('/api/mpin/set', ['pin' => '1234'])->assertUnauthorized();
    }

    // ────────────────────────────────────────────────────────────────────────
    // POST /mpin/verify
    // ────────────────────────────────────────────────────────────────────────

    public function test_verify_mpin_succeeds_with_correct_pin(): void
    {
        $user = $this->makeUser(); // M-PIN = '1234'

        $this->postJson('/api/mpin/verify', ['pin' => '1234'], $this->authHeader($user))
             ->assertOk()
             ->assertJsonPath('success', true);
    }

    public function test_verify_mpin_fails_with_wrong_pin(): void
    {
        $user = $this->makeUser();

        $this->postJson('/api/mpin/verify', ['pin' => '0000'], $this->authHeader($user))
             ->assertStatus(401)
             ->assertJsonPath('success', false);
    }

    public function test_verify_mpin_increments_failed_attempts(): void
    {
        $user = $this->makeUser();

        $this->postJson('/api/mpin/verify', ['pin' => '0000'], $this->authHeader($user));

        $this->assertEquals(1, $user->mpin()->first()->failed_attempts);
    }

    public function test_verify_mpin_locks_after_five_failures(): void
    {
        $user = $this->makeUser();

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/mpin/verify', ['pin' => '0000'], $this->authHeader($user));
        }

        $this->postJson('/api/mpin/verify', ['pin' => '1234'], $this->authHeader($user))
             ->assertStatus(423); // Locked
    }

    public function test_verify_mpin_resets_failed_attempts_on_success(): void
    {
        $user = $this->makeUser();

        // 2 wrong attempts
        $this->postJson('/api/mpin/verify', ['pin' => '0000'], $this->authHeader($user));
        $this->postJson('/api/mpin/verify', ['pin' => '0000'], $this->authHeader($user));

        // correct attempt
        $this->postJson('/api/mpin/verify', ['pin' => '1234'], $this->authHeader($user));

        $this->assertEquals(0, $user->mpin()->first()->failed_attempts);
    }

    public function test_verify_mpin_fails_when_not_set(): void
    {
        $user = $this->makeUser();
        $user->mpin()->delete();

        $this->postJson('/api/mpin/verify', ['pin' => '1234'], $this->authHeader($user))
             ->assertStatus(422);
    }

    // ────────────────────────────────────────────────────────────────────────
    // POST /mpin/reset
    // ────────────────────────────────────────────────────────────────────────

    public function test_reset_mpin_with_valid_otp(): void
    {
        $user = $this->makeUser();

        // Create a valid OTP for reset_mpin
        Otp::create([
            'phone'      => $user->phone,
            'code'       => '123456',
            'purpose'    => 'reset_mpin',
            'used'       => false,
            'expires_at' => now()->addMinutes(5),
        ]);

        $this->postJson('/api/mpin/reset', [
            'otp'     => '123456',
            'new_pin' => '5678',
        ], $this->authHeader($user))
             ->assertOk()
             ->assertJsonPath('success', true);

        $mpin = $user->mpin()->first();
        $this->assertTrue(Hash::check('5678', $mpin->pin_hash));
    }

    public function test_reset_mpin_fails_with_wrong_otp(): void
    {
        $user = $this->makeUser();

        Otp::create([
            'phone'      => $user->phone,
            'code'       => '123456',
            'purpose'    => 'reset_mpin',
            'used'       => false,
            'expires_at' => now()->addMinutes(5),
        ]);

        $this->postJson('/api/mpin/reset', [
            'otp'     => '000000',
            'new_pin' => '5678',
        ], $this->authHeader($user))->assertStatus(422);
    }

    public function test_reset_mpin_marks_otp_as_used(): void
    {
        $user = $this->makeUser();

        Otp::create([
            'phone'      => $user->phone,
            'code'       => '123456',
            'purpose'    => 'reset_mpin',
            'used'       => false,
            'expires_at' => now()->addMinutes(5),
        ]);

        $this->postJson('/api/mpin/reset', [
            'otp'     => '123456',
            'new_pin' => '5678',
        ], $this->authHeader($user));

        $this->assertDatabaseHas('otps', ['code' => '123456', 'used' => true]);
    }

    // ────────────────────────────────────────────────────────────────────────
    // POST /mpin/otp  (request OTP for reset — authenticated route)
    // ────────────────────────────────────────────────────────────────────────

    public function test_mpin_otp_request_creates_otp_for_authenticated_user(): void
    {
        $user = $this->makeUser();

        $this->postJson('/api/mpin/otp', ['purpose' => 'reset_mpin'], $this->authHeader($user))
             ->assertOk()
             ->assertJsonPath('success', true);

        $this->assertDatabaseHas('otps', [
            'phone'   => $user->phone,
            'purpose' => 'reset_mpin',
            'used'    => false,
        ]);
    }

    public function test_mpin_otp_request_requires_authentication(): void
    {
        $this->postJson('/api/mpin/otp', ['purpose' => 'reset_mpin'])->assertUnauthorized();
    }
}
