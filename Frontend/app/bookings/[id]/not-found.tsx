import Link from "next/link";

export default function BookingNotFound() {
  return (
    <main>
      <h1>Booking not found</h1>
      <p>It may have been deleted, or the link is wrong.</p>
      <Link href="/bookings">Back to bookings</Link>
    </main>
  );
}
