<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_notifications', function (Blueprint $table) {
            $table->id();
            $table->string('type');                        // kyc_submitted, large_transaction, security_alert, user_registered, system_alert
            $table->string('title');
            $table->text('message');
            $table->string('severity')->default('info');   // info, warning, critical
            $table->string('entity_type')->nullable();     // user, transaction, kyc_document
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->foreignId('read_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('type');
            $table->index('is_read');
            $table->index('severity');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_notifications');
    }
};
