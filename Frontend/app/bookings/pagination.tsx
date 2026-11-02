import Link from "next/link";
import { bookingsHref, type BookingStatus } from "@/lib/booking-types";

function CarIcon({ facing }: { facing: "left" | "right" }) {
  return (
    <svg
      className={facing === "left" ? "car-icon car-icon-left" : "car-icon"}
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2.7-3.6A2 2 0 0 0 13.7 6H6.3a2 2 0 0 0-1.6.9L2.4 10.5A2 2 0 0 0 2 11.7V16c0 .6.4 1 1 1h2" />
      <path d="M9 17h6" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  );
}

// Page numbers to show, with null marking a gap: 1 … 4 5 6 … 12
function pageWindow(current: number, last: number): (number | null)[] {
  const pages = new Set([1, last, current - 1, current, current + 1].filter((p) => p >= 1 && p <= last));
  const sorted = [...pages].sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? [null, p] : [p]));
}

type Props = {
  statuses: BookingStatus[];
  meta: { current_page: number; last_page: number; total: number };
};

export function Pagination({ statuses, meta }: Props) {
  const { current_page: current, last_page: last } = meta;
  return (
    <nav className="pagination" aria-label="Pagination">
      <span className="muted">{meta.total} bookings</span>

      <div className="pages">
        {current > 1 ? (
          <Link href={bookingsHref(statuses, current - 1)} className="page-arrow" aria-label="Previous page">
            <CarIcon facing="left" />
          </Link>
        ) : (
          <span className="page-arrow" aria-disabled="true">
            <CarIcon facing="left" />
          </span>
        )}

        {pageWindow(current, last).map((p, i) =>
          p === null ? (
            <span key={`gap-${i}`} className="page-gap">
              …
            </span>
          ) : (
            <Link
              key={p}
              href={bookingsHref(statuses, p)}
              className="page-number"
              aria-current={p === current ? "page" : undefined}
            >
              {p}
            </Link>
          ),
        )}

        {current < last ? (
          <Link href={bookingsHref(statuses, current + 1)} className="page-arrow" aria-label="Next page">
            <CarIcon facing="right" />
          </Link>
        ) : (
          <span className="page-arrow" aria-disabled="true">
            <CarIcon facing="right" />
          </span>
        )}
      </div>
    </nav>
  );
}
