# Task 5 Report — spaces API routes (CRUD, listing, availability, bookings)

## Status: DONE

## What changed
- Created `backend/src/routes/spaces.ts` (new) — all spaces/subspace/booking routes.
- Modified `backend/src/middleware/validation.ts` — added `validateSpaceBooking` (exact block from brief).
- Modified `backend/src/server.ts` — import `spacesRoutes` + mount `app.use('/api/spaces', spacesRoutes)` after reservations mount.
- Created `backend/src/__tests__/spaces-routes.test.ts` (new) — route-level tests via mocked models + `mockRequest`/`mockResponse` from `./helpers`.

Commit: `ce6872f` — "feat(backend): spaces API (CRUD, listing, availability, bookings)"

## Routes implemented (all in spaces.ts)
- `GET /` — public; `getPublishedSpaces({type, capacity, maxHourlyPrice})`, query parsed to numbers.
- `GET /:id` — public for published; owner/admin see own unpublished; 404 otherwise; `from`/`to` optional; `buildDayList` caps at 62 entries; availability via `cellStates` only when both `from` and `to` present (per brief).
- `POST /` (auth) → 201 `{id, message}`; `createSpace` with `ownerId: req.user.userId`.
- `PUT /:id` (auth, owner) → `{message}`.
- `DELETE /:id` (auth, owner) → `{message}`.
- `POST /:id/subspaces` (auth, owner) → 201 `{id, message}`.
- `PUT /:id/subspaces/:sid` (auth, owner) → `{message}`.
- `DELETE /:id/subspaces/:sid` (auth, owner) → `{message}`.
- `POST /checkout` (auth, `validateSpaceBooking`, `handleValidationErrors`) → validates subspace exists+active and parent space published; `findOverlappingBooking` → 409 `{error:'slot_taken', nextAvailable}` (nextAvailable computed from `cellStates`+`nextAvailable`); else `createSpaceBooking` with `status:'pending'`, `mode: sub.instant_book?'instant':'request'`, `paymentStatus: sub.instant_book?'held':'pending'`, returns 201 `{bookingId, mode, totalPrice}`. Payment/charge wiring left to Task 6; logic lives in spaces.ts as instructed.
- `GET /bookings/owner` (auth) → `getBookingsForOwner(req.user.userId)`.
- `GET /bookings/guest` (auth) → `getBookingsForGuest(req.user.userId)`.
- `PUT /bookings/:id/status` (auth) — `approved|declined` requires booking's subspace→space owner (or admin); `cancelled` allowed for owner/admin or the booking's `user_id`; otherwise 403; reuses `updateSpaceBookingStatus`.
- Ownership helper inline `isOwner = (space, req) => space.owner_id === req.user.userId || req.user.role === 'admin'`.
- Route ordering: parameterized routes placed after static ones so `/checkout`, `/bookings/owner`, `/bookings/guest`, `/bookings/:id/status` cannot be swallowed by `/:id`.

## Test command + output tail
Workdir: `<worktree>\backend`

```
> jest spaces-routes.test
Test Suites: 1 passed, 1 total
Tests:       18 passed, 18 total
Snapshots:   0 total
Time:        18.775 s
```

Coverage includes the brief's minimum (guest listing published-only; owner PUT/DELETE 403 for non-owner; checkout 409 on overlap; checkout 201 with mode from `instant_book`; GET /:id 404 for unpublished non-owner) plus availability enrichment, owner-sees-unpublished, subspace owner checks, bookings owner/guest, and status-route owner/guest authorization.

Regression check: `space.test`, `space-booking.test`, `availability.test`, `spaces-routes.test` → 4 suites, 48 tests all pass.

Typecheck: `npx tsc -p tsconfig.backend.json --noEmit` → clean (no output).

## Deviations
- None material. The brief's `GET /:id` block was used essentially verbatim (safeJson/business-hours + day-cap 62). Checkout follows the dispatch note: returns `{bookingId, mode, totalPrice}` at 201 (brief interfaces list `{bookingId, mode}`; the fuller payload is additive).
- `POST /` defaults `title` to `'Untitled space'` when missing (brief didn't specify a validation chain for create space).
- Tests drive handlers directly via `router.stack` layer lookup (last handle per method+path) with `mockRequest`/`mockResponse`, skipping auth/validation middleware — matches the repo's non-HTTP harness. Mocks use `as any`; no `jest.Mock` typing (repo's globals.d.ts declares `jest: any`).

## Cross-task notes for reviewer
- checkout uses `computeBookingPrice(sub, billingUnit, quantity)` where `sub` is the `SubSpaceRow` (snake_case `price_hour/...`) — matches `computeBookingPrice` in space-booking.ts.
- `payment_status` values: `instant` → `held`, `request` → `pending`; status always `pending`. Task 6 refines payment wiring.

## Fix round 1 (review: cross-tenant subspace injection)

Finding: `createSubSpace({ spaceId, ...req.body })` let a client-supplied `body.spaceId` override the URL param that passed the owner check, allowing an owner to inject a subspace into another owner's space.

### What changed
- `backend/src/routes/spaces.ts:149` — destructure `spaceId`/`space_id` out of `req.body` before spreading: `const { spaceId: _ignoredSpaceId, space_id: _ignoredSpaceIdSnake, ...subspaceBody } = req.body;` then `createSubSpace({ spaceId, ...subspaceBody })`. URL param always wins.
- `backend/src/__tests__/spaces-routes.test.ts` — added test `POST /api/spaces/:id/subspaces > ignores a body.spaceId that differs from the URL param` asserting `createSubSpace` receives the URL spaceId (1) and not body.spaceId (99); also covers snake_case `space_id`.

### Test command + output tail
Workdir: `<worktree>\backend`

```
> jest spaces-routes.test
Test Suites: 1 passed, 1 total
Tests:       19 passed, 19 total
Snapshots:   0 total
Time:        18.173 s
Ran all test suites matching spaces-routes.test.
```

Typecheck: `npx tsc -p tsconfig.backend.json --noEmit` → clean.