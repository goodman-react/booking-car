import type { BookingStatus } from "@/lib/booking-types";

export function StatusBadge({ status }: { status: BookingStatus }) {
  return <span className={`badge badge-${status}`}>{status}</span>;
}
