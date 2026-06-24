<?php

use App\Http\Controllers\Admin\AdminAuthController;
use App\Http\Controllers\Admin\AdminAuditController;
use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Admin\AdminKycController;
use App\Http\Controllers\Admin\AdminNotificationController;
use App\Http\Controllers\Admin\AdminReportsController;
use App\Http\Controllers\Admin\AdminSecurityController;
use App\Http\Controllers\Admin\AdminSettingsController;
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
        Route::get('/users',                           [AdminController::class, 'users'])->name('users');
        Route::get('/users/export',                    [AdminController::class, 'exportUsers'])->name('users.export');
        Route::get('/users/{user}',                    [AdminController::class, 'showUser'])->name('users.show');
        Route::get('/users/{user}/edit',               [AdminController::class, 'editUser'])->name('users.edit');
        Route::put('/users/{user}',                    [AdminController::class, 'updateUser'])->name('users.update');
        Route::post('/users/{user}/toggle',            [AdminController::class, 'toggleUser'])->name('users.toggle');
        Route::post('/users/{user}/wallet-adjust',     [AdminController::class, 'walletAdjust'])->name('users.wallet-adjust');

        // Transactions
        Route::get('/transactions',          [AdminController::class, 'transactions'])->name('transactions');
        Route::get('/transactions/export',   [AdminController::class, 'exportTransactions'])->name('transactions.export');

        // KYC
        Route::get('/kyc',                        [AdminKycController::class, 'index'])->name('kyc');
        Route::get('/kyc/{kyc}/image/{type}',     [AdminKycController::class, 'serveImage'])->name('kyc.image');
        Route::post('/kyc/{kyc}/approve',         [AdminKycController::class, 'approve'])->name('kyc.approve');
        Route::post('/kyc/{kyc}/reject',          [AdminKycController::class, 'reject'])->name('kyc.reject');
        Route::post('/kyc/{kyc}/reset',           [AdminKycController::class, 'reset'])->name('kyc.reset');

        // Rates Management
        Route::get('/rates',  [AdminController::class, 'rates'])->name('rates');
        Route::post('/rates', [AdminController::class, 'updateRates'])->name('rates.update');

        // Audit Logs
        Route::get('/audit-logs', [AdminAuditController::class, 'index'])->name('audit-logs');

        // Security Logs
        Route::get('/security-logs',                [AdminSecurityController::class, 'index'])->name('security-logs');
        Route::post('/security-logs/{log}/resolve', [AdminSecurityController::class, 'resolve'])->name('security-logs.resolve');

        // System Settings
        Route::get('/settings',  [AdminSettingsController::class, 'index'])->name('settings');
        Route::post('/settings', [AdminSettingsController::class, 'update'])->name('settings.update');

        // Notifications
        Route::get('/notifications',                          [AdminNotificationController::class, 'index'])->name('notifications');
        Route::post('/notifications/{notification}/read',     [AdminNotificationController::class, 'markRead'])->name('notifications.read');
        Route::post('/notifications/read-all',                [AdminNotificationController::class, 'markAllRead'])->name('notifications.read-all');

        // Reports & Analytics
        Route::get('/reports', [AdminReportsController::class, 'index'])->name('reports');
    });
});
