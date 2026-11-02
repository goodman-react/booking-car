"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import type { BookingInput } from "@/lib/booking-types";
import { api, BOOKINGS_TAG } from "@/lib/bookings";

export type FormState = {
  errors: Partial<Record<keyof BookingInput, string[]>>;
  message?: string;
  values?: BookingInput;
};

function readForm(formData: FormData): BookingInput {
  const get = (key: string) => String(formData.get(key) ?? "");

  return {
    customer_name: get("customer_name"),
    customer_email: get("customer_email"),
    rego: get("rego"),
    service_bay: get("service_bay"),
    starts_at: get("starts_at"),
    ends_at: get("ends_at"),
    status: get("status") as BookingInput["status"],
    notes: get("notes"),
  };
}

async function save(
  method: "POST" | "PUT",
  path: string,
  formData: FormData,
): Promise<{ state: FormState } | { id: number }> {
  const values = readForm(formData);
  const body = JSON.stringify({ ...values, notes: values.notes || null });

  let res: Response;
  try {
    res = await api(path, { method, body });
  } catch {
    return { state: { errors: {}, values, message: "Could not reach the bookings service. Try again." } };
  }

  if (res.status === 422) {
    const json = await res.json().catch(() => ({}));
    return { state: { errors: json.errors ?? {}, values, message: "Please fix the highlighted fields." } };
  }

  if (!res.ok) {
    return { state: { errors: {}, values, message: `Saving failed (HTTP ${res.status}).` } };
  }

  updateTag(BOOKINGS_TAG);
  return { id: ((await res.json()) as { data: { id: number } }).data.id };
}

export async function createBooking(_prev: FormState, formData: FormData): Promise<FormState> {
  const result = await save("POST", "/bookings", formData);
  if ("state" in result) return result.state;

  redirect(`/bookings/${result.id}`);
}

export async function updateBooking(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  const result = await save("PUT", `/bookings/${id}`, formData);
  if ("state" in result) return result.state;

  redirect(`/bookings/${id}`);
}

export async function deleteBooking(id: number, returnTo: unknown): Promise<string | null> {
  let res: Response;
  try {
    res = await api(`/bookings/${id}`, { method: "DELETE" });
  } catch {
    return "Could not reach the bookings service. Try again.";
  }

  if (!res.ok && res.status !== 404) return `Deleting failed (HTTP ${res.status}).`;

  updateTag(BOOKINGS_TAG);
  redirect(typeof returnTo === "string" && returnTo.startsWith("/bookings") ? returnTo : "/bookings");
}
