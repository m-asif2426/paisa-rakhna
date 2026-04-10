<?php

namespace Tests\Unit;

use App\Models\Mpin;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class MpinModelTest extends TestCase
{
    protected function makeMpin(array $overrides = []): Mpin
    {
        $user = User::create([
            'name'     => 'Test',
            'phone'    => '030012345' . rand(10, 99),
            'password' => Hash::make('1234'),
            'is_active'=> true,
        ]);

        return Mpin::create(array_merge([
            'user_id'         => $user->id,
            'pin_hash'        => Hash::make('1234'),
            'is_set'          => true,
            'failed_attempts' => 0,
            'locked_until'    => null,
        ], $overrides));
    }

    public function test_is_locked_returns_false_when_locked_until_is_null(): void
    {
        $mpin = $this->makeMpin(['locked_until' => null]);
        $this->assertFalse($mpin->isLocked());
    }

    public function test_is_locked_returns_false_when_locked_until_is_in_the_past(): void
    {
        $mpin = $this->makeMpin(['locked_until' => Carbon::now()->subMinutes(5)]);
        $this->assertFalse($mpin->isLocked());
    }

    public function test_is_locked_returns_true_when_locked_until_is_in_the_future(): void
    {
        $mpin = $this->makeMpin(['locked_until' => Carbon::now()->addMinutes(30)]);
        $this->assertTrue($mpin->isLocked());
    }

    public function test_pin_hash_is_hidden_from_serialization(): void
    {
        $mpin = $this->makeMpin();
        $arr  = $mpin->toArray();
        $this->assertArrayNotHasKey('pin_hash', $arr);
    }

    public function test_is_set_casts_to_boolean(): void
    {
        $mpin = $this->makeMpin(['is_set' => true]);
        $this->assertIsBool($mpin->is_set);
        $this->assertTrue($mpin->is_set);
    }

    public function test_locked_until_casts_to_datetime(): void
    {
        $mpin = $this->makeMpin(['locked_until' => Carbon::now()->addMinutes(10)]);
        $this->assertInstanceOf(Carbon::class, $mpin->locked_until);
    }
}
