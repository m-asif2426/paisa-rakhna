<?php

use App\Http\Controllers\Admin\AdminAuthController;
use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Admin\AdminKycController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => redirect('/admin'));

// ── Admin Auth (unauthenticated) ──────────────────────────────────────────────
Route::prefix('admin')->name('admin.')->group(function () {
    Route::get('/login',  [AdminAuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AdminAuthController::class, 'login'])->name('login.post');

    // ── Protected admin routes ────────────────────────────────────────────────
    Route::middleware('admin')->group(function () {
        Route::get('/',              fn () => redirect()->route('admin.dashboard'));
        Route::post('/logout',       [AdminAuthController::class, 'logout'])->name('logout');
        Route::get('/dashboard',     [AdminController::class, 'dashboard'])->name('dashboard');

        // Users
        Route::get('/users',                          [AdminController::class, 'users'])->name('users');
        Route::get('/users/export',                   [AdminController::class, 'exportUsers'])->name('users.export');
        Route::get('/users/{user}',                   [AdminController::class, 'showUser'])->name('users.show');
        Route::post('/users/{user}/toggle',           [AdminController::class, 'toggleUser'])->name('users.toggle');
        Route::post('/users/{user}/wallet-adjust',    [AdminController::class, 'walletAdjust'])->name('users.wallet-adjust');

        // Transactions
        Route::get('/transactions',          [AdminController::class, 'transactions'])->name('transactions');
        Route::get('/transactions/export',   [AdminController::class, 'exportTransactions'])->name('transactions.export');

        // KYC
        Route::get('/kyc',                        [AdminKycController::class, 'index'])->name('kyc');
        Route::get('/kyc/{kyc}/image/{type}',     [AdminKycController::class, 'serveImage'])->name('kyc.image');
        Route::post('/kyc/{kyc}/approve',         [AdminKycController::class, 'approve'])->name('kyc.approve');
        Route::post('/kyc/{kyc}/reject',          [AdminKycController::class, 'reject'])->name('kyc.reject');
    });
});
