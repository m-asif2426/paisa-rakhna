<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('actor_name')->nullable();
            $table->string('actor_role')->default('user'); // admin, user, system
            $table->string('action');                       // e.g. user.login, kyc.approve, wallet.adjust
            $table->string('entity_type')->nullable();      // e.g. user, transaction, kyc_document
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->text('description')->nullable();
            $table->string('severity')->default('info');    // info, warning, critical
            $table->timestamps();

            $table->index(['entity_type', 'entity_id']);
            $table->index('action');
            $table->index('severity');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
