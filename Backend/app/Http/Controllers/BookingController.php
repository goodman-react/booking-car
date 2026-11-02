<?php

namespace App\Http\Controllers;

use App\Enums\BookingStatus;
use App\Http\Requests\BookingRequest;
use App\Http\Resources\BookingResource;
use App\Models\Booking;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class BookingController extends Controller
{
    public function index(Request $request)
    {
        // Accepts one status or several comma-separated: ?status=pending,confirmed
        $statuses = array_values(array_filter(explode(',', (string) $request->query('status', ''))));

        validator(['status' => $statuses], [
            'status.*' => [Rule::enum(BookingStatus::class)],
        ])->validate();

        $bookings = Booking::query()
            ->when($statuses, fn ($q) => $q->whereIn('status', $statuses))
            ->orderBy('starts_at')
            ->orderBy('id')
            ->paginate(config('bookings.per_page'))
            ->withQueryString();

        return BookingResource::collection($bookings);
    }

    public function store(BookingRequest $request)
    {
        $booking = $this->guardOverlap(fn () => Booking::create($request->bookingData()));

        return BookingResource::make($booking)->response()->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Booking $booking)
    {
        return BookingResource::make($booking);
    }

    public function update(BookingRequest $request, Booking $booking)
    {
        $this->guardOverlap(fn () => $booking->update($request->bookingData()));

        return BookingResource::make($booking);
    }

    public function destroy(Booking $booking)
    {
        $booking->delete();

        return response()->noContent();
    }

    /**
     * A request can pass validation and still lose a race to a concurrent one.
     * The trigger rejects it; report that as the same validation error.
     */
    private function guardOverlap(callable $write): mixed
    {
        try {
            return $write();
        } catch (QueryException $e) {
            if (str_contains($e->getMessage(), 'booking_overlap')) {
                throw ValidationException::withMessages(['starts_at' => BookingRequest::OVERLAP_MESSAGE]);
            }

            throw $e;
        }
    }
}
