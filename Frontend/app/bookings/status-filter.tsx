"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { bookingsHref, STATUSES, type BookingStatus } from "@/lib/booking-types";

export function StatusFilter({ selected }: { selected: BookingStatus[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(selected);

  function navigate(next: BookingStatus[]) {
    startTransition(() => {
      setOptimistic(next);
      router.push(bookingsHref(next));
    });
  }

  function toggle(status: BookingStatus, checked: boolean) {
    navigate(STATUSES.filter((s) => (s === status ? checked : optimistic.includes(s))));
  }

  return (
    <fieldset className="filters" aria-busy={pending}>
      <legend className="sr-only">Filter by status</legend>
      <label>
        <input type="checkbox" checked={optimistic.length === 0} onChange={() => navigate([])} />
        All
      </label>
      {STATUSES.map((s) => (
        <label key={s}>
          <input type="checkbox" checked={optimistic.includes(s)} onChange={(e) => toggle(s, e.target.checked)} />
          {s}
        </label>
      ))}
    </fieldset>
  );
}
