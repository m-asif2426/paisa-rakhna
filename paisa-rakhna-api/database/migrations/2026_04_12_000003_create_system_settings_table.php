<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('type')->default('string');     // string, boolean, integer, json
            $table->string('group')->default('general');    // general, security, notifications, limits, maintenance
            $table->string('label');                         // human-readable label
            $table->text('description')->nullable();
            $table->boolean('is_sensitive')->default(false); // mask in UI (passwords, keys)
            $table->timestamps();

            $table->index('group');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};
