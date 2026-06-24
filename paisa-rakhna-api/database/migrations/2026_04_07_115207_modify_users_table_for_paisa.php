<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('email')->nullable()->change();
            $table->string('phone', 20)->unique()->nullable()->after('email');
            $table->string('cnic', 15)->nullable()->after('phone');
            $table->enum('kyc_status', ['pending', 'verified', 'rejected'])->default('pending')->after('cnic');
            $table->boolean('is_active')->default(true)->after('kyc_status');
            $table->timestamp('phone_verified_at')->nullable()->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['phone', 'cnic', 'kyc_status', 'is_active', 'phone_verified_at']);
        });
    }
};
