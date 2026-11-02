<?php

namespace App\Http\Resources;

use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Booking */
class BookingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Times are the dealer's local wall-clock time, without an offset.
        return [
            'id' => $this->id,
            'customer_name' => $this->customer_name,
            'customer_email' => $this->customer_email,
            'rego' => $this->rego,
            'service_bay' => $this->service_bay,
            'starts_at' => $this->starts_at->format('Y-m-d\TH:i'),
            'ends_at' => $this->ends_at->format('Y-m-d\TH:i'),
            'status' => $this->status,
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
