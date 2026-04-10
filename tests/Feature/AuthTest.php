<?php

namespace Tests\Feature;

use App\Models\Otp;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    // ────────────────────────────────────────────────────────────────────────
    // OTP: Send
    // ────────────────────────────────────────────────────────────────────────

    public function test_send_otp_returns_success_and_exposes_code_in_local_env(): void
    {
        $response = $this->postJson('/api/auth/otp/send', [
            'phone'   => '03001234567',
            'channel' => 'sms',
        ]);

        $response->assertOk()
                 ->assertJsonPath('success', true)
                 ->assertJsonStructure(['otp']); // exposed because APP_ENV=testing (local-like)

        $this->assertDatabaseHas('otps', [
            'phone'   => '03001234567',
            'purpose' => 'register',
            'used'    => false,
        ]);
    }

    public function test_send_otp_via_email_channel(): void
    {
        $response = $this->postJson('/api/auth/otp/send', [
            'phone'   => '03001234567',
            'channel' => 'email',
            'email'   => 'test@example.com',
        ]);

        $response->assertOk()->assertJsonPath('success', true);

        $this->assertDatabaseHas('otps', [
            'email'   => 'test@example.com',
            'channel' => 'email',
            'purpose' => 'register',
        ]);
    }

    public function test_send_otp_invalidates_previous_otp(): void
    {
        // Create an existing unused OTP
        Otp::create([
            'phone'      => '03001234567',
            'code'       => '111111',
            'purpose'    => 'register',
            'used'       => false,
            'expires_at' => now()->addMinutes(5),
        ]);

        $this->postJson('/api/auth/otp/send', ['phone' => '03001234567', 'channel' => 'sms']);

        // Old OTP must now be marked used
        $this->assertDatabaseHas('otps', [
            'phone' => '03001234567',
            'code'  => '111111',
            'used'  => true,
        ]);
    }

    public function test_send_otp_requires_phone(): void
    {
        $this->postJson('/api/auth/otp/send', [])->assertUnprocessable();
    }

    // ────────────────────────────────────────────────────────────────────────
    // OTP: Verify
    // ────────────────────────────────────────────────────────────────────────

    public function test_verify_otp_succeeds_with_valid_code(): void
    {
        Otp::create([
            'phone'      => '03001234567',
            'code'       => '123456',
            'purpose'    => 'register',
            'used'       => false,
            'expires_at' => now()->addMinutes(5),
        ]);

        $response = $this->postJson('/api/auth/otp/verify', [
            'phone'   => '03001234567',
            'code'    => '123456',
            'purpose' => 'register',
        ]);

        $response->assertOk()->assertJsonPath('success', true);
        $this->assertDatabaseHas('otps', ['code' => '123456', 'used' => true]);
    }

    public function test_verify_otp_fails_with_wrong_code(): void
    {
        Otp::create([
            'phone'      => '03001234567',
            'code'       => '123456',
            'purpose'    => 'register',
            'used'       => false,
            'expires_at' => now()->addMinutes(5),
        ]);

        $this->postJson('/api/auth/otp/verify', [
            'phone'   => '03001234567',
            'code'    => '000000',
            'purpose' => 'register',
        ])->assertStatus(422)->assertJsonPath('success', false);
    }

    public function test_verify_otp_fails_when_expired(): void
    {
        Otp::create([
            'phone'      => '03001234567',
            'code'       => '123456',
            'purpose'    => 'register',
            'used'       => false,
            'expires_at' => now()->subMinute(), // already expired
        ]);

        $this->postJson('/api/auth/otp/verify', [
            'phone'   => '03001234567',
            'code'    => '123456',
            'purpose' => 'register',
        ])->assertStatus(422);
    }

    public function test_verify_otp_fails_when_already_used(): void
    {
        Otp::create([
            'phone'      => '03001234567',
            'code'       => '123456',
            'purpose'    => 'register',
            'used'       => true,
            'expires_at' => now()->addMinutes(5),
        ]);

        $this->postJson('/api/auth/otp/verify', [
            'phone'   => '03001234567',
            'code'    => '123456',
            'purpose' => 'register',
        ])->assertStatus(422);
    }

    // ────────────────────────────────────────────────────────────────────────
    // Register
    // ────────────────────────────────────────────────────────────────────────

    public function test_register_creates_user_with_wallet_and_card(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name'  => 'Ali Khan',
            'phone' => '03001234567',
            'pin'   => '1234',
        ]);

        $response->assertCreated()
                 ->assertJsonPath('success', true)
                 ->assertJsonStructure(['token', 'user' => ['id', 'name', 'wallet']]);

        $this->assertDatabaseHas('users',   ['phone' => '03001234567']);
        $this->assertDatabaseHas('wallets', ['currency' => 'PKR']);
        $this->assertDatabaseHas('cards',   ['label' => 'Silver Card']);
    }

    public function test_register_fails_with_duplicate_phone(): void
    {
        $this->makeUser(['phone' => '03001234567']);

        $this->postJson('/api/auth/register', [
            'name'  => 'Ali Khan',
            'phone' => '03001234567',
            'pin'   => '1234',
        ])->assertUnprocessable();
    }

    public function test_register_requires_4_digit_pin(): void
    {
        $this->postJson('/api/auth/register', [
            'name'  => 'Ali Khan',
            'phone' => '03001234567',
            'pin'   => '12',   // too short
        ])->assertUnprocessable();
    }

    // ────────────────────────────────────────────────────────────────────────
    // Login
    // ────────────────────────────────────────────────────────────────────────

    public function test_login_returns_token_with_valid_credentials(): void
    {
        $this->makeUser(['phone' => '03001234567']);

        $response = $this->postJson('/api/auth/login', [
            'phone' => '03001234567',
            'pin'   => '1234',
        ]);

        $response->assertOk()
                 ->assertJsonPath('success', true)
                 ->assertJsonStructure(['token', 'user']);
    }

    public function test_login_fails_with_wrong_pin(): void
    {
        $this->makeUser(['phone' => '03001234567']);

        $this->postJson('/api/auth/login', [
            'phone' => '03001234567',
            'pin'   => '0000',
        ])->assertStatus(401)->assertJsonPath('success', false);
    }

    public function test_login_fails_for_nonexistent_phone(): void
    {
        $this->postJson('/api/auth/login', [
            'phone' => '03009999999',
            'pin'   => '1234',
        ])->assertStatus(401);
    }

    public function test_login_fails_for_inactive_user(): void
    {
        $this->makeUser(['phone' => '03001234567', 'is_active' => false]);

        $this->postJson('/api/auth/login', [
            'phone' => '03001234567',
            'pin'   => '1234',
        ])->assertStatus(403);
    }

    public function test_login_lockout_after_five_failed_attempts(): void
    {
        // Bypass rate-limiter middleware so we test app-level lockout, not throttle (429)
        $this->withoutMiddleware(\Illuminate\Routing\Middleware\ThrottleRequests::class);

        $this->makeUser(['phone' => '03001234567']);

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/login', ['phone' => '03001234567', 'pin' => '0000']);
        }

        // 6th attempt — account should now be locked at the application level (423)
        $response = $this->postJson('/api/auth/login', ['phone' => '03001234567', 'pin' => '1234']);
        $response->assertStatus(423);
    }

    // ────────────────────────────────────────────────────────────────────────
    // Me / Logout
    // ────────────────────────────────────────────────────────────────────────

    public function test_me_endpoint_returns_authenticated_user(): void
    {
        $user = $this->makeUser();

        $this->getJson('/api/auth/me', $this->authHeader($user))
             ->assertOk()
             ->assertJsonPath('success', true)
             ->assertJsonPath('user.phone', $user->phone);
    }

    public function test_me_endpoint_requires_auth(): void
    {
        $this->getJson('/api/auth/me')->assertUnauthorized();
    }

    public function test_logout_deletes_access_token(): void
    {
        $user  = $this->makeUser();
        $token = $user->createToken('test');
        $headers = ['Authorization' => "Bearer {$token->plainTextToken}"];

        $this->postJson('/api/auth/logout', [], $headers)->assertOk();

        // Token record must be removed from the database
        $this->assertDatabaseMissing('personal_access_tokens', [
            'id' => $token->accessToken->id,
        ]);
    }
}
