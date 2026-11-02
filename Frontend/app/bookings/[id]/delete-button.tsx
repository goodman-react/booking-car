"use client";

import { useActionState, useId, useRef } from "react";
import { TrashIcon } from "../icons";

type Props = { action: () => Promise<string | null>; iconOnly?: boolean };

export function DeleteButton({ action, iconOnly = false }: Props) {
  const [message, formAction, pending] = useActionState(action, null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const label = pending ? "Deleting…" : "Delete";
  const open = () => dialogRef.current?.showModal();
  const close = () => dialogRef.current?.close();

  return (
    <form action={formAction} className="delete-form">
      {iconOnly ? (
        <button type="button" className="danger icon-button" disabled={pending} aria-label={label} title={label} onClick={open}>
          <TrashIcon />
        </button>
      ) : (
        <button type="button" className="danger" disabled={pending} onClick={open}>
          {label}
        </button>
      )}
      <dialog
        ref={dialogRef}
        className="confirm-dialog"
        aria-labelledby={titleId}
        onCancel={(e) => pending && e.preventDefault()}
        // The dialog has no padding, so only clicks on the backdrop target it directly.
        onClick={(e) => e.target === e.currentTarget && !pending && close()}
      >
        <div className="confirm-dialog-body">
          <h2 id={titleId}>Delete this booking?</h2>
          <p>This can&apos;t be undone.</p>
          {message && (
            <p className="form-message" role="alert">
              {message}
            </p>
          )}
          <div className="confirm-dialog-actions">
            <button type="button" className="secondary" disabled={pending} onClick={close} autoFocus>
              Cancel
            </button>
            <button type="submit" className="danger solid" disabled={pending}>
              {pending ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </dialog>
    </form>
  );
}
