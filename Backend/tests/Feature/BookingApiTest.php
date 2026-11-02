<?php

use App\Models\Booking;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

function bookingPayload(array $overrides = []): array
{
    return array_merge([
        'customer_name' => 'Jo Citizen',
        'customer_email' => 'jo@example.com',
        'rego' => 'abc 123',
        'service_bay' => 1,
        'starts_at' => '2026-12-01T09:00',
        'ends_at' => '2026-12-01T11:00',
        'status' => 'confirmed',
        'notes' => null,
    ], $overrides);
}

describe('CRUD', function () {
    it('creates a booking', function () {
        $this->postJson('/api/bookings', bookingPayload())
            ->assertCreated()
            ->assertJsonPath('data.rego', 'ABC123')
            ->assertJsonPath('data.starts_at', '2026-12-01T09:00')
            ->assertJsonPath('data.status', 'confirmed');

        expect(Booking::count())->toBe(1);
    });

    it('defaults status to pending', function () {
        $payload = bookingPayload();
        unset($payload['status']);

        $this->postJson('/api/bookings', $payload)->assertJsonPath('data.status', 'pending');
    });

    it('shows a booking and 404s for a missing one', function () {
        $booking = Booking::factory()->create();

        $this->getJson("/api/bookings/{$booking->id}")->assertOk()->assertJsonPath('data.id', $booking->id);
        $this->getJson('/api/bookings/999')->assertNotFound();
    });

    it('updates a booking', function () {
        $booking = Booking::factory()->create(['status' => 'pending']);

        $this->putJson("/api/bookings/{$booking->id}", bookingPayload(['status' => 'confirmed', 'notes' => 'Wheel bearings']))
            ->assertOk()
            ->assertJsonPath('data.notes', 'Wheel bearings');

        expect($booking->fresh()->status->value)->toBe('confirmed');
    });

    it('deletes a booking', function () {
        $booking = Booking::factory()->create();

        $this->deleteJson("/api/bookings/{$booking->id}")->assertNoContent();

        expect(Booking::count())->toBe(0);
    });

    it('paginates and filters by status', function () {
        Booking::factory()->count(12)->sequence(fn ($s) => [
            'service_bay' => 1,
            'starts_at' => now()->addDays($s->index + 1)->setTime(9, 0),
            'ends_at' => now()->addDays($s->index + 1)->setTime(10, 0),
            'status' => $s->index < 3 ? 'cancelled' : 'confirmed',
        ])->create();

        $this->getJson('/api/bookings?page=2')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.total', 12)
            ->assertJsonPath('meta.last_page', 2);

        $this->getJson('/api/bookings?status=cancelled')
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('meta.total', 3);

        $this->getJson('/api/bookings?status=cancelled,confirmed')
            ->assertJsonPath('meta.total', 12);

        $this->getJson('/api/bookings?status=pending,cancelled')
            ->assertJsonPath('meta.total', 3);

        $this->getJson('/api/bookings?status=nope')->assertUnprocessable();
        $this->getJson('/api/bookings?status=pending,nope')->assertUnprocessable();
    });});

