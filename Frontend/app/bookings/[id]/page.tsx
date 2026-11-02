import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { formatDateTime } from "@/lib/booking-types";
import { getBooking } from "@/lib/bookings";
import { deleteBooking } from "../actions";
import { StatusBadge } from "../status-badge";
import { DeleteButton } from "./delete-button";

export default function BookingPage({ params }: PageProps<"/bookings/[id]">) {
  return (
    <main>
      <p>
        <Link href="/bookings" className="button secondary">
          ← All bookings
        </Link>
      </p>
      <Suspense fallback={<p className="muted">Loading booking…</p>}>
        <BookingDetails params={params} />
      </Suspense>
    </main>
  );
}

async function BookingDetails({ params }: Pick<PageProps<"/bookings/[id]">, "params">) {
  const { id } = await params;
  const booking = /^\d+$/.test(id) ? await getBooking(id) : null;
  if (!booking) notFound();

  return (
    <>
      <h1 className="sr-only">
        {booking.rego} · Bay {booking.service_bay}
      </h1>

      <dl className="details">
        <dt>Customer</dt>
        <dd>{booking.customer_name}</dd>
        <dt>Email</dt>
        <dd>
          <a href={`mailto:${booking.customer_email}`}>{booking.customer_email}</a>
        </dd>
        <dt>Rego</dt>
        <dd>{booking.rego}</dd>
        <dt>Bay</dt>
        <dd>{booking.service_bay}</dd>
        <dt>Status</dt>
        <dd>
          <StatusBadge status={booking.status} />
        </dd>
        <dt>Starts</dt>
        <dd>{formatDateTime(booking.starts_at)}</dd>
        <dt>Ends</dt>
        <dd>{formatDateTime(booking.ends_at)}</dd>
        <dt>Notes</dt>
        <dd>{booking.notes || <span className="muted">None</span>}</dd>
      </dl>

      <div className="actions">
        <Link href={`/bookings/${booking.id}/edit`} className="button">
          Edit
        </Link>
        <DeleteButton action={deleteBooking.bind(null, booking.id, "/bookings")} />
      </div>
    </>
  );
}
