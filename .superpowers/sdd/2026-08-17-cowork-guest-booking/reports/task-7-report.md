# Task 7 Report — Frontend types + API-backed cowork-store

Status: DONE_WITH_CONCERNS
Commit: 391bbc7

## What changed

### `types/user.ts`
- Added exported `SlotCell` (`{ date, start, end, state: 'available'|'booked'|'blocked'|'closed' }`), `BusinessHoursEntry` (`{ day, start, end }`), and `CoWorkAvailability` (`Array<{ date, cells: SlotCell[] }>`).
- Extended `SubSpace` with optional `instantBook`, `businessHours` (`Record<day,{start,end}> | BusinessHoursEntry[]`), `slotGranularity`, `minAdvance`, `maxDuration`, `cancellationPolicy`, `guestName`, and `availability?: CoWorkAvailability`.
- Extended `SpaceBooking` with optional `mode` ('instant'|'request'), `paymentProvider`, `paymentId`, `guestName`.

### `hooks/cowork-store.ts` (rebuild)
- Same Zustand shape (`spaces[]`, `bookings[]`, `isLoading`, `error`) and AsyncStorage key `cowork_store_v1` preserved.
- **loadData()**: reads cache first (serves state instantly), then `GET /api/spaces` (published) and merges into cached spaces without losing locally-known subspaces (the list endpoint returns no subspaces). In `__DEV__`, if the API is unreachable (network error) **or** returns empty **and** there is no cached data, seeds the existing demo space (`Galería de Arte Ivana`, `isPublished: true`) as a **local-only** entry — it is NOT POSTed to the API.
- Mutators call `apiFetch` and write-through to AsyncStorage on success. In `__DEV__` we fall back to local-only caching on network errors (and 404s for owner CRUD) so existing demo flows keep working offline; production rethrows so real errors surface.
- **ID normalization**: backend returns numeric ids; all are converted to `string` when cached (`toStr`), so `getSpaceById(id)`/slash routes stay consistent.
- **businessHours normalization**: `normalizeBusinessHours` converts the frontend shape to the array `[{day,start,end}]` whenever POSTing/PUTing subspaces.
- **Price field mapping**: frontend `pricePerHour`→body `priceHour` etc. for subspaces (backend model uses `priceHour` keys).
- Keeps every legacy public method with the same signatures: `loadData`, `addSpace`→id, `updateSpace`, `deleteSpace`, `getSpaceById`, `getSpacesByOwnerId`, `publishSpace`, `addSubSpace`→id, `updateSubSpace`, `deleteSubSpace`, `addBooking`, `updateBookingStatus`, `getBookingsForSubSpace`, `getBookingsForSpace`, `getBookingsForUser`, `isSlotAvailable`.
- `addBooking` (legacy, used by cowork-detail until Task 10) now creates a **local-only** booking entry (no API).
- New methods added:
  - `fetchPublishedSpaces(filters?: {type, capacity, maxHourlyPrice}) => Promise<CoWorkSpace[]>`
  - `fetchSpaceDetail(id) => Promise<CoWorkSpace | null>` (returns `null` on 404)
  - `fetchGuestBookings() => Promise<SpaceBooking[]>`
  - `fetchOwnerBookings() => Promise<SpaceBooking[]>`
  - `createBooking(input) => Promise<{ bookingId: number; mode: string; totalPrice: number }>` — POST `/api/spaces/checkout`; throws `ApiError` with `.status` (409 `slot_taken`) so callers can read `nextAvailable`.
  - `updateBookingStatus(id, status)` now API-backed (PUT `/api/spaces/bookings/:id/status`); `confirmed`→`approved` mapping for the API, `approved`/`declined`→`confirmed`/`cancelled` when mirrored to cache.
- Exported `SpaceFilters`, `CreateBookingInput`, `CheckoutResult`, and re-exports `SlotCell`, `CoWorkAvailability`, `BusinessHoursEntry`.
- Rows from the backend (snake_case) are mapped to camelCase via `spaceFromRow`/`subSpaceFromRow`/`bookingFromRow`.

## Verification
- `npx tsc --noEmit` → **exit 0, no errors**.
- `npx expo lint` → 0 errors/warnings for `types/user.ts` and `hooks/cowork-store.ts`. (Repo-wide lint has 32 pre-existing errors / 269 warnings in unrelated files — not touched.)
- Grepped consumers; all method names match:
  - `mis-espacios.tsx`: spaces, loadData, isLoading, publishSpace, deleteSpace
  - `manage-space.tsx`: getSpaceById, getBookingsForSpace, deleteSubSpace, updateSubSpace, loadData
  - `cowork-detail.tsx`: getSpaceById, getBookingsForSubSpace, addBooking, isSlotAvailable, loadData
  - `add-space.tsx` / `add-subspace.tsx`: addSpace/updateSpace, addSubSpace/updateSubSpace intact.

