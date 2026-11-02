"use client";

import "./globals.css";

export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  const digest = error instanceof Error && "digest" in error ? String(error.digest) : undefined;

  return (
    <html lang="en">
      <body>
        <main>
          <h1>Something went wrong</h1>
          <p>The app failed to load. Try again in a moment.</p>
          {digest && <p className="muted">Reference: {digest}</p>}
          <div className="actions">
            <button onClick={() => retry()}>Try again</button>
          </div>
        </main>
      </body>
    </html>
  );
}
