# Workshop bookings

Service-bay bookings for a caravan dealer. `api/` is Laravel 12 (SQLite), `web/` is Next.js 16 (App Router, TypeScript).

## Running it

```bash
# API: http://127.0.0.1:8000
cd api
composer install
cp .env.example .env && php artisan key:generate
php artisan migrate --seed      # offers to create database/database.sqlite
php artisan serve
php artisan test                # Pest

# Frontend: http://localhost:3000
cd web
npm install
npm run dev                     # API_URL defaults to http://127.0.0.1:8000/api
```

Times are the dealer's local wall-clock time (no offset). The number of bays is `SERVICE_BAYS` (default 4).

## Write-up

**Caching and revalidation.** Reads go through two `'use cache'` functions (`web/lib/bookings.ts`) tagged `bookings`, with a 30s lifetime. Every write action calls `updateTag('bookings')` and then redirects client-side, so the user sees their change immediately without a reload. One coarse tag is deliberate: any write can change a filtered page's rows, order and page count, so per-booking tags save nothing. The short lifetime covers writers Next never hears about (other staff, API clients). Correctness never depends on the cache, since Laravel re-checks every write. Next calls Laravel server-side only, so the API isn't exposed to the browser.

**Two simultaneous bookings.** The Form Request checks for overlap to give a precise error on `starts_at`, but on its own that check races. The guarantee is a SQLite `BEFORE INSERT/UPDATE` trigger that aborts with `booking_overlap`. SQLite has a single writer (WAL, `IMMEDIATE` transactions, `busy_timeout` so the second request waits), so the trigger's check and the write are atomic. The controller turns the loser's exception into the same 422, and a Pest test reproduces the race. On Postgres this becomes an `EXCLUDE USING gist` constraint on bay and time range, excluding cancelled bookings.

**For a 200-dealer platform, I'd change first:**
1. **Tenancy:** `dealer_id`, a `service_bays` table, tenant scopes, and auth with policies (there's none today).
2. **Postgres** with the exclusion constraint, replacing SQLite's single writer.
3. **Tenant-scoped cache tags** (`bookings:{dealerId}`) in a shared cache store, with Laravel calling a revalidation webhook on writes.

## AI usage

I used **Cursor** (AI coding assistant) only for testing: drafting Pest test cases and checking edge cases for the overlap rule. The application code, the database design and the write-up are my own.

**Where the AI got it wrong.** For "two people book the same slot at the same moment", the AI's first test just sent two identical POST requests one after the other and asserted the second got a 422. That test passes even with the database trigger deleted, because the second request is caught by the Form Request's validation, so it never touches the concurrency guarantee. I rewrote it as two tests: one that inserts directly with `DB::table()->insert()` to prove the trigger rejects an overlap on its own, and one that uses a `Booking::creating` hook to commit a conflicting row *between* validation and insert, simulating the losing side of a real race. That one asserts the API still returns a 422 on `starts_at` and that only the winner's row exists.



