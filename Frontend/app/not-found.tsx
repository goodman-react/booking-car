import Link from "next/link";

export default function NotFound() {
  return (
    <main>
      <h1>Page not found</h1>
      <p>The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/bookings">Go to bookings</Link>
    </main>
  );
}
