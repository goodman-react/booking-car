<?php

namespace App\Models;

use App\Enums\BookingStatus;
use Database\Factories\BookingFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    /** @use HasFactory<BookingFactory> */
    use HasFactory;

    protected $fillable = [
        'customer_name',
        'customer_email',
        'rego',
        'service_bay',
        'starts_at',
        'ends_at',
        'status',
        'notes',
    ];

    protected $attributes = [
        'status' => 'pending',
    ];

    protected function casts(): array
    {
        return [
            'service_bay' => 'integer',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'status' => BookingStatus::class,
        ];
    }

    /**
     * Active bookings in the same bay whose time range intersects [starts, ends).
     */
    public function scopeOverlapping(Builder $query, int $bay, string $startsAt, string $endsAt, ?int $ignoreId = null): void
    {
        $query->where('service_bay', $bay)
            ->where('status', '!=', BookingStatus::Cancelled)
            ->where('starts_at', '<', $endsAt)
            ->where('ends_at', '>', $startsAt)
            ->when($ignoreId, fn (Builder $q) => $q->whereKeyNot($ignoreId));
    }
}
