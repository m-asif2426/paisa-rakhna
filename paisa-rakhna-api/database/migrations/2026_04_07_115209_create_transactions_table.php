<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('wallet_id')->constrained()->cascadeOnDelete();
            $table->string('reference')->unique(); // TXN-20260407-XXXXX
            $table->enum('type', [
                'send', 'receive', 'add_money', 'withdrawal',
                'bill_payment', 'easyload', 'exchange', 'easyloan_repay'
            ]);
            $table->enum('status', ['pending', 'completed', 'failed', 'reversed'])->default('pending');
            $table->decimal('amount', 12, 2);
            $table->decimal('fee', 8, 2)->default(0.00);
            $table->string('currency', 3)->default('PKR');
            $table->string('description')->nullable();
            $table->string('recipient_phone', 20)->nullable();
            $table->string('recipient_name')->nullable();
            $table->json('meta')->nullable(); // bill number, operator, etc.
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
            $table->index('reference');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
