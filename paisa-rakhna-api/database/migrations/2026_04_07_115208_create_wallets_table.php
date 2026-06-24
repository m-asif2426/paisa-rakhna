<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wallets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->decimal('balance', 12, 2)->default(0.00);
            $table->string('currency', 3)->default('PKR');
            $table->string('account_number', 20)->unique(); // e.g. PR-0001234567
            $table->string('iban', 34)->nullable();
            $table->enum('status', ['active', 'frozen', 'closed'])->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wallets');
    }
};
