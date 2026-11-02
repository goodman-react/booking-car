import Link from "next/link";
import { Suspense } from "react";
import { bookingsHref as href, formatDateTime, parseStatuses, type BookingStatus } from "@/lib/booking-types";
import { getBookings } from "@/lib/bookings";
import { DeleteButton } from "./[id]/delete-button";
import { deleteBooking } from "./actions";
import { EyeIcon } from "./icons";
import { Pagination } from "./pagination";
import { StatusBadge } from "./status-badge";
import { StatusFilter } from "./status-filter";

const loading = <p className="muted">Loading bookings…</p>;

export default function BookingsPage({ searchParams }: PageProps<"/bookings">) {
  return (
    <main>
      <header className="page-header">
        <h1>Workshop bookings</h1>
        <Link href="/bookings/new" className="button">
          New booking
        </Link>
      </header>

      <Suspense fallback={loading}>
        <FilteredBookings searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function FilteredBookings({ searchParams }: Pick<PageProps<"/bookings">, "searchParams">) {
  const params = await searchParams;
  const statuses = parseStatuses(params.status);
  const page = Math.max(1, Number.parseInt(String(params.page ?? "1"), 10) || 1);

  return (
    <>
      <StatusFilter selected={statuses} />

      {/* Keyed so changing filter or page shows the fallback instead of stale rows. */}
      <Suspense key={`${statuses.join(",")}-${page}`} fallback={loading}>
        <BookingsTable statuses={statuses} page={page} />
      </Suspense>
    </>
  );
}

async function BookingsTable({ statuses, page }: { statuses: BookingStatus[]; page: number }) {
  const { data: bookings, meta } = await getBookings(statuses, page);

  if (bookings.length === 0) {
    return (
      <p className="muted">
        No bookings{statuses.length > 0 ? ` with status ${statuses.map((s) => `“${s}”`).join(" or ")}` : ""}
        {page > 1 && (
          <>
            {" "}on page {page}. <Link href={href(statuses)}>Back to page 1</Link>
          </>
        )}
        .
      </p>
    );
  }

  return (
    <>
      <table>
        <thead>
          <tr>
            <th className="row-number">#</th>
            <th>Starts</th>
            <th>Ends</th>
            <th>Bay</th>
            <th>Rego</th>
            <th>Customer</th>
            <th>Status</th>
            <th className="row-actions">Action</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b, i) => (
            <tr key={b.id}>
              <td className="row-number">{(meta.current_page - 1) * meta.per_page + i + 1}</td>
              <td className="nowrap">{formatDateTime(b.starts_at)}</td>
              <td className="nowrap">{formatDateTime(b.ends_at)}</td>
              <td>{b.service_bay}</td>
              <td className="nowrap">{b.rego}</td>
              <td className="customer">{b.customer_name}</td>
              <td className="nowrap">
                <StatusBadge status={b.status} />
              </td>
              <td className="row-actions">
                <Link
                  href={`/bookings/${b.id}`}
                  className="button secondary icon-button"
                  aria-label="Detail"
                  title="Detail"
                >
                  <EyeIcon />
                </Link>
                <DeleteButton action={deleteBooking.bind(null, b.id, href(statuses, page))} iconOnly />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination statuses={statuses} meta={meta} />
    </>
  );
}
