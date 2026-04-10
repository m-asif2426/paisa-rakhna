<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CardController;
use App\Http\Controllers\Api\ChatbotController;
use App\Http\Controllers\Api\DeviceController;
use App\Http\Controllers\Api\KycController;
use App\Http\Controllers\Api\MpinController;
use App\Http\Controllers\Api\RatesController;
use App\Http\Controllers\Api\StatementController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\WalletController;
use Illuminate\Support\Facades\Route;

// ── Public routes (no auth needed) ───────────────────────────────────────────

// Zakat rates — public, cached 1 hour
Route::get('/rates/zakat', [RatesController::class, 'zakat']);

Route::prefix('auth')->group(function () {
    // OTP send: max 3 per minute per IP to prevent SMS spam
    Route::middleware('throttle:3,1')->post('/otp/send',   [AuthController::class, 'sendOtp']);

    // OTP verify + register: max 10 per minute per IP
    Route::middleware('throttle:10,1')->group(function () {
        Route::post('/otp/verify',  [AuthController::class, 'verifyOtp']);
        Route::post('/register',    [AuthController::class, 'register']);
        Route::post('/reset-pin',   [AuthController::class, 'resetPin']);
    });

    // Login: max 5 per minute per IP (brute-force protection)
    Route::middleware('throttle:5,1')->post('/login', [AuthController::class, 'login']);
});

// M-PIN OTP request — authenticated user only (mpin reset requires login)
Route::middleware('auth:sanctum')->post('/mpin/otp', function (\Illuminate\Http\Request $request) {
    $request->validate(['purpose' => 'in:reset_mpin']);
    $user  = $request->user();
    $phone = $user->phone;
    $purpose = 'reset_mpin';

    \App\Models\Otp::where('phone', $phone)->where('purpose', $purpose)->update(['used' => true]);
    $code = app()->isProduction() ? (string) random_int(100000, 999999) : '123456';
    \App\Models\Otp::create([
        'phone' => $phone, 'code' => $code, 'purpose' => $purpose,
        'used'  => false, 'expires_at' => now()->addMinutes(5),
    ]);
    return response()->json(['success' => true, 'message' => 'OTP sent', 'otp' => app()->isLocal() ? $code : null]);
});

// ── Protected routes (Sanctum token required) ─────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/auth/logout',     [AuthController::class, 'logout']);
    Route::get('/auth/me',          [AuthController::class, 'me']);
    Route::patch('/auth/profile',   [AuthController::class, 'updateProfile']);

    // Wallet
    Route::get('/wallet',         [WalletController::class, 'show']);
    Route::post('/wallet/topup',  [WalletController::class, 'topup']);

    // Transactions
    Route::get('/transactions',       [TransactionController::class, 'index']);
    Route::post('/transactions/send', [TransactionController::class, 'send']);

    // M-PIN
    Route::get('/mpin/status',   [MpinController::class, 'status']);
    Route::post('/mpin/set',     [MpinController::class, 'set']);
    Route::post('/mpin/verify',  [MpinController::class, 'verify']);
    Route::post('/mpin/reset',   [MpinController::class, 'reset']);

    // Cards
    Route::get('/cards',                   [CardController::class, 'index']);
    Route::post('/cards/{card}/toggle',    [CardController::class, 'toggle']);

    // KYC
    Route::get('/kyc',          [KycController::class, 'show']);
    Route::post('/kyc/submit',  [KycController::class, 'submit']);

    // Statement (JSON or HTML)
    Route::get('/statement', [StatementController::class, 'download']);

    // Device (FCM push token registration)
    Route::post('/device/register', [DeviceController::class, 'register']);

    // AI Chatbot
    Route::post('/chatbot',      [ChatbotController::class, 'chat']);
});
