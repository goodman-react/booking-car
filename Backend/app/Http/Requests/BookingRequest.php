<?php

namespace App\Http\Requests;

use App\Enums\BookingStatus;
use App\Models\Booking;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class BookingRequest extends FormRequest
{
    public const OVERLAP_MESSAGE = 'This service bay is already booked for part of that time.';

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->rego)) {
            $this->merge(['rego' => strtoupper(preg_replace('/\s+/', '', $this->rego))]);
        }
    }

    public function rules(): array
    {
        return [
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_email' => ['required', 'email', 'max:255'],
            'rego' => ['required', 'string', 'max:12', 'alpha_num'],
            'service_bay' => ['required', 'integer', 'between:1,'.config('bookings.service_bays')],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'status' => ['sometimes', 'required', Rule::enum(BookingStatus::class)],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    /**
     * Friendly overlap check. The database trigger is what actually guarantees
     * the rule under concurrency; this just gives a precise message up front.
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                $status = $this->input('status') ?? $this->route('booking')?->status->value;

                if ($validator->errors()->hasAny(['service_bay', 'starts_at', 'ends_at']) || $status === BookingStatus::Cancelled->value) {
                    return;
                }

                $clash = Booking::query()
                    ->overlapping(
                        (int) $this->input('service_bay'),
                        Carbon::parse($this->input('starts_at'))->format('Y-m-d H:i:s'),
                        Carbon::parse($this->input('ends_at'))->format('Y-m-d H:i:s'),
                        $this->route('booking')?->id,
                    )
                    ->orderBy('starts_at')
                    ->first();

                if ($clash) {
                    $validator->errors()->add('starts_at', sprintf(
                        'Bay %d is already booked from %s to %s.',
                        $clash->service_bay,
                        $clash->starts_at->format('j M H:i'),
                        $clash->ends_at->format('j M H:i'),
                    ));
                }
            },
        ];
    }

    /**
     * Validated data with datetimes normalised to the storage format, so string
     * comparisons in SQL (and in the trigger) are reliable.
     */
    public function bookingData(): array
    {
        $data = $this->validator->safe()->all();

        $data['service_bay'] = (int) $data['service_bay'];
        $data['starts_at'] = Carbon::parse($data['starts_at'])->format('Y-m-d H:i:s');
        $data['ends_at'] = Carbon::parse($data['ends_at'])->format('Y-m-d H:i:s');

        return $data;
    }
}
