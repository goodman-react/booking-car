import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getBooking } from "@/lib/bookings";
import { updateBooking } from "../../actions";
import { BookingForm } from "../../booking-form";

export default function EditBookingPage({ params }: PageProps<"/bookings/[id]/edit">) {
  return (
    <main>
      <h1>Edit booking</h1>
      <Suspense fallback={<p className="muted">Loading booking…</p>}>
        <EditForm params={params} />
      </Suspense>
    </main>
  );
}

async function EditForm({ params }: Pick<PageProps<"/bookings/[id]/edit">, "params">) {
  const { id } = await params;
  const booking = /^\d+$/.test(id) ? await getBooking(id) : null;
  if (!booking) notFound();

  return (
    <BookingForm
      action={updateBooking.bind(null, booking.id)}
      booking={booking}
      submitLabel="Save changes"
      cancelHref={`/bookings/${booking.id}`}
    />
  );
}