describe('validation', function () {
    it('requires the core fields', function () {
        $this->postJson('/api/bookings', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['customer_name', 'customer_email', 'rego', 'service_bay', 'starts_at', 'ends_at']);
    });

    it('rejects bad values', function (string $field, mixed $value) {
        $this->postJson('/api/bookings', bookingPayload([$field => $value]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors([$field]);
    })->with([
        'email' => ['customer_email', 'not-an-email'],
        'bay out of range' => ['service_bay', 99],
        'unknown status' => ['status', 'done'],
        'ends before start' => ['ends_at', '2026-12-01T08:00'],
        'rego symbols' => ['rego', 'AB-12!'],
    ]);
});

describe('no overlapping bookings in a bay', function () {
    beforeEach(function () {
        $this->postJson('/api/bookings', bookingPayload())->assertCreated();
    });

    it('rejects an overlapping booking in the same bay, against starts_at', function () {
        $this->postJson('/api/bookings', bookingPayload(['starts_at' => '2026-12-01T10:00', 'ends_at' => '2026-12-01T12:00']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['starts_at'])
            ->assertJsonMissingValidationErrors(['service_bay', 'ends_at']);
    });

    it('reports the overlap alongside unrelated field errors', function () {
        $this->postJson('/api/bookings', bookingPayload(['customer_email' => 'nope']))
            ->assertJsonValidationErrors(['customer_email', 'starts_at']);
    });

    it('rejects a booking that fully contains an existing one', function () {
        $this->postJson('/api/bookings', bookingPayload(['starts_at' => '2026-12-01T08:00', 'ends_at' => '2026-12-01T12:00']))
            ->assertJsonValidationErrors(['starts_at']);
    });

    it('allows back-to-back bookings', function () {
        $this->postJson('/api/bookings', bookingPayload(['starts_at' => '2026-12-01T11:00', 'ends_at' => '2026-12-01T12:00']))
            ->assertCreated();
    });

    it('allows the same slot in a different bay', function () {
        $this->postJson('/api/bookings', bookingPayload(['service_bay' => 2]))->assertCreated();
    });

    it('ignores cancelled bookings', function () {
        Booking::first()->update(['status' => 'cancelled']);

        $this->postJson('/api/bookings', bookingPayload())->assertCreated();
    });

    it('lets a booking be edited without clashing with itself', function () {
        $booking = Booking::first();

        $this->putJson("/api/bookings/{$booking->id}", bookingPayload(['ends_at' => '2026-12-01T12:00']))->assertOk();
    });

    it('rejects moving a booking onto another one', function () {
        $other = Booking::factory()->create([
            'service_bay' => 2,
            'starts_at' => '2026-12-01 09:00:00',
            'ends_at' => '2026-12-01 10:00:00',
            'status' => 'pending',
        ]);

        $this->putJson("/api/bookings/{$other->id}", bookingPayload(['service_bay' => 1]))
            ->assertJsonValidationErrors(['starts_at']);
    });

    it('rejects re-activating a cancelled booking into a taken slot', function () {
        $cancelled = Booking::factory()->create([
            'service_bay' => 1,
            'starts_at' => '2026-12-01 09:30:00',
            'ends_at' => '2026-12-01 10:30:00',
            'status' => 'cancelled',
        ]);

        $this->putJson("/api/bookings/{$cancelled->id}", bookingPayload([
            'starts_at' => '2026-12-01T09:30', 'ends_at' => '2026-12-01T10:30', 'status' => 'pending',
        ]))->assertJsonValidationErrors(['starts_at']);
    });
});

describe('concurrency', function () {
    it('enforces the rule in the database, not just in validation', function () {
        expect(fn () => DB::table('bookings')->insert([
            'customer_name' => 'Racer',
            'customer_email' => 'racer@example.com',
            'rego' => 'RACE1',
            'service_bay' => 1,
            'starts_at' => '2026-12-01 09:00:00',
            'ends_at' => '2026-12-01 10:00:00',
            'status' => 'pending',
        ]))->not->toThrow(QueryException::class);

        expect(fn () => DB::table('bookings')->insert([
            'customer_name' => 'Racer 2',
            'customer_email' => 'racer2@example.com',
            'rego' => 'RACE2',
            'service_bay' => 1,
            'starts_at' => '2026-12-01 09:30:00',
            'ends_at' => '2026-12-01 10:30:00',
            'status' => 'confirmed',
        ]))->toThrow(QueryException::class, 'booking_overlap');
    });

    it('returns a 422 when a request loses the race after passing validation', function () {
        // Simulate another request committing the same slot between this
        // request's validation and its insert.
        Booking::creating(function (Booking $booking) {
            if ($booking->rego === 'LOSER1') {
                DB::table('bookings')->insert([
                    'customer_name' => 'Winner',
                    'customer_email' => 'winner@example.com',
                    'rego' => 'WINNER1',
                    'service_bay' => 3,
                    'starts_at' => '2026-12-01 09:00:00',
                    'ends_at' => '2026-12-01 11:00:00',
                    'status' => 'confirmed',
                ]);
            }
        });

        $this->postJson('/api/bookings', bookingPayload(['service_bay' => 3, 'rego' => 'LOSER1']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['starts_at']);

        expect(Booking::where('service_bay', 3)->pluck('rego')->all())->toBe(['WINNER1']);
    });
});
