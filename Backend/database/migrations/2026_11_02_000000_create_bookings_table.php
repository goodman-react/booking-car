<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('rego', 12);
            $table->unsignedSmallInteger('service_bay');
            $table->dateTime('starts_at');
            $table->dateTime('ends_at');
            $table->string('status', 16)->default('pending')->index();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['service_bay', 'starts_at', 'ends_at']);
        });

        // The overlap rule lives in the database so it holds no matter how many
        // requests race: SQLite has a single writer, and the trigger runs inside it.
        $overlap = <<<'SQL'
            SELECT RAISE(ABORT, 'booking_overlap')
            WHERE EXISTS (
                SELECT 1 FROM bookings
                WHERE service_bay = NEW.service_bay
                  AND status != 'cancelled'
                  AND starts_at < NEW.ends_at
                  AND ends_at > NEW.starts_at
                  AND id IS NOT NEW.id
            );
        SQL;

        DB::unprepared("
            CREATE TRIGGER bookings_no_overlap_insert
            BEFORE INSERT ON bookings
            WHEN NEW.status != 'cancelled'
            BEGIN {$overlap} END;
        ");

        DB::unprepared("
            CREATE TRIGGER bookings_no_overlap_update
            BEFORE UPDATE OF service_bay, starts_at, ends_at, status ON bookings
            WHEN NEW.status != 'cancelled'
            BEGIN {$overlap} END;
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
