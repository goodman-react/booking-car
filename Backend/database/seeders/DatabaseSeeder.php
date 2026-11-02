<?php

namespace Database\Seeders;

use App\Models\Booking;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $bays = config('bookings.service_bays');

        // One booking per bay per morning, so seeded data never overlaps.
        foreach (range(0, 29) as $i) {
            $start = Carbon::today()->addDays(intdiv($i, $bays) + 1)->setTime(9, 0);

            Booking::factory()->create([
                'service_bay' => $i % $bays + 1,
                'starts_at' => $start,
                'ends_at' => $start->copy()->addHours(2),
            ]);
        }
    }
}
