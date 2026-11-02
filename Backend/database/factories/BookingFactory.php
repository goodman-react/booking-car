<?php

namespace Database\Factories;

use App\Enums\BookingStatus;
use App\Models\Booking;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<Booking>
 */
class BookingFactory extends Factory
{
    public function definition(): array
    {
        $start = Carbon::today()
            ->addDays(fake()->numberBetween(1, 60))
            ->setTime(fake()->numberBetween(8, 14), 0);

        return [
            'customer_name' => fake()->name(),
            'customer_email' => fake()->safeEmail(),
            'rego' => strtoupper(fake()->bothify('???###')),
            'service_bay' => fake()->numberBetween(1, config('bookings.service_bays')),
            'starts_at' => $start,
            'ends_at' => $start->copy()->addHours(fake()->numberBetween(1, 3)),
            'status' => fake()->randomElement(BookingStatus::cases()),
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
