<?php

namespace Database\Seeders;

use App\Models\SystemSetting;
use Illuminate\Database\Seeder;

class SystemSettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            // ── General ───────────────────────────────────
            ['key' => 'app_name',           'value' => 'Paisa Rakhna',    'type' => 'string',  'group' => 'general',       'label' => 'App Name',                   'description' => 'Application display name'],
            ['key' => 'app_currency',       'value' => 'PKR',             'type' => 'string',  'group' => 'general',       'label' => 'Currency',                   'description' => 'Default currency code'],
            ['key' => 'maintenance_mode',   'value' => 'false',           'type' => 'boolean', 'group' => 'maintenance',   'label' => 'Maintenance Mode',           'description' => 'When ON, app shows maintenance message to users'],
            ['key' => 'maintenance_message','value' => 'App is under maintenance. Please try again later.', 'type' => 'string', 'group' => 'maintenance', 'label' => 'Maintenance Message', 'description' => 'Message shown during maintenance'],

            // ── Security ──────────────────────────────────
            ['key' => 'max_login_attempts',     'value' => '5',   'type' => 'integer', 'group' => 'security', 'label' => 'Max Login Attempts',        'description' => 'Number of failed login attempts before lockout'],
            ['key' => 'login_lockout_minutes',  'value' => '30',  'type' => 'integer', 'group' => 'security', 'label' => 'Login Lockout (minutes)',   'description' => 'Duration of account lockout after max failed attempts'],
            ['key' => 'max_mpin_attempts',      'value' => '3',   'type' => 'integer', 'group' => 'security', 'label' => 'Max M-PIN Attempts',        'description' => 'Number of wrong M-PIN attempts before lock'],
            ['key' => 'mpin_lockout_minutes',   'value' => '30',  'type' => 'integer', 'group' => 'security', 'label' => 'M-PIN Lockout (minutes)',   'description' => 'M-PIN lock duration after max failed attempts'],
            ['key' => 'otp_expiry_minutes',     'value' => '5',   'type' => 'integer', 'group' => 'security', 'label' => 'OTP Expiry (minutes)',      'description' => 'OTP validity duration'],
            ['key' => 'otp_max_per_10min',      'value' => '3',   'type' => 'integer', 'group' => 'security', 'label' => 'Max OTPs per 10 min',      'description' => 'Rate limit: OTP requests per 10 minutes per phone'],
            ['key' => 'token_expiry_days',      'value' => '30',  'type' => 'integer', 'group' => 'security', 'label' => 'Token Expiry (days)',       'description' => 'Sanctum token validity in days'],

            // ── Limits ────────────────────────────────────
            ['key' => 'max_send_amount',       'value' => '500000', 'type' => 'integer', 'group' => 'limits', 'label' => 'Max Send Amount (PKR)',      'description' => 'Maximum single transfer amount'],
            ['key' => 'daily_send_limit',      'value' => '1000000','type' => 'integer', 'group' => 'limits', 'label' => 'Daily Send Limit (PKR)',     'description' => 'Maximum total transfers per day per user'],
            ['key' => 'max_topup_amount',      'value' => '500000', 'type' => 'integer', 'group' => 'limits', 'label' => 'Max Topup Amount (PKR)',     'description' => 'Maximum single top-up amount'],
            ['key' => 'min_send_amount',       'value' => '10',     'type' => 'integer', 'group' => 'limits', 'label' => 'Min Send Amount (PKR)',      'description' => 'Minimum transfer amount'],
            ['key' => 'transaction_fee_percent','value' => '0',     'type' => 'integer', 'group' => 'limits', 'label' => 'Transaction Fee (%)',        'description' => 'Fee percentage on transfers (0 = free)'],

            // ── Notifications ─────────────────────────────
            ['key' => 'notify_large_txn_amount', 'value' => '100000', 'type' => 'integer', 'group' => 'notifications', 'label' => 'Large Transaction Alert (PKR)', 'description' => 'Admin gets notified for transactions above this amount'],
            ['key' => 'notify_new_user',          'value' => 'true',   'type' => 'boolean', 'group' => 'notifications', 'label' => 'Notify on New User',           'description' => 'Send admin notification when new user registers'],
            ['key' => 'notify_kyc_submitted',     'value' => 'true',   'type' => 'boolean', 'group' => 'notifications', 'label' => 'Notify on KYC Submit',         'description' => 'Send admin notification when KYC documents submitted'],
            ['key' => 'notify_security_events',   'value' => 'true',   'type' => 'boolean', 'group' => 'notifications', 'label' => 'Notify on Security Events',    'description' => 'Send admin notification for security events (failed logins etc.)'],
        ];

        foreach ($settings as $setting) {
            SystemSetting::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }
}
