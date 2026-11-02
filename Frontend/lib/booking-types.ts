export const STATUSES = ["pending", "confirmed", "cancelled"] as const;
export type BookingStatus = (typeof STATUSES)[number];

export type Booking = {
  id: number;
  customer_name: string;
  customer_email: string;
  rego: string;
  service_bay: number;
  starts_at: string;
  ends_at: string;
  status: BookingStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type BookingInput = Pick<
  Booking,
  "customer_name" | "customer_email" | "rego" | "starts_at" | "ends_at" | "status"
> & { service_bay: string; notes: string };

export type Paginated<T> = {
  data: T[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
};

export function isStatus(value: unknown): value is BookingStatus {
  return STATUSES.includes(value as BookingStatus);
}

// Parses ?status=pending,confirmed into a de-duplicated list in canonical order.
export function parseStatuses(value: unknown): BookingStatus[] {
  const raw = (Array.isArray(value) ? value : [value]).flatMap((v) => String(v ?? "").split(","));
  return STATUSES.filter((s) => raw.includes(s));
}

export function bookingsHref(statuses: BookingStatus[], page = 1) {
  const query = new URLSearchParams();
  if (statuses.length > 0) query.set("status", statuses.join(","));
  if (page > 1) query.set("page", String(page));
  const qs = query.toString();
  return qs ? `/bookings?${qs}` : "/bookings";
}

// API times are the dealer's wall-clock time with no offset, so format them as-is.
const dateTime = new Intl.DateTimeFormat("en-AU", {
  timeZone: "UTC",
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatDateTime(value: string) {
  return dateTime.format(new Date(`${value}:00Z`));
}
