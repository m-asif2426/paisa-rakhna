<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('otps', function (Blueprint $table) {
            $table->index(['email', 'purpose'], 'otps_email_purpose_index');
            $table->index(['expires_at'], 'otps_expires_at_index');
        });

        Schema::table('wallets', function (Blueprint $table) {
            $table->index(['user_id'], 'wallets_user_id_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('otps', function (Blueprint $table) {
            $table->dropIndex('otps_email_purpose_index');
            $table->dropIndex('otps_expires_at_index');
        });

        Schema::table('wallets', function (Blueprint $table) {
            $table->dropIndex('wallets_user_id_index');
        });
    }
};
