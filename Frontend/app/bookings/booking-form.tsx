"use client";

import Link from "next/link";
import { useActionState } from "react";
import { STATUSES, type Booking, type BookingInput } from "@/lib/booking-types";
import type { FormState } from "./actions";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  booking?: Booking;
  submitLabel: string;
  cancelHref: string;
};

export function BookingForm({ action, booking, submitLabel, cancelHref }: Props) {
  const [state, formAction, pending] = useActionState(action, { errors: {} });

  const value = (field: keyof BookingInput) =>
    state.values?.[field] ?? (booking ? String(booking[field] ?? "") : "");

  const error = (field: keyof BookingInput) =>
    state.errors[field]?.map((message) => (
      <p key={message} className="field-error" id={`${field}-error`}>
        {message}
      </p>
    ));

  const invalid = (field: keyof BookingInput) =>
    state.errors[field] ? { "aria-invalid": true, "aria-describedby": `${field}-error` } : {};

  return (
    <form action={formAction} noValidate className="form">
      {state.message && (
        <p className="form-message" role="alert">
          {state.message}
        </p>
      )}

      <label>
        Customer name
        <input name="customer_name" defaultValue={value("customer_name")} {...invalid("customer_name")} />
        {error("customer_name")}
      </label>

      <label>
        Customer email
        <input
          name="customer_email"
          type="email"
          defaultValue={value("customer_email")}
          {...invalid("customer_email")}
        />
        {error("customer_email")}
      </label>

      <div className="row">
        <label>
          Rego
          <input name="rego" defaultValue={value("rego")} {...invalid("rego")} />
          {error("rego")}
        </label>

        <label>
          Service bay
          <input
            name="service_bay"
            type="number"
            min={1}
            defaultValue={value("service_bay")}
            {...invalid("service_bay")}
          />
          {error("service_bay")}
        </label>
      </div>

      <div className="row">
        <label>
          Starts
          <input
            name="starts_at"
            type="datetime-local"
            step={900}
            defaultValue={value("starts_at")}
            {...invalid("starts_at")}
          />
          {error("starts_at")}
        </label>

        <label>
          Ends
          <input
            name="ends_at"
            type="datetime-local"
            step={900}
            defaultValue={value("ends_at")}
            {...invalid("ends_at")}
          />
          {error("ends_at")}
        </label>
      </div>

      <label>
        Status
        <select name="status" defaultValue={value("status") || "pending"} {...invalid("status")}>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        {error("status")}
      </label>

      <label>
        Notes
        <textarea name="notes" rows={3} defaultValue={value("notes")} {...invalid("notes")} />
        {error("notes")}
      </label>

      <div className="actions">
        <button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </button>
        <Link href={cancelHref} className="button secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}
