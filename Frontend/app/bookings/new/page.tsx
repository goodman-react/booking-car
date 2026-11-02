import { createBooking } from "../actions";
import { BookingForm } from "../booking-form";

export default function NewBookingPage() {
  return (
    <main>
      <h1>New booking</h1>
      <BookingForm action={createBooking} submitLabel="Create booking" cancelHref="/bookings" />
    </main>
  );
}
