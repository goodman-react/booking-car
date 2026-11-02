"use client";

import Link from "next/link";

export default function BookingsError({ error, retry }: { error: unknown; retry: () => void }) {
  const digest = error instanceof Error && "digest" in error ? String(error.digest) : undefined;

  return (
    <main>
      <h1>Something went wrong</h1>
      <p>We couldn&apos;t load this page. The bookings service may be unavailable.</p>
      {digest && <p className="muted">Reference: {digest}</p>}
      <div className="actions">
        <button onClick={() => retry()}>Try again</button>
        <Link href="/bookings">Back to bookings</Link>
      </div>
    </main>
  );
}