## Deviations / concerns
1. **Owner unpublished spaces on fresh device**: there is no public "list owner spaces incl. unpublished" endpoint. `GET /api/spaces` returns only published. A fresh device therefore sees only published + locally-created spaces; an owner's previously-created unpublished spaces won't appear until opened directly or published. Documented; `GET /api/spaces/:id` still returns the owner's own unpublished for detail. (Per dispatch design guidance.)
2. **`updateBookingStatus` status vocabulary**: backend accepts `approved|declined|cancelled`; legacy store used `pending|confirmed|cancelled`. Typed as `SpaceBooking['status'] | 'approved' | 'declined'` and mapped. Existing consumers don't call it yet (Task 10 will).
3. **`SubSpace.availability`** added although brief's Step 1 list omits it — required to hold `fetchSpaceDetail` output.
4. `__DEV__` fallback on 404 for owner CRUD can mask a genuinely-deleted remote space in dev; production behavior is strict (rethrows).

## New public store signatures (for later tasks)
```ts
fetchPublishedSpaces(filters?: SpaceFilters): Promise<CoWorkSpace[]>
fetchSpaceDetail(id: string): Promise<CoWorkSpace | null>
fetchGuestBookings(): Promise<SpaceBooking[]>
fetchOwnerBookings(): Promise<SpaceBooking[]>
createBooking(input: CreateBookingInput): Promise<{ bookingId: number; mode: string; totalPrice: number }>
updateBookingStatus(bookingId: string, status: 'pending'|'confirmed'|'cancelled'|'approved'|'declined'): Promise<void>
```

## Fix round 1 — owner unpublished spaces endpoint + store wiring

Closes the "fetch owner spaces" gap: `GET /api/spaces/owner` (published AND unpublished) plus store wiring so `mis-espacios.tsx` sees the owner's drafts on a fresh device.

### Changes per file
- **`backend/src/routes/spaces.ts:58-67`** — new `router.get('/owner', authenticateJWT, ...)` calling `SpaceModel.getSpacesByOwner(req.user.userId)`. Registered **before** `GET /:id` (line 70) so the single-segment `/owner` is not shadowed by the param route (Express first-match wins for GET `/owner`).
- **`backend/src/__tests__/spaces-routes.test.ts`** — new `describe('GET /api/spaces/owner', ...)` at line 104 with 3 tests: (a) handler calls `getSpacesByOwner` with `req.user.userId` and returns the array; (b) *real-dispatch* shadowing regression via `express` + `supertest` — with `getSpaceById` mocked to `undefined` (would 404) and a valid JWT (`generateTestToken`), `GET /api/spaces/owner` returns 200 with the owner rows and `getSpaceById` is never called; (c) no token → 401. Added `express`/`supertest` imports and `generateTestToken` to the helpers import (line 2, 7).
- **`hooks/cowork-store.ts`** — `fetchOwnerSpaces(): Promise<CoWorkSpace[]>` added to the `CoWorkStore` interface (line 59) and implemented (lines 398-406): GET `/api/spaces/owner`, maps rows via existing `spaceFromRow`, merges into `spaces[]` with the existing `mergeCachedInto` (keeps richer cached/detail subspace copies), writes through to cache, returns the mapped rows. `loadData()` now also pulls owner spaces when a user is signed in (lines 355-364): reads the persisted `currentUser` from AsyncStorage (same key as `hooks/user-store.ts`) and, when `owner.id` exists, awaits `get().fetchOwnerSpaces()`; wrapped in its own try/catch so offline/unauth failures are non-fatal. Demo seed behavior (`__DEV__` + empty) unchanged.

### Verification
- Backend: `npm test -- spaces-routes.test` → **Test Suites: 1 passed, 1 total; Tests: 22 passed, 22 total** (9.949 s). (3 new owner tests pass; all pre-existing stay green.)
- Frontend: `npx tsc --noEmit` → **exit 0, no errors**.
- `npx expo lint` → **0 findings in `hooks/cowork-store.ts` and `types/user.ts`**; repo-wide baseline unchanged at 32 pre-existing errors / 269 warnings in unrelated files.

### Fix-round concerns
- Store reads the signed-in user from AsyncStorage key `currentUser` (mirrors `hooks/user-store.ts` persistence) because `cowork-store.ts` is a plain Zustand module and cannot call the React `useUser()` hook.
- `/owner` only returns the caller's own spaces; `getSpacesByOwnerId` filtering in `mis-espacios.tsx` relies on row `owner_id` mapping, which `spaceFromRow` already handles.