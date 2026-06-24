<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Add 'reset_mpin' to the allowed values of otps.purpose column.
 *
 * PostgreSQL: Laravel's enum() creates a VARCHAR + CHECK constraint.
 * We must drop the old constraint and add a new one that includes 'reset_mpin'.
 * SQLite: No CHECK constraint on VARCHAR enums, so the raw SQL is guarded.
 */
return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            // 1. Find and drop the old purpose CHECK constraint
            $constraints = DB::select("
                SELECT conname
                FROM pg_constraint c
                JOIN pg_class r ON r.oid = c.conrelid
                WHERE r.relname = 'otps'
                  AND c.contype = 'c'
                  AND pg_get_constraintdef(c.oid) LIKE '%purpose%'
            ");

            foreach ($constraints as $constraint) {
                DB::statement("ALTER TABLE otps DROP CONSTRAINT \"{$constraint->conname}\"");
            }

            // 2. Add new constraint with reset_mpin included
            DB::statement("
                ALTER TABLE otps
                ADD CONSTRAINT otps_purpose_check
                CHECK (purpose IN ('register', 'login', 'reset_pin', 'reset_mpin', 'transaction'))
            ");
        }
        // SQLite and MySQL: no action needed (enum stored as varchar without strict check)
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE otps DROP CONSTRAINT IF EXISTS otps_purpose_check");

            DB::statement("
                ALTER TABLE otps
                ADD CONSTRAINT otps_purpose_check
                CHECK (purpose IN ('register', 'login', 'reset_pin', 'transaction'))
            ");
        }
    }
};
