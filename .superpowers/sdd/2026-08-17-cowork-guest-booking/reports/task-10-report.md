# Task 10 Report — Guest booking: rebuild cowork-detail with SlotGrid + checkout

**Status:** DONE
**Commit:** (see git — `feat(frontend): cowork booking with slot grid + checkout`)
**Files changed:** `app/cowork-detail.tsx` (rebuilt), `hooks/cowork-store.ts` (range support + cancellationPolicy mapping)

## Changes

### `app/cowork-detail.tsx` (rebuilt, all Spanish UI)
1. **Detail fetch + skeleton** — `fetchSpaceDetail(spaceId, {from,to})` on mount for the current month; hero + `SkeletonCard` loading state; not-found state when `spaceId` absent or 404; error Alert with retry via re-fetch.
2. **SubSpace selector** — kept `SubSpaceCard`; added green "Instantáneo ✓" badge when `sub.instantBook`. Selecting resets billing (first unit), quantity, selection, hint.
3. **Billing chips** — kept `hour/day/week/month` chips with live per-unit price. Quantity stepper kept for `week`/`month`; hidden for `hour`/`day` where duration is derived from grid two-tap.
4. **Availability via SlotGrid** — seeded from the selected subspace's `availability` (or merged overlay in unified mode). `hour`/`day` = two-tap; `week`/`month` = horizontal date chips from available dates (start date, end = date+quantity). `onSuggest` → hint banner "Sugerimos {time}, que está disponible…" + pre-fill.
5. **Month change** — `onMonthChange` re-fetches detail for the new month range.
6. **Price summary + sticky CTA** — live `totalPrice = priceForBilling * quantity`, fixed bottom bar with "Reservar ahora".
   - instant → `createBooking` → payment handoff modal (Stripe PaymentSheet / MercadoPago) → success screen + `fetchGuestBookings()`.
   - request → `createBooking` → "Solicitud enviada / Sin cargo todavía, el anfitrión confirmará en 48h" screen + `fetchGuestBookings()`.
7. **409 slot_taken** — Alert "Ese horario ya no está disponible" + `suggestNextSlot` on the day's cells pre-selects the next free slot + silent re-fetch of the month.
8. **cancellationPolicy** — shown in the confirm modal when present.
9. **calendarMode** — `unified` overlays all active subspaces' availability into one grid (`mergeAvailability` union, available wins); `separate` uses the selected subspace's grid.
10. **Cleanup** — removed old `MONTHS`/`WEEKDAYS`/`HOURS` constants and the custom month-calendar + hour chips; removed `loadData`/`addBooking`/`getBookingsForSubSpace`/`isSlotAvailable` usage (legacy `addBooking` kept in store per contract; UI now uses `createBooking`).

### `hooks/cowork-store.ts` (minimal, backward-compatible)
- `fetchSpaceDetail(id, range?)` now accepts optional `{from,to}` appended to the URL. **Reason:** the backend `GET /api/spaces/:id` only computes `availability` when `?from&to` are supplied, otherwise it returns empty arrays — the store previously lacked range support (documented limitation in the brief). This is a frontend-only change; backend untouched.
- `subSpaceFromRow` now maps `cancellation_policy`/`cancellationPolicy` → `sub.cancellationPolicy` so the confirm-modal policy renders when the backend provides it.

## Payment handoff (mirrors app/payment.tsx; app/checkout.tsx is dead code)
- **Stripe:** `POST /api/spaces/pay/stripe/:bookingId` → `{clientSecret}` → `initPaymentSheet`/`presentPaymentSheet` (merchant "Club Sincrónica"). On success `fetchGuestBookings()` + confirmation. Canceled sheet keeps the modal open.
- **MercadoPago:** `POST /api/spaces/pay/mercadopago/:bookingId` → `{init_point, sandbox_init_point}`; `__DEV__` uses `sandbox_init_point`; opens via `WebBrowser.openBrowserAsync`; then `fetchGuestBookings()` + confirmation. `402 vendor_not_connected/expired` surfaces the backend Spanish message.

## calendarMode handling
`space.calendarMode === 'separate'` → selected subspace's own grid; otherwise `unified` overlay of all active subspaces (union, available > booked > blocked > closed). Billing/pricing stays per selected subspace in both modes.

## 409 handling
`handleBook` catches `ApiError.status === 409`, shows the required Alert, calls `applySuggestion(date, startTime)` which runs exported `suggestNextSlot(cells, preferredStart)` on that day and pre-selects it (hour: exact slot; day/week/month: that date), and silently re-fetches availability.

## Verification

### `npx tsc --noEmit`
Clean — 0 errors, exit 0. No errors in `app/cowork-detail.tsx` or `hooks/cowork-store.ts`.

### `npx expo lint`
Targeted on changed files: **clean** (no problems).
Full run: `✖ 290 problems (32 errors, 258 warnings)` — all pre-existing baseline across unrelated files (e.g. TicketWallet, UserProfileView, SmartIcons); none in files touched by this task.

### Manual smoke
Not performed on device (no device/tunnel available in this environment). UI strings are Spanish per brief.

## Store range-support note (for Task 11)
`fetchSpaceDetail(id, range?)` added because the backend only returns availability for ranged requests. Task 11 (host/owner side or any other availability consumer) should pass `{from,to}` (or reuse the same range pattern) whenever a grid needs data; a bare `fetchSpaceDetail(id)` still works (returns detail without availability).

