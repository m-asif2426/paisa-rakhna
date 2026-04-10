<?php

namespace Tests\Unit;

use App\Models\Otp;
use Carbon\Carbon;
use Tests\TestCase;

class OtpModelTest extends TestCase
{
    protected function makeOtp(array $overrides = []): Otp
    {
        return Otp::create(array_merge([
            'phone'      => '03001234567',
            'code'       => '123456',
            'purpose'    => 'register',
            'used'       => false,
            'expires_at' => Carbon::now()->addMinutes(5),
        ], $overrides));
    }

    public function test_is_valid_returns_true_for_unused_non_expired_otp(): void
    {
        $otp = $this->makeOtp();
        $this->assertTrue($otp->isValid());
    }

    public function test_is_valid_returns_false_when_used(): void
    {
        $otp = $this->makeOtp(['used' => true]);
        $this->assertFalse($otp->isValid());
    }

    public function test_is_valid_returns_false_when_expired(): void
    {
        $otp = $this->makeOtp(['expires_at' => Carbon::now()->subMinute()]);
        $this->assertFalse($otp->isValid());
    }

    public function test_otp_used_casts_to_boolean(): void
    {
        $otp = $this->makeOtp(['used' => false]);
        $this->assertIsBool($otp->used);
    }

    public function test_otp_expires_at_casts_to_carbon(): void
    {
        $otp = $this->makeOtp();
        $this->assertInstanceOf(Carbon::class, $otp->expires_at);
    }

    public function test_otp_can_use_email_channel(): void
    {
        $otp = Otp::create([
            'phone'      => '03001234567',
            'email'      => 'user@example.com',
            'channel'    => 'email',
            'code'       => '654321',
            'purpose'    => 'register',
            'used'       => false,
            'expires_at' => Carbon::now()->addMinutes(5),
        ]);

        $this->assertDatabaseHas('otps', [
            'email'   => 'user@example.com',
            'channel' => 'email',
        ]);
        $this->assertTrue($otp->isValid());
    }
}
