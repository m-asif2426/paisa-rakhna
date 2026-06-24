<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('label');                     // e.g. "Silver Card"
            $table->string('card_number_masked', 20);    // e.g. "**** **** **** 9027"
            $table->string('expiry', 7);                 // e.g. "12/27"
            $table->string('network', 20)->default('Visa'); // Visa / Mastercard
            $table->decimal('balance', 15, 2)->default(0);
            $table->decimal('spending_limit', 15, 2)->default(50000);
            $table->string('color1', 20)->default('#1a1a2e');
            $table->string('color2', 20)->default('#16213e');
            $table->boolean('is_frozen')->default(false);
            $table->boolean('online_payments')->default(true);
            $table->boolean('international')->default(false);
            $table->boolean('atm_withdrawals')->default(true);
            $table->boolean('nfc_tap_pay')->default(true);
            $table->enum('status', ['active', 'frozen', 'expired', 'blocked'])->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cards');
    }
};