## Concerns
- Hour-range `quantity` is rounded to whole hours and clamped to 1..31 because backend validation requires `quantity` int 1..31; sub-hour (30-min granularity) selections price as 1h min.
- Cross-midnight hour ranges are normalized to `start + quantity` within-day times (same limitation as the old UI).
- Stripe sheet requires a publishable key (`stripePublishableKey`/`EXPO_PUBLIC_STRIPE_KEY`); with none configured it fails gracefully at runtime, same as `app/payment.tsx`.
- Closing the pay modal without paying leaves the booking in `held` status; a "pay later" confirmation screen was intentionally out of scope.
- `cancellationPolicy` only displays when the backend returns it (mapping added; backend never populates it today).

---

# Fix round 1

**Commit:** `feat(frontend): cowork-detail fix round 1` (new commit on top)
**Files changed:** `app/cowork-detail.tsx` only (backend untouched).

## CRITICAL — MP false-success confirmation (`handlePayMercadoPago`)

- **Chosen strategy (documented):** `WebBrowser.openBrowserAsync` cannot report the payment outcome for a hosted MP checkout — it only returns `CANCEL`/`DISMISS`/`OPENED`/`LOCKED`, never `SUCCESS`, and the checkout redirects to `back_urls` we do not deep-link. There is no per-booking status endpoint exposed to guests (only `GET /api/spaces/bookings/guest`). The source of truth is therefore the backend: the MP webhook (`backend/src/routes/webhooks.ts`) → `updateTransactionStatus` (`backend/src/models/transaction.ts`) flips the booking to `confirmed`/`paid` for space bookings. **So we verify server-side after the browser returns and only show success when the backend confirms; otherwise the pay state closes and a neutral notice is shown, keeping the booking held.**
- `app/cowork-detail.tsx:406` — handler now captures `result = await WebBrowser.openBrowserAsync(url)`, checks `result.type` for `CANCEL`/`DISMISS` (user abandoned), then calls `isBookingPaid(bookingId)`.
- `app/cowork-detail.tsx:467` — `isBookingPaid` re-fetches `fetchGuestBookings()` and returns `found.status === 'confirmed'` (the webhook only sets `confirmed` alongside `paid` for space bookings; the frontend `PaymentStatus` union doesn't include `paid`, so `status` is the type-safe proxy). On any fetch failure it returns `false` (conservative: booking stays held, cancellable from Mis reservas).
- On verified paid → `finishInstant()` success screen. On not-paid → `setPendingPayment(null)` + `payNotice` banner ("El pago no se completó. Podrás pagar desde Mis reservas." / "No pudimos confirmar el pago…"). Booking stays held.

## IMPORTANT — Day billing uses the simple date picker

- `app/cowork-detail.tsx:252` — `showGrid` is now `selectedBilling === 'hour'` only; day/week/month use the date-chips UI (the non-grid branch already rendered for `!showGrid`).
- `app/cowork-detail.tsx:278-291` — the non-hour `bookingDraft` now covers `day` too: `quantity` from the stepper, `startTime '00:00'`, `endTime '23:59'`, `endDate = addDays(start,q)` / `addDays(start,q*7)` / `addMonths(start,q)`. The grid-derived day quantity (two-tap) was removed.
- `app/cowork-detail.tsx:322,337` — date-chip and suggestion selection use `time: '00:00'` (was `'09:00'`), matching the booked draft.

## IMPORTANT — Network error vs not-found + retry

- `app/cowork-detail.tsx:151,179,184,193` — new `loadError` state. In `loadDetail`, 404 (mapped to `null` inside `fetchSpaceDetail`) → `notFound`; any thrown error (network/server) → `loadError` (`notFound` cleared).
- `app/cowork-detail.tsx:556-572` — distinct error view "No se pudo cargar el espacio" with a **Reintentar** button calling `loadDetail(visibleMonth)`. The transient `Alert.alert('Error', 'No se pudo cargar…')` was removed; the not-found view ("Espacio no encontrado", Volver) is preserved for actual 404s.

## Cheap minors

- `app/cowork-detail.tsx:268-269` — hour quantity clamp respects `sub.maxDuration`: `hourCap = min(31, sub.maxDuration || 8)` (matches store default `max_duration ?? 8`, never exceeding the backend 31-max).
- `app/cowork-detail.tsx:224,857` — modal "Instantáneo" row now reads `isInstantBook` (derived from `selectedSubSpace?.instantBook`), the same column the backend uses to compute `mode` in `/checkout` (`sub.instant_book`), so the confirm-modal label and the pay-handoff flow (which keys on the server `result.mode`) can't disagree.

## Verification

- `npx tsc --noEmit` → **clean, exit 0** (one transient `TS2367` on `paymentStatus === 'paid'` resolved by switching to `status === 'confirmed'`).
- `npx expo lint app/cowork-detail.tsx` → **clean, no problems**.
- Backend untouched; no server tests needed.

## Concerns (fix round 1)

- MP verification depends on the webhook having landed by the time `isBookingPaid` runs; if the webhook is delayed after a real payment, the user may see the neutral notice while the payment actually went through (booking still flips to confirmed/paid in Mis reservas via the webhook — no false success, but possible false "not completed" in a narrow race). Acceptable given no per-booking guest status endpoint; a future `GET /api/spaces/bookings/:id` would close the gap.
- `WebBrowser` on iOS may return `CANCEL` when the user taps "Done" even after a real payment; the server-side check handles that correctly.
