# Task 3 Report — Availability engine (pure library + tests)

## Status: DONE_WITH_CONCERNS

## What changed
- Created `backend/src/models/availability.ts` — verbatim from brief Step 3 (no modifications).
- Created `backend/src/__tests__/availability.test.ts` — verbatim from brief Step 1 (no modifications).

Interfaces implemented exactly per brief: `SlotCell`, `BusinessHoursShape`, `BusinessHoursEntry`, `normalizeBusinessHours`, `addMinutes`, `timesOverlap`, `cellStates`, `nextAvailable`. No extra functions added.

## Test commands and output tails

### Step 2 (red) — without any env override, from `<worktree>\backend`:
Command: `npm test -- availability.test`
Output tail:
```
Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        15.94 s
Ran all test suites matching availability.test.
```
Error: `TS2307: Cannot find module '../models/availability'` (plus implicit-any TS7006 on the `.find` callbacks, which also resolve once the module exists and types the return).

### Step 4 (green) — requires `TZ=UTC` (see Concerns), from `<worktree>\backend`:
Command: `$env:TZ='UTC'; npm test -- availability.test`
Output tail:
```
  availability engine
    √ timesOverlap detects true overlap (8 ms)
    √ cellStates marks booked cells and keeps open ones available (3 ms)
    √ cellStates closes cells within minAdvance and outside hours (3 ms)
    √ nextAvailable returns next free slot from preferred start (5 ms)
Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Snapshots:   0 total
Time:        11.659 s, estimated 16 s
Ran all test suites matching availability.test.
```

## Deviations
None in the source files — both test and implementation are byte-for-byte from the brief.

## Concerns (what later tasks must know)
1. **Timezone sensitivity in `cellStates`**: `cellTime = new Date(\`${date}T${start}:00\`)` builds a *local-timezone* date, while the test passes `now` as UTC (`...Z`, e.g. `2026-08-17T11:00:00Z`). The test only passes when local time ≈ UTC.
   - On this machine (TZ = `America/Buenos_Aires`, GMT-3): `now=11:00Z` = 08:00 local; a local 11:00 cell = 14:00 UTC → diff = +3h > minAdvance 2h → cell stays `available`, failing the "cells within minAdvance are closed" assertion.
   - Green run had to set `$env:TZ='UTC'` (Node on Windows honors `TZ`; verified). Without it, the same assertion fails: `Expected: "closed", Received: "available"` at `availability.test.ts:29`.
   - Recommendation for any consumer of `cellStates`: pass `now` built from the same reference that matches the server's local convention, or always run tests/CI under `TZ=UTC`.
2. **`fromMin` wraps at 24:00** (`% 24`): cells crossing midnight wrap to `00:xx` of the same day key. The brief's test data never triggers this, so behavior for late-night slots in actual larger step values is untested — a later task adding integration tests should cover a window that crosses midnight before claiming wrap behavior is correct.
3. **Commit hash**: `bbdf677`

---

## Fix round 1

### What changed
- `backend/src/models/availability.ts` — `cellStates` now builds each cell instant with UTC components instead of server-local parsing:
  - Before: `const cellTime = new Date(\`${date}T${start}:00\`);` (local TZ interpretation)
  - After: parse `date` (YYYY-MM-DD) into `y/mo/d` and `start` (HH:MM) into `h/mi`, then `new Date(Date.UTC(y, mo - 1, d, h, mi, 0))` — interpreting the wall-clock as UTC. The comparison `cellTime.getTime() - now.getTime() < advanceMs` is now deterministic regardless of server timezone.
  - Exported function signatures unchanged (`cellStates` params/return identical). `weekDay` derivation left as-is: `new Date(\`${date}T00:00:00\`).getDay()` yields the same weekday for a given calendar date in any timezone, so it is already timezone-independent.
- `backend/src/__tests__/availability.test.ts` — added one new `it(...)` block: with `slotGranularity: 30` and window `09:00–22:00`, no cell starts at `22:00` or later, the last cell starts `21:30`, and no `22:00` cell exists.

### Midnight wrap verification (concern 2)
Confirmed `fromMin`'s `% 24` (and `addMinutes`'s wrap) never produces an out-of-range cell for realistic inputs:
- The loop is `for (let m = toMin(window.start); m < toMin(window.end); m += step)`. For business hours whose `end ≤ 24:00`, `toMin(window.end) ≤ 1440`, so every `m < 1440`.
- `fromMin(m)` with `m < 1440` → hour in `0..23`, so `% 24` is a no-op for cell starts. It only normalizes the *end* of the final cell via `addMinutes` (max `start 21:30` + `30` → `end "00:00"`), never producing a start `≥ 24:00`.
- New test asserts reality on top of the proof.

### Test command (plain run, NO TZ set — machine is `America/Buenos_Aires`, GMT-3)
Command: `npm test -- availability.test` from `<worktree>\backend`

Output tail:
```
PASS src/__tests__/availability.test.ts (14.787 s)
  availability engine
    √ timesOverlap detects true overlap (7 ms)
    √ cellStates marks booked cells and keeps open ones available (5 ms)
    √ cellStates closes cells within minAdvance and outside hours (2 ms)
    √ nextAvailable returns next free slot from preferred start (2 ms)
    √ cellStates stops at business end — no cell at 22:00 or later (09:00–22:00 @ 30min) (2 ms)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Snapshots:   0 total
Time:        17.607 s
Ran all test suites matching availability.test.
```

### Remaining doubts
- `cellStates` now semantically interprets slot wall-clock times as UTC. If the business layer later feeds `now` derived from a *local* clock (e.g. `new Date()` rather than an ISO `...Z` instant), minAdvance cutoff will be offset — downstream tasks (booking/availability query endpoints) should pass UTC instants and/or standardize on interpreting expressed times as UTC.

### Commit hash
`<pending>`