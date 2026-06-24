<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('security_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('event');                       // login_success, login_failed, pin_failed, mpin_failed, account_locked, suspicious_activity
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('severity')->default('info');   // info, warning, critical
            $table->json('metadata')->nullable();          // extra context data
            $table->boolean('is_resolved')->default(false);
            $table->text('resolution_note')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('event');
            $table->index('severity');
            $table->index('ip_address');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('security_logs');
    }
};
