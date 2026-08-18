# Co-Work E2E Checklist

## Setup

1. Ensure backend is running with `DATABASE_URL` set (Postgres).
2. Ensure frontend (`expo start`) can load the cowork flow.
3. Run `npx tsc --noEmit` — must pass with **0 errors**.
4. Run `npx expo lint` on changed frontend files — must be clean (baseline warnings only).

## Guest Flow (20 tests)

| Step | Description |
|------|-------------|
| 1 | Guest taps **+** on discover page → `add-space.tsx` opens |
| 2 | Guest adds **≥3 images** via ImageUploader (add-space:4) |
| 3 | Guest sets **businessHours** (Lun-Vie 09-22, Sáb 10-18, Dom off) |
| 4 | Guest toggles **instant_book** on/off |
| 5 | Guest selects **subspace** and sets **price** per billing unit (hour/day/week/month) |
| 6 | Guest sets **slotGranularity** (15/30/60 min) and **minAdvance** (default 120) / **maxDuration** (default 8) |
| 7 | Guest submits → publish gate validates **≥3 images** + **≥1 active subspace** with price + businessHours set |
| 8 | If gate fails, **checklist** shows which items are missing |
| 9 | Booking appears as **request** mode (if instant_book=false) or **confirmed** (if instant_book=true) |
| 10 | Guest receives notification; owner sees pending request in Solicitudes tab |

**Edge/negative cases:**
- < 3 images → publish disabled; checklist shows "Add at least 3 images"
- No price set → inline validation: "Set a price for this subspace"
- No businessHours set → publish disabled; checklist shows "Set business hours"
- Overlapping slots → backend rejects (see `space-double-book.test.ts`); UI shows slot_taken error
- Different-slot bookings → allowed (different time slots in same subspace)

## Owner Flow (15 tests)

| Step | Description |
|------|-------------|
| 1 | Owner views space → sees **Solicitudes** tab with pending request-mode bookings |
| 2 | Owner taps **Accept** → `updateBookingStatus(id, 'confirmed')` → booking flips to confirmed+paid |
| 3 | Owner taps **Decline** → `updateBookingStatus(id, 'cancelled')` → booking flips to cancelled+refunded |
| 4 | Refresh after action → Solicitudes list updates; new booking appears in main bookings list |
| 5 | Owner can publish space → instant bookings are confirmed immediately without Solicitudes |
| 6 | Owner expires stale requests → `expireStaleRequests` flips pending >48h to cancelled+refunded |

**Edge/negative cases:**
- Owner clicks Accept on already-confirmed booking → no-op, status unchanged
- Owner clicks Decline on cancelled booking → no-op
- Guest cancels own booking → status flips to cancelled, payment refunded
- Guest tries to book overlapping slot → backend rejects, UI shows error

## Verification Commands & Counts

| Command | Expected |
|---------|----------|
| `npx tsc --noEmit` | **0 errors** (verified on master `9ebacf4`) |
| `npx expo lint` (frontend files only) | Clean (baseline warnings only) |
| `npm test -- --testPathPatterns="space-double-book"` | **7 passed** (new double-booking tests) |
| `npm test` (full backend) | **138 passed**, **8 pre-existing socket test failures only** (known; not related to cowork) |
| `npm test -- --testPathPatterns="space-" && npm test -- --testPathPatterns="space-booking-"` | All space/booking model tests pass |
| `npm test -- --testPathPatterns="messages"` | All messaging tests pass (22 message tests) |

**Known limitations:**
- Socket tests have 8 pre-existing failures unrelated to cowork changes (connection timing).
- Full `npm test` times out >2 min; use focused `--testPathPatterns` for faster feedback.
- `expo lint` on unchanged files may show stale warnings; only lint files you edit.

## Merge Checklist (before PR)

- [ ] All 15 tasks implemented (Tasks 1–12 verified; Task 14 test added; Task 15 doc written)
- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] Mojibake fixed in `backend/src/routes/spaces.ts:346,352` ("aún" → "ún", "pídele" → "pide")
- [ ] All `npm test -- --testPathPatterns` suites pass for modified areas
- [ ] `git status` shows only intended changes (no accidental edits)
- [ ] Commit hashes verified against master before merge