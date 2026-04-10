<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Mpin;
use App\Models\Otp;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class MpinController extends Controller
{
    // GET /mpin/status
    public function status(Request $request)
    {
        $mpin = $request->user()->mpin;
        return response()->json([
            'success'  => true,
            'is_set'   => $mpin?->is_set ?? false,
            'is_locked' => $mpin?->isLocked() ?? false,
        ]);
    }

    // POST /mpin/set
    public function set(Request $request)
    {
        $request->validate(['pin' => 'required|string|size:4']);

        $user = $request->user();

        Mpin::updateOrCreate(
            ['user_id' => $user->id],
            ['pin_hash' => Hash::make($request->pin), 'is_set' => true, 'failed_attempts' => 0, 'locked_until' => null]
        );

        return response()->json(['success' => true, 'message' => 'M-PIN set successfully']);
    }

    // POST /mpin/verify
    public function verify(Request $request)
    {
        $request->validate(['pin' => 'required|string|size:4']);

        $mpin = $request->user()->mpin;

        if (!$mpin || !$mpin->is_set) {
            return response()->json(['success' => false, 'message' => 'M-PIN not set up yet'], 422);
        }

        if ($mpin->isLocked()) {
            return response()->json(['success' => false, 'message' => 'M-PIN locked due to too many failed attempts. Try again in 30 minutes.'], 423);
        }

        if (!Hash::check($request->pin, $mpin->pin_hash)) {
            $attempts = $mpin->failed_attempts + 1;
            $mpin->update([
                'failed_attempts' => $attempts,
                'locked_until'    => $attempts >= 5 ? now()->addMinutes(30) : null,
            ]);
            return response()->json(['success' => false, 'message' => 'Incorrect M-PIN'], 401);
        }

        $mpin->update(['failed_attempts' => 0, 'locked_until' => null]);

        return response()->json(['success' => true, 'message' => 'M-PIN verified']);
    }

    // POST /mpin/reset  — requires OTP verified first (same purpose 'reset_mpin')
    public function reset(Request $request)
    {
        $request->validate([
            'otp'     => 'required|string|size:6',
            'new_pin' => 'required|string|size:4',
        ]);

        $user  = $request->user();
        $phone = $user->phone;

        // Verify OTP
        $otp = Otp::where('phone', $phone)
            ->where('code', $request->otp)
            ->where('purpose', 'reset_mpin')
            ->where('used', false)
            ->where('expires_at', '>', now())
            ->latest()->first();

        if (!$otp) {
            return response()->json(['success' => false, 'message' => 'Invalid or expired OTP'], 422);
        }

        $otp->update(['used' => true]);

        Mpin::updateOrCreate(
            ['user_id' => $user->id],
            ['pin_hash' => Hash::make($request->new_pin), 'is_set' => true, 'failed_attempts' => 0, 'locked_until' => null]
        );

        return response()->json(['success' => true, 'message' => 'M-PIN reset successfully']);
    }
}
