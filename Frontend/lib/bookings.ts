import { cacheLife, cacheTag } from "next/cache";
import type { Booking, BookingStatus, Paginated } from "./booking-types";

export const API_URL = process.env.API_URL ?? "http://127.0.0.1:8000/api";
// Every booking read is tagged with this; every write expires it.
export const BOOKINGS_TAG = "bookings";

export function api(path: string, init: RequestInit = {}) {
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: { Accept: "application/json", "Content-Type": "application/json", ...init.headers },
  });
}

export async function getBookings(statuses: BookingStatus[], page: number) {
  "use cache";
  cacheTag(BOOKINGS_TAG);
  cacheLife({ stale: 30, revalidate: 30, expire: 300 });

  const query = new URLSearchParams({ page: String(page) });
  if (statuses.length > 0) query.set("status", statuses.join(","));
  const res = await api(`/bookings?${query}`);
  if (!res.ok) throw new Error(`Failed to load bookings (HTTP ${res.status})`);

  return (await res.json()) as Paginated<Booking>;
}

export async function getBooking(id: string) {
  "use cache";
  cacheTag(BOOKINGS_TAG);
  cacheLife({ stale: 30, revalidate: 30, expire: 300 });

  const res = await api(`/bookings/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to load booking ${id} (HTTP ${res.status})`);

  return ((await res.json()) as { data: Booking }).data;
}
