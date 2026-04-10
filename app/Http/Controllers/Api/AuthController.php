<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\OtpMail;
use App\Models\Card;
use App\Models\Mpin;
use App\Models\Otp;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class AuthController extends Controller
{
    // POST /auth/otp/send
    public function sendOtp(Request $request)
    {
        $request->validate([
            'phone'   => 'required|string|min:10|max:20',
            'channel' => 'sometimes|in:email,sms',
            'email'   => 'required_if:channel,email|nullable|email|max:255',
        ]);

        $phone   = preg_replace('/\D/', '', $request->phone);
        $purpose = in_array($request->input('purpose'), ['register', 'reset_pin'])
            ? $request->input('purpose')
            : 'register';

        // Default channel is email when email is provided, otherwise sms
        $channel = $request->input('channel', $request->filled('email') ? 'email' : 'sms');
        $email   = $channel === 'email' ? strtolower($request->input('email', '')) : null;

        // Invalidate previous unused OTPs for this identity+purpose
        if ($channel === 'email' && $email) {
            Otp::where('email', $email)->where('purpose', $purpose)->update(['used' => true]);
        } else {
            Otp::where('phone', $phone)->where('purpose', $purpose)->update(['used' => true]);
        }

        $code = app()->isProduction() ? (string) random_int(100000, 999999) : '123456';

        Otp::create([
            'phone'      => $phone,
            'email'      => $email,
            'channel'    => $channel,
            'code'       => $code,
            'purpose'    => $purpose,
            'used'       => false,
            'expires_at' => now()->addMinutes(5),
        ]);

        // ── Deliver OTP ──────────────────────────────────────────────────────
        $maskedDestination = null;

        if ($channel === 'email' && $email) {
            try {
                Mail::to($email)->send(new OtpMail($code, $purpose));
            } catch (\Throwable $e) {
                \Log::error('OTP email failed: ' . $e->getMessage());
                // Non-fatal in local env — OTP still returned in response
            }
            // Mask: user@example.com → u***@example.com
            [$localPart, $domain] = array_pad(explode('@', $email, 2), 2, '');
            $maskedDestination = substr($localPart, 0, 1) . '***@' . $domain;
        } else {
            // SMS — Twilio integration placeholder
            // When Twilio keys are set: send SMS via Twilio SDK
            $maskedDestination = substr($phone, 0, 4) . '***' . substr($phone, -2);
        }

        return response()->json([
            'success'     => true,
            'message'     => 'OTP sent',
            'channel'     => $channel,
            'destination' => $maskedDestination,
            'otp'         => app()->isLocal() ? $code : null,
        ]);
    }

    // POST /auth/otp/verify
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'code'    => 'required|string|size:6',
            'purpose' => 'sometimes|string',
            'channel' => 'sometimes|in:email,sms',
            'phone'   => 'required_unless:channel,email|nullable|string',
            'email'   => 'required_if:channel,email|nullable|email',
        ]);

        $purpose = in_array($request->input('purpose'), ['register', 'reset_pin'])
            ? $request->input('purpose')
            : 'register';

        $channel = $request->input('channel', 'sms');

        if ($channel === 'email') {
            $email = strtolower($request->input('email', ''));
            $otp = Otp::where('email', $email)
                ->where('code', $request->code)
                ->where('purpose', $purpose)
                ->where('used', false)
                ->where('expires_at', '>', now())
                ->latest()->first();
        } else {
            $phone = preg_replace('/\D/', '', $request->input('phone', ''));
            $otp = Otp::where('phone', $phone)
                ->where('code', $request->code)
                ->where('purpose', $purpose)
                ->where('used', false)
                ->where('expires_at', '>', now())
                ->latest()->first();
        }

        if (!$otp) {
            return response()->json(['success' => false, 'message' => 'Invalid or expired OTP'], 422);
        }

        $otp->update(['used' => true]);

        return response()->json(['success' => true, 'message' => 'OTP verified']);
    }

    // POST /auth/register
    public function register(Request $request)
    {
        $request->validate([
            'name'  => 'required|string|max:100',
            'phone' => 'required|string|unique:users,phone',
            'pin'   => 'required|string|size:4',
        ]);

        $user = User::create([
            'name'              => $request->name,
            'phone'             => $request->phone,
            'password'          => Hash::make($request->pin),
            'phone_verified_at' => now(),
            'kyc_status'        => 'pending',
            'is_active'         => true,
        ]);

        Wallet::create([
            'user_id'        => $user->id,
            'balance'        => 0.00,
            'currency'       => 'PKR',
            'account_number' => 'PR-' . str_pad($user->id, 10, '0', STR_PAD_LEFT),
            'status'         => 'active',
        ]);

        Mpin::create([
            'user_id'  => $user->id,
            'pin_hash' => Hash::make($request->pin),
            'is_set'   => true,
        ]);

        // Auto-create a Silver card for the new user
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
        ]);

        $token = $user->createToken('mobile')->plainTextToken;

        return response()->json([
            'success' => true,
            'token'   => $token,
            'user'    => $this->userPayload($user->fresh('wallet', 'mpin')),
        ], 201);
    }

    // POST /auth/login
    public function login(Request $request)
    {
        $request->validate([
            'phone' => 'required|string',
            'pin'   => 'required|string|size:4',
        ]);

        $phone = preg_replace('/\D/', '', $request->phone);
        $user  = User::where('phone', $phone)->first();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Invalid phone or PIN'], 401);
        }

        // Check login lockout
        if ($user->login_locked_until && now()->lessThan($user->login_locked_until)) {
            $minutes = (int) ceil(now()->diffInSeconds($user->login_locked_until) / 60);
            return response()->json([
                'success' => false,
                'message' => "Account locked due to too many failed attempts. Try again in {$minutes} minute(s).",
            ], 423);
        }

        if (!Hash::check($request->pin, $user->password)) {
            $attempts = ($user->failed_login_attempts ?? 0) + 1;
            $user->update([
                'failed_login_attempts' => $attempts,
                'login_locked_until'    => $attempts >= 5 ? now()->addMinutes(15) : null,
            ]);
            return response()->json(['success' => false, 'message' => 'Invalid phone or PIN'], 401);
        }

        if (!$user->is_active) {
            return response()->json(['success' => false, 'message' => 'Account is suspended. Contact support.'], 403);
        }

        // Reset failed attempts on success
        $user->update(['failed_login_attempts' => 0, 'login_locked_until' => null]);

        $user->tokens()->delete();
        $token = $user->createToken('mobile')->plainTextToken;

        return response()->json([
            'success' => true,
            'token'   => $token,
            'user'    => $this->userPayload($user->fresh('wallet', 'mpin')),
        ]);
    }

    // POST /auth/reset-pin  (phone + otp_code + new_pin)
    public function resetPin(Request $request)
    {
        $request->validate([
            'phone'    => 'required|string',
            'code'     => 'required|string|size:6',
            'new_pin'  => 'required|string|size:4',
        ]);

        $phone = preg_replace('/\D/', '', $request->phone);
        $user  = User::where('phone', $phone)->first();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Phone number not registered'], 404);
        }

        $otp = Otp::where('phone', $phone)
            ->where('code', $request->code)
            ->where('purpose', 'reset_pin')
            ->where('used', false)
            ->where('expires_at', '>', now())
            ->latest()->first();

        if (!$otp) {
            return response()->json(['success' => false, 'message' => 'Invalid or expired OTP'], 422);
        }

        $otp->update(['used' => true]);

        // Update login PIN (password field)
        $user->update(['password' => Hash::make($request->new_pin)]);

        // Also update M-PIN to same PIN
        $mpin = $user->mpin ?? Mpin::where('user_id', $user->id)->first();
        if ($mpin) {
            $mpin->update([
                'pin_hash'        => Hash::make($request->new_pin),
                'failed_attempts' => 0,
                'locked_until'    => null,
                'is_set'          => true,
            ]);
        } else {
            Mpin::create([
                'user_id'  => $user->id,
                'pin_hash' => Hash::make($request->new_pin),
                'is_set'   => true,
            ]);
        }

        // Reset login lockout on successful PIN reset
        $user->update(['failed_login_attempts' => 0, 'login_locked_until' => null]);

        return response()->json(['success' => true, 'message' => 'PIN reset successfully. You can now log in.']);
    }

    // POST /auth/logout
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['success' => true, 'message' => 'Logged out']);
    }

    // PATCH /auth/profile
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'name'  => 'sometimes|string|min:3|max:100',
            'email' => 'sometimes|nullable|email|max:255|unique:users,email,' . $user->id,
        ]);

        if (!empty($data)) {
            $user->update($data);
        }

        return response()->json([
            'success' => true,
            'message' => 'Profile updated',
            'user'    => $this->userPayload($user->fresh('wallet', 'mpin')),
        ]);
    }

    // GET /auth/me
    public function me(Request $request)
    {
        return response()->json([
            'success' => true,
            'user'    => $this->userPayload($request->user()->fresh('wallet', 'mpin')),
        ]);
    }

    private function userPayload(User $user): array
    {
        $parts    = explode(' ', trim($user->name));
        $initials = strtoupper(substr($parts[0], 0, 1) . (isset($parts[1]) ? substr($parts[1], 0, 1) : ''));
        $wallet   = $user->wallet;

        return [
            'id'         => $user->id,
            'name'       => $user->name,
            'phone'      => $user->phone,
            'email'      => $user->email,
            'initials'   => $initials,
            'kyc_status' => $user->kyc_status,
            'has_mpin'   => (bool) optional($user->mpin)->is_set,
            'wallet'     => $wallet ? [
                'balance'        => (float) $wallet->balance,
                'account_number' => $wallet->account_number,
                'currency'       => $wallet->currency,
                'status'         => $wallet->status,
            ] : null,
        ];
    }
}
