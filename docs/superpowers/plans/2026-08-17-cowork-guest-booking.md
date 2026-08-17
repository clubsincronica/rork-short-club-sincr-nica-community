# Co-Work: Guest Discovery & Booking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Co-Work modality from a local-only prototype into a full guest+owner flow — discoverable from Discover, backed by `/api/spaces`, with a slot-grid availability engine, Instant/Request booking, real payments, and an owner accept/decline queue.

**Architecture:** Extend existing rails. New backend model layer (`space.ts`, `space-booking.ts`) + routes (`spaces.ts`) following `reservation.ts`/`reservations.ts` patterns; `cowork-store` becomes API-backed like `calendar-store`; new library code for availability math (`availability.ts`) and a reusable `SlotGrid` component; checkout reuses the existing payments/`createTransaction`/webhook machinery keyed by `space_bookings`.

**Tech Stack:** Node/Express/TypeScript, `pg` (Postgres) + `sql.js` fallback, Jest (unit tests via `sql.js` in-memory DB), Zustand, React Native / Expo Router, NativeWind, Stripe + MercadoPago.

Design spec: `docs/superpowers/specs/2026-08-17-cowork-guest-booking-design.md`
Research: `documentation/COWORK_UX_RESEARCH.md`

## Global Constraints

- DB access in new model files must be `import { query } from '../db/postgres-client'` (modern layer).
- Route files export `export default router` (an `express.Router()`), mounted per-route with `authenticateJWT`.
- Auth: `req.user` = `{ userId, email, role }` (set by `authenticateJWT` in `middleware/security.ts`). Ownership checks compare `product.provider_id !== req.user.userId && req.user.role !== 'admin'`.
- Validation: use `express-validator` chains exported as named `validateX` + `handleValidationErrors` from `middleware/validation.ts`.
- Tests: Jest-only unit tests over `sql.js` in-memory DB via `./helpers` from `src/__tests__`. No supertest.
- Frontend API: use `apiFetch(path, { method, body })` from `@/utils/apiClient` (attaches Bearer token automatically). Base URL from `@/utils/api-config`.
- Types: extend `types/user.ts` (frontend) and define matching interfaces in backend model files.
- Seed demo space only in `__DEV__` once backend is wired; keep `cowork_store_v1` AsyncStorage key for offline/migrations.
- No new dependencies. Reuse `@/components/TouchableScale`, `AccessibleText`, `Colors` from `@/constants/colors`.

---

### Task 1: DB schema — spaces, subspaces, space_bookings

**Files:**
- Modify: `backend/src/models/database-sqljs.ts` (both Postgres and SQLite schema branches)
- Test: `backend/src/__tests__/space-schema.test.ts`

**Interfaces:**
- Produces: Tables `spaces`, `subspaces`, `space_bookings` exist after `initializeDatabase()`. No model functions yet.

- [ ] **Step 1: Add Postgres CREATE TABLE statements**

Inside the Postgres branch (after the `reservations` CREATE TABLE, ~line 307), add:

```ts
      await pgClient.query(`
        CREATE TABLE IF NOT EXISTS spaces (
          id SERIAL PRIMARY KEY,
          owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT,
          location TEXT,
          images TEXT DEFAULT '[]',
          amenities TEXT DEFAULT '[]',
          calendar_mode TEXT DEFAULT 'unified',
          is_published BOOLEAN DEFAULT false,
          rating REAL DEFAULT 0,
          review_count INTEGER DEFAULT 0,
          tags TEXT DEFAULT '[]',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await pgClient.query(`
        CREATE TABLE IF NOT EXISTS subspaces (
          id SERIAL PRIMARY KEY,
          space_id INTEGER NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT,
          type TEXT DEFAULT 'other',
          capacity INTEGER DEFAULT 1,
          features TEXT DEFAULT '[]',
          images TEXT DEFAULT '[]',
          price_hour DECIMAL(10,2),
          price_day DECIMAL(10,2),
          price_week DECIMAL(10,2),
          price_month DECIMAL(10,2),
          billing_units TEXT DEFAULT '["hour"]',
          is_active BOOLEAN DEFAULT true,
          floor_label TEXT,
          calendar_mode TEXT DEFAULT 'unified',
          color TEXT,
          instant_book BOOLEAN DEFAULT false,
          business_hours TEXT DEFAULT '[]',
          slot_granularity INTEGER DEFAULT 30,
          min_advance INTEGER DEFAULT 120,
          max_duration INTEGER DEFAULT 8,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await pgClient.query(`
        CREATE TABLE IF NOT EXISTS space_bookings (
          id SERIAL PRIMARY KEY,
          space_id INTEGER NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
          subspace_id INTEGER NOT NULL REFERENCES subspaces(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          guest_name TEXT,
          date DATE NOT NULL,
          start_time TEXT NOT NULL,
          end_time TEXT NOT NULL,
          billing_unit TEXT DEFAULT 'hour',
          quantity INTEGER DEFAULT 1,
          total_price DECIMAL(10,2) NOT NULL,
          status TEXT DEFAULT 'pending',
          mode TEXT DEFAULT 'instant',
          payment_status TEXT DEFAULT 'pending',
          payment_provider TEXT,
          payment_id TEXT,
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await pgClient.query(`CREATE INDEX IF NOT EXISTS idx_space_bookings_subspace ON space_bookings(subspace_id, date)`);
```

- [ ] **Step 2: Add SQLite CREATE TABLE statements**

Inside the SQLite branch (after the `reservations` CREATE TABLE, ~line 457), add the same three tables in SQLite dialect (replace `SERIAL PRIMARY KEY` with `INTEGER PRIMARY KEY AUTOINCREMENT`, `BOOLEAN` with `INTEGER DEFAULT 0`, `TIMESTAMP DEFAULT NOW()` with `TEXT DEFAULT CURRENT_TIMESTAMP`, and `space_bookings` index via `CREATE INDEX IF NOT EXISTS` on `subspace_id, date`).

- [ ] **Step 3: Write the failing schema test**

`backend/src/__tests__/space-schema.test.ts`:

```ts
import { createTestDatabase } from './helpers';
import { Database } from 'sql.js';

describe('Space schema', () => {
  let db: Database;
  beforeEach(async () => { db = await createTestDatabase(); });
  afterEach(() => { if (db) { db.close(); } });

  it('supports creating spaces, subspaces and space_bookings', async () => {
    // NOTE: tables are created via initializeDatabase (Postgres path). In unit
    // tests we replicate the SQLite DDL by running the same CREATE TABLE
    // statements against the in-memory DB to prove the DDL is valid.
    db.run(`CREATE TABLE IF NOT EXISTS spaces (
      id INTEGER PRIMARY KEY AUTOINCREMENT, owner_id INTEGER NOT NULL,
      title TEXT NOT NULL, description TEXT, location TEXT, images TEXT DEFAULT '[]',
      amenities TEXT DEFAULT '[]', calendar_mode TEXT DEFAULT 'unified',
      is_published INTEGER DEFAULT 0, rating REAL DEFAULT 0, review_count INTEGER DEFAULT 0,
      tags TEXT DEFAULT '[]', created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
    db.run(`INSERT INTO spaces (owner_id, title) VALUES (1, 'Test Space')`);
    const res = db.exec(`SELECT COUNT(*) FROM spaces`);
    expect(res[0].values[0][0]).toBe(1);
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npm test -- space-schema`
Expected: FAIL (table doesn't exist yet — DDL not yet applied to the test).

- [ ] **Step 5: Apply the DDL via the test (make it pass)**

Update the test in Step 3 to also `db.run` the `subspaces` and `space_bookings` CREATE TABLE statements (SQLite dialect), then insert one row into each and assert counts. Re-run. Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src/models/database-sqljs.ts backend/src/__tests__/space-schema.test.ts
git commit -m "feat(backend): add spaces, subspaces, space_bookings schema"
```

---

### Task 2: Space model — CRUD for spaces and subspaces

**Files:**
- Create: `backend/src/models/space.ts`
- Test: `backend/src/__tests__/space.test.ts`

**Interfaces:**
- Consumes: `query` from `../db/postgres-client`; Task 1 tables.
- Produces:
  - `interface SpaceRow` / `interface SubSpaceRow` (snake_case DB shapes).
  - `createSpace(input: { ownerId; title; description?; location?; images?; amenities?; calendarMode?; tags? }) => Promise<{ lastID: number }>`
  - `getPublishedSpaces(filters?: { type?; capacity?; maxHourlyPrice? }) => Promise<SpaceRow[]>`
  - `getSpaceById(id: number) => Promise<SpaceRow | null>`
  - `getSpacesByOwner(ownerId: number) => Promise<SpaceRow[]>`
  - `updateSpace(id, updates) => Promise<void>`
  - `deleteSpace(id) => Promise<void>`
  - `setSpacePublished(id, isPublished) => Promise<void>`
  - `createSubSpace(input) => Promise<{ lastID: number }>`
  - `updateSubSpace(subSpaceId, updates) => Promise<void>`
  - `deleteSubSpace(subSpaceId) => Promise<void>`
  - `getSubSpacesBySpace(spaceId) => Promise<SubSpaceRow[]>`
  - `getSubSpaceById(id) => Promise<SubSpaceRow | null>`
  - `getSubSpaceBySpaceId(spaceId, subSpaceId) => Promise<SubSpaceRow | null>`

- [ ] **Step 1: Write the failing tests** — `backend/src/__tests__/space.test.ts` using `sql.js` in-memory DB. Since the model uses `query` from `postgres-client` (needs DATABASE_URL), the model's SQL functions are integration-tested against the real DB elsewhere; the unit tests here validate the SQL strings by mocking `../db/postgres-client`:

```ts
import { query } from '../db/postgres-client';
jest.mock('../db/postgres-client', () => ({
  query: jest.fn(),
}));
const mockedQuery = query as jest.Mock;

import {
  createSpace, getSpaceById, getPublishedSpaces, updateSpace, deleteSpace,
  createSubSpace, updateSubSpace, deleteSubSpace, getSubSpacesBySpace,
  setSpacePublished,
} from '../models/space';

describe('space model', () => {
  beforeEach(() => mockedQuery.mockReset());

  it('createSpace inserts and returns lastID', async () => {
    mockedQuery.mockResolvedValueOnce([{ id: 7 }]);
    const res = await createSpace({ ownerId: 1, title: 'Galería' });
    expect(res.lastID).toBe(7);
    expect(mockedQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO spaces'),
      expect.arrayContaining([1, 'Galería'])
    );
  });

  it('getSpaceById returns row or null', async () => {
    mockedQuery.mockResolvedValueOnce([{ id: 1, owner_id: 1, title: 'X' }]);
    expect(await getSpaceById(1)).toEqual({ id: 1, owner_id: 1, title: 'X' });
    mockedQuery.mockResolvedValueOnce([]);
    expect(await getSpaceById(99)).toBeNull();
  });

  it('setSpacePublished flips is_published', async () => {
    mockedQuery.mockResolvedValueOnce([]);
    await setSpacePublished(1, false);
    expect(mockedQuery).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE spaces SET is_published'),
      expect.arrayContaining([false, 1])
    );
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- space.test`
Expected: FAIL with "Cannot find module '../models/space'".

- [ ] **Step 3: Implement `backend/src/models/space.ts`**

Follow `reservation.ts` style. Key implementation notes:
- JSON columns: store as strings (`JSON.stringify`), parse on read (`JSON.parse(s || '[]')`).
- `getPublishedSpaces` filters: `WHERE s.is_published = true`; when `type`/`capacity` provided join `subspaces`; when `maxHourlyPrice` provided use `EXISTS (SELECT 1 FROM subspaces WHERE space_id = s.id AND price_hour <= $n)`.
- `getSpacesByOwner` returns spaces owned by `ownerId`, with `subspaces` attached as JSON (join and aggregate, or two queries).

- [ ] **Step 4: Run tests**

Run: `npm test -- space.test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/models/space.ts backend/src/__tests__/space.test.ts
git commit -m "feat(backend): space model CRUD"
```

---

### Task 3: Availability engine — pure library + tests

**Files:**
- Create: `backend/src/models/availability.ts`
- Test: `backend/src/__tests__/availability.test.ts`

**Interfaces:**
- Consumes: Task 1 `space_bookings` shape (`date`, `start_time`, `end_time`, `status`), SubSpace `business_hours`, `slot_granularity`, `min_advance`, `max_duration`.
- Produces:
  - `interface SlotCell { date: string; start: string; end: string; state: 'available' | 'booked' | 'blocked' | 'closed' }`
  - `minOfDay(hhmm: string, minutes: number): string` — clamp a "HH:MM" to a grid boundary (floor to granularity).
  - `addMinutes(hhmm: string, minutes: number): string` — returns "HH:MM" (wraps past midnight, includes day -1 offset semantics via plain minutes, but cells are single-day so clamp at 24:00 representing 'closed').
  - `timesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean` — string-compare `<`/`>` on HH:MM works lexicographically when zero-padded.
  - `cellStates(subSpace: { businessHours: Record<string, { start: string; end: string }>; slotGranularity: number; minAdvance: number; maxDuration: number }, date: string, bookings: Array<{ startTime: string; endTime: string; status: string }>, now: Date): SlotCell[]`
  - `nextAvailable(cells: SlotCell[], preferredStart: string): string | null`

- [ ] **Step 1: Write the failing tests** — `backend/src/__tests__/availability.test.ts`:

```ts
import { cellStates, timesOverlap, nextAvailable } from '../models/availability';

const sub = {
  businessHours: { '1': { start: '09:00', end: '22:00' }, '5': { start: '10:00', end: '18:00' } },
  slotGranularity: 30,
  minAdvance: 120,
  maxDuration: 8,
};
const DATE = '2026-08-17'; // Monday → day key '1'

describe('availability engine', () => {
  it('timesOverlap detects true overlap', () => {
    expect(timesOverlap('10:00', '11:00', '10:30', '12:00')).toBe(true);
    expect(timesOverlap('10:00', '11:00', '11:00', '12:00')).toBe(false);
  });

  it('cellStates marks booked cells and keeps open ones available', () => {
    const cells = cellStates(sub, DATE, [{ startTime: '10:00', endTime: '12:00', status: 'confirmed' }], new Date('2026-08-16T00:00:00Z'));
    const ten = cells.find(c => c.start === '10:00');
    expect(ten?.state).toBe('booked');
    const twelve = cells.find(c => c.start === '12:00');
    expect(twelve?.state).toBe('available');
  });

  it('cellStates closes cells within minAdvance and outside hours', () => {
    const now = new Date('2026-08-17T11:00:00Z'); // date is Monday
    const cells = cellStates(sub, DATE, [], now);
    // minAdvance 120 → cells starting before 13:00 are closed
    expect(cells.find(c => c.start === '11:00')?.state).toBe('closed');
    expect(cells.find(c => c.start === '13:00')?.state).toBe('available');
    // outside business hours → no cell at 08:00 or 23:00
    expect(cells.find(c => c.start === '08:00')).toBeUndefined();
  });

  it('nextAvailable returns next free slot from preferred start', () => {
    const cells = cellStates(sub, DATE, [{ startTime: '10:00', endTime: '12:00', status: 'confirmed' }], new Date('2026-08-16T00:00:00Z'));
    expect(nextAvailable(cells, '09:30')).toBe('09:30');
    expect(nextAvailable(cells, '10:00')).toBe('12:00');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- availability.test`
Expected: FAIL ("Cannot find module").

- [ ] **Step 3: Implement `backend/src/models/availability.ts`** (pure functions, no DB):

```ts
export interface SlotCell { date: string; start: string; end: string; state: 'available' | 'booked' | 'blocked' | 'closed'; }

export interface BusinessHoursShape { start: string; end: string; }
export interface BusinessHoursEntry { day: string; start: string; end: string; }

const pad = (n: number) => String(n).padStart(2, '0');
const toMin = (h: string) => { const [a, b] = h.split(':').map(Number); return a * 60 + b; };
const fromMin = (m: number) => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;

/** Normalize stored JSON (either Record<'0'..'6', {start,end}> or [{day,start,end}]) into Record form */
export function normalizeBusinessHours(raw: unknown): Record<string, BusinessHoursShape> {
  const out: Record<string, BusinessHoursShape> = {};
  if (Array.isArray(raw)) {
    for (const e of raw as BusinessHoursEntry[]) {
      if (e && e.day != null && e.start && e.end) out[String(e.day)] = { start: e.start, end: e.end };
    }
  } else if (raw && typeof raw === 'object') {
    for (const [k, v] of Object.entries(raw as Record<string, BusinessHoursShape>)) {
      if (v && v.start && v.end) out[k] = { start: v.start, end: v.end };
    }
  }
  return out;
}

export function addMinutes(hhmm: string, minutes: number): string {
  return fromMin(toMin(hhmm) + minutes);
}

export function timesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function cellStates(
  subSpace: { businessHours: unknown; slotGranularity: number; minAdvance: number; maxDuration: number },
  date: string,
  bookings: Array<{ startTime: string; endTime: string; status: string }>,
  now: Date
): SlotCell[] {
  const bh = normalizeBusinessHours(subSpace.businessHours);
  const weekDay = String(new Date(`${date}T00:00:00`).getDay()); // 0=Sunday..6
  const window = bh[weekDay];
  const cells: SlotCell[] = [];
  if (!window) return cells;
  const step = subSpace.slotGranularity || 30;
  const active = bookings.filter(b => b.status !== 'cancelled');
  const advanceMs = (subSpace.minAdvance ?? 120) * 60 * 1000;
  for (let m = toMin(window.start); m < toMin(window.end); m += step) {
    const start = fromMin(m);
    const end = addMinutes(start, step);
    const cell: SlotCell = { date, start, end, state: 'available' };
    const isBlocked = active.some(b => b.status === 'blocked' && timesOverlap(start, end, b.startTime, b.endTime));
    const isBooked = active.some(b => b.status !== 'blocked' && timesOverlap(start, end, b.startTime, b.endTime));
    const cellTime = new Date(`${date}T${start}:00`);
    if (cellTime.getTime() - now.getTime() < advanceMs) cell.state = 'closed';
    else if (isBlocked) cell.state = 'blocked';
    else if (isBooked) cell.state = 'booked';
    cells.push(cell);
  }
  return cells;
}

export function nextAvailable(cells: SlotCell[], preferredStart: string): string | null {
  const available = cells.filter(c => c.state === 'available');
  if (available.length === 0) return null;
  return available.find(c => c.start >= preferredStart)?.start ?? available[0].start;
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- availability.test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/models/availability.ts backend/src/__tests__/availability.test.ts
git commit -m "feat(backend): slot availability engine"
```

---

### Task 4: Space bookings model — CRUD, overlap guard, price from DB

**Files:**
- Create: `backend/src/models/space-booking.ts`
- Test: `backend/src/__tests__/space-booking.test.ts`

**Interfaces:**
- Consumes: `query` from `../db/postgres-client`; Task 1 tables; Task 3 `timesOverlap`.
- Produces:
  - `interface SpaceBookingRow` (snake_case).
  - `createSpaceBooking(input: { spaceId; subspaceId; userId; guestName?; date; startTime; endTime; billingUnit; quantity; totalPrice; status?; mode?; paymentStatus?; notes? }) => Promise<{ lastID: number }>`
  - `findOverlappingBooking(subspaceId, date, startTime, endTime, excludeId?) => Promise<SpaceBookingRow | null>` — returns the first non-cancelled booking overlapping.
  - `getSpaceBookingById(id) => Promise<SpaceBookingRow | null>`
  - `getBookingsForGuest(userId) => Promise<SpaceBookingRow[]>`
  - `getBookingsForOwner(ownerId) => Promise<SpaceBookingRow[]>` (JOIN subspaces→spaces to scope by owner)
  - `getBookingsForSubSpace(subspaceId) => Promise<SpaceBookingRow[]>`
  - `updateSpaceBookingStatus(id, status, paymentStatus?) => Promise<void>`
  - `computeBookingPrice(subspaceRow, billingUnit, quantity) => number`

- [ ] **Step 1: Write the failing tests** — mock `../db/postgres-client` (same pattern as Task 2). Cover: `createSpaceBooking` INSERT params; `findOverlappingBooking` calls with overlap predicate and maps first row to null; `computeBookingPrice` picks `price_hour/day/week/month` and multiplies by quantity.

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- space-booking.test`
Expected: FAIL.

- [ ] **Step 3: Implement `backend/src/models/space-booking.ts`**

`computeBookingPrice`:

```ts
export function computeBookingPrice(sub: any, billingUnit: string, quantity: number): number {
  const key = { hour: 'price_hour', day: 'price_day', week: 'price_week', month: 'price_month' }[billingUnit];
  const price = Number(sub?.[key] || 0);
  return Math.round((price * (quantity || 1)) * 100) / 100;
}
```

`findOverlappingBooking` uses `timesOverlap` on the start/end pair plus a `date = $1 AND subspace_id = $2 AND status <> 'cancelled'` filter, excluding `id` when provided; returns `rows[0] || null`.

- [ ] **Step 4: Run tests**

Run: `npm test -- space-booking.test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/models/space-booking.ts backend/src/__tests__/space-booking.test.ts
git commit -m "feat(backend): space booking model with overlap guard"
```

---

### Task 5: Routes — spaces.ts (owner CRUD, guest listing, availability, bookings, status)

**Files:**
- Create: `backend/src/routes/spaces.ts`
- Modify: `backend/src/middleware/validation.ts` (add `validateSpaceBooking`)
- Modify: `backend/src/server.ts` (import + mount)
- Test: `backend/src/__tests__/spaces-routes.test.ts` (route-level via mocked models)

**Interfaces:**
- Consumes: Tasks 2–4 models; `authenticateJWT`; `validation.ts` helpers.
- Produces (HTTP):
  - `GET /api/spaces?type=&capacity=&maxHourlyPrice=` → `SpaceRow[]` (published only)
  - `GET /api/spaces/:id?from=&to=` → space + `subspaces` each with `availability: SlotCell[]`
  - `POST /api/spaces` (auth) → `{ id, message }`
  - `PUT /api/spaces/:id` (auth, owner) → `{ message }`
  - `DELETE /api/spaces/:id` (auth, owner) → `{ message }`
  - `POST /api/spaces/:id/subspaces` (auth, owner) → `{ id, message }`
  - `PUT /api/spaces/:id/subspaces/:sid` (auth, owner) → `{ message }`
  - `DELETE /api/spaces/:id/subspaces/:sid` (auth, owner) → `{ message }`
  - `POST /api/spaces/checkout` (auth) → `{ bookingId, mode }` (creates booking pending/hold; Task 7 wires the hold)
  - `GET /api/spaces/bookings/owner` (auth) → `SpaceBookingRow[]`
  - `GET /api/spaces/bookings/guest` (auth) → `SpaceBookingRow[]`
  - `PUT /api/spaces/bookings/:id/status` (auth; owner for approved/declined, guest for cancelled) → `{ message }`

- [ ] **Step 1: Add validation chain to `validation.ts`**

```ts
export const validateSpaceBooking: ValidationChain[] = [
  body('subspaceId').isInt({ min: 1 }),
  body('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('date must be YYYY-MM-DD'),
  body('startTime').matches(/^\d{2}:\d{2}$/),
  body('endTime').matches(/^\d{2}:\d{2}$/),
  body('billingUnit').isIn(['hour', 'day', 'week', 'month']),
  body('quantity').optional().isInt({ min: 1, max: 31 }),
  body('notes').optional().isString().isLength({ max: 500 }),
];
```

- [ ] **Step 2: Write the failing route tests** — mock the models (`jest.mock('../models/space'')`, `jest.mock('../models/space-booking')`, `jest.mock('../models/availability')`), invoke `spacesRouter` handler functions directly with `mockRequest`/`mockResponse` from `./helpers` (the established non-HTTP harness), assert `res.status`/`res.json` calls. Cover: guest listing only returns published; owner route rejects non-owner (403); booking creation calls `findOverlappingBooking` and 409s on conflict.

- [ ] **Step 3: Implement `backend/src/routes/spaces.ts`**

Follow `reservations.ts` structure. Every auth route uses `authenticateJWT`. Ownership helper inline:

```ts
const isOwner = (space: any, req: any) => space.owner_id === req.user.userId || req.user.role === 'admin';
```

`GET /:id` with availability:

```ts
router.get('/:id', async (req: any, res: express.Response) => {
  try {
    const spaceId = parseInt(req.params.id);
    const space = await SpaceModel.getSpaceById(spaceId);
    if (!space || (space.is_published !== true && space.owner_id !== req.user?.userId && req.user?.role !== 'admin')) {
      return res.status(404).json({ error: 'Space not found' });
    }
    const subspaces = await SpaceModel.getSubSpacesBySpace(spaceId);
    const from = req.query.from as string;
    const to = req.query.to as string;
    const days = buildDayList(from, to); // helper: array of YYYY-MM-DD
    const enriched = [];
    for (const sub of subspaces) {
      const bookings = await BookingModel.getBookingsForSubSpace(sub.id).then(rows =>
        rows.filter(r => days.includes(r.date))
      );
      const bh = safeJson(sub.business_hours);
      let availability: any[] = [];
      if (from && to) {
        availability = days.map(d => ({
          date: d,
          cells: cellStates(
            { businessHours: bh, slotGranularity: sub.slot_granularity, minAdvance: sub.min_advance, maxDuration: sub.max_duration },
            d,
            bookings.map(b => ({ startTime: b.start_time, endTime: b.end_time, status: b.status })),
            new Date()
          ),
        }));
      }
      enriched.push({ ...sub, availability });
    }
    res.json({ ...space, subspaces: enriched });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

`buildDayList` helper (local to route file): from/to ISO dates → array of `YYYY-MM-DD`, capped at 62 entries.

- [ ] **Step 4: Run tests**

Run: `npm test -- spaces-routes.test`
Expected: PASS.

- [ ] **Step 5: Mount in `server.ts`**

Add `import spacesRoutes from './routes/spaces';` after `import paymentsRoutes ...` and `app.use('/api/spaces', spacesRoutes);` after the reservations mount.

- [ ] **Step 6: Commit**

```bash
git add backend/src/routes/spaces.ts backend/src/middleware/validation.ts backend/src/server.ts backend/src/__tests__/spaces-routes.test.ts
git commit -m "feat(backend): spaces API (CRUD, listing, availability, bookings)"
```

---

### Task 6: Payments — space checkout, holds, webhook confirmation

**Files:**
- Modify: `backend/src/routes/spaces.ts` (checkout + status action wiring)
- Modify: `backend/src/routes/payments.ts` (space-aware intents/preferences)
- Modify: `backend/src/models/transaction.ts` (resolve space_bookings on success)
- Modify: `backend/src/routes/webhooks.ts` (confirm space bookings)
- (Build may import `stripe`/`mercadopago` clients inline, matching existing style.)

**Interfaces:**
- Consumes: Task 4 booking model; existing `createTransaction`, `getCommissionRate`, `updateTransactionStatus`, `findTransactionByPaymentId`; `authenticateJWT`.
- Produces:
  - `POST /api/spaces/checkout` body `{ subspaceId, date, startTime, endTime, billingUnit, quantity, paymentMethod, mode, notes }`:
    - Validates subspace published & active; computes price via `computeBookingPrice`.
    - Calls `findOverlappingBooking`; on conflict → 409 `{ error: 'slot_taken', nextAvailable }`.
    - Creates booking: `mode` from subspace `instant_book` (default `instant`), `status: mode === 'instant' ? 'pending' : 'pending'`, `payment_status: mode === 'instant' ? 'pending' : 'held'`.
    - Returns `{ bookingId, mode, totalPrice }`.
  - `POST /api/spaces/pay/stripe/:bookingId` — Stripe PaymentIntent for a space booking (`{ clientSecret }`), creates transaction `metadata: { resource: 'space' }`.
  - `POST /api/spaces/pay/mercadopago/:bookingId` — MP preference (vendor token flow), creates transaction `metadata: { resource: 'space' }`.
  - `POST /api/spaces/bookings/:id/accepted` (owner) — capture hold → `status 'confirmed'`, `payment_status 'paid'` (calls `updateTransactionStatus`).
  - `POST /api/spaces/bookings/:id/declined` (owner) — release hold → `status 'cancelled'`, `payment_status 'refunded'`.
  - Auto-expiry: on booking read for owner/guest, server flips `pending` request-mode bookings older than 48h to `cancelled` (inline, no scheduler).
- **Webhook changes:** `updateTransactionStatus('stripe'|'mercadopago', id, 'succeeded'|'approved')` already confirms reservations; extend it so when `transaction.metadata` has `resource === 'space'`, it calls `updateSpaceBookingStatus(booking_id, 'confirmed', 'paid')` instead of `updateReservationStatus`.

- [ ] **Step 1: Write the failing tests** — `backend/src/__tests__/spaces-payments.test.ts`: mock models + `transaction.ts`; assert checkout flow computes price from DB, returns bookingId, and that `updateSpaceBookingStatus` is called by `updateTransactionStatus` when metadata.resource === 'space'. (Test `transaction.ts` via mock of `./space-booking`.)

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- spaces-payments.test`
Expected: FAIL.

- [ ] **Step 3: Refactor `transaction.ts` `updateTransactionStatus`**

After the success branch, replace the blind `updateReservationStatus` call with a resource-aware resolver:

```ts
function confirmResource(bookingId: number | null) {
  if (!bookingId) return;
  try {
    const { findTransactionByPaymentId, updateTransactionStatus: updateTx } = {} as any;
    // existing findTransactionByPaymentId already ran above; use its result
  } catch { /* noop */ }
}
```

Concretely: capture the `transaction` already fetched in the success branch, and if `transaction.metadata` (parsed) `?.resource === 'space'`, `require('./space-booking').updateSpaceBookingStatus(transaction.booking_id, 'confirmed', 'paid')`; otherwise keep `updateReservationStatus`.

- [ ] **Step 4: Add checkout + pay endpoints to `spaces.ts`**

Mirror the Stripe intent body from `payments.ts` (amount from DB, commission split, `createTransaction` with `metadata: { resource: 'space' }`), and the MP preference body (vendor token, `marketplace_fee`, `external_reference: bookingId`). Add helper `getBookingOr404` and ownership/user checks (booking `user_id` must match `req.user.userId`).

- [ ] **Step 5: Run tests**

Run: `npm test -- spaces-payments.test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src/routes/spaces.ts backend/src/routes/payments.ts backend/src/models/transaction.ts backend/src/routes/webhooks.ts backend/src/__tests__/spaces-payments.test.ts
git commit -m "feat(backend): space checkout, holds, webhook confirmation"
```

---

### Task 7: Frontend types + API-backed cowork-store

**Files:**
- Modify: `types/user.ts` (extend `SubSpace`, `SpaceBooking`; add `CoWorkAvailability`/`SlotCell`)
- Modify: `hooks/cowork-store.ts` (replace AsyncStorage-only with API-backed; add new fields)
- Test: lint + manual (no frontend test runner)

**Interfaces:**
- Consumes: `apiFetch` from `@/utils/apiClient`; `useUser` for `currentUser.id`.
- Produces: `useCoWork` store keeping the SAME public method names used by `mis-espacios.tsx`, `manage-space.tsx`, `cowork-detail.tsx` (so owner screens keep compiling), plus:
  - `fetchPublishedSpaces(filters?) => Promise<CoWorkSpace[]>`
  - `fetchSpaceDetail(id) => Promise<CoWorkSpace | null>`
  - `fetchGuestBookings() => Promise<SpaceBooking[]>`
  - `fetchOwnerBookings() => Promise<SpaceBooking[]>`
  - `createBooking(input) => Promise<{ bookingId: number; mode: string }>` — POST `/api/spaces/checkout`
  - `updateBookingStatus(id, status) => Promise<void>` — now calls API
  - `SlotCell` / `CoWorkAvailability` exported types.

- [ ] **Step 1: Extend `types/user.ts`**

```ts
export interface SlotCell { date: string; start: string; end: string; state: 'available' | 'booked' | 'blocked' | 'closed'; }
export interface BusinessHoursEntry { day: string; start: string; end: string; }
```

Add to `SubSpace`: `instantBook?: boolean; businessHours?: Record<string, { start: string; end: string }> | BusinessHoursEntry[]; slotGranularity?: number; minAdvance?: number; maxDuration?: number; cancellationPolicy?: string; guestName?: string;`

Add to `SpaceBooking`: `mode?: 'instant' | 'request'; paymentProvider?: string; paymentId?: string; guestName?: string;`

- [ ] **Step 2: Rebuild `hooks/cowork-store.ts`**

Keep `getSpaceById`, `getSpacesByOwnerId`, `getBookingsForSubSpace`, `isSlotAvailable` as sync wrappers over the cached arrays (computed from fetched data). All mutators (`addSpace`, `updateSubSpace`, `addBooking`, etc.) call the API via `apiFetch` and refresh cache. On `loadData`: fetch published spaces + (if owner) owner spaces; in `__DEV__` with zero results, seed the existing demo space object via `POST /api/spaces` so the demo still works. Persist fetched arrays to `cowork_store_v1` as a cache (write-through).

- [ ] **Step 3: Verify no consumer breaks**

Run: `npx expo lint` and `npx tsc --noEmit`
Expected: no new type errors (keep old method names).

- [ ] **Step 4: Commit**

```bash
git add types/user.ts hooks/cowork-store.ts
git commit -m "feat(frontend): API-backed cowork store + extended types"
```

---

### Task 8: SlotGrid component

**Files:**
- Create: `components/SlotGrid.tsx`

**Interfaces:**
- Consumes: `SlotCell[]` (grouped by date) or `availability` from Task 5, `Colors` from `@/constants/colors`.
- Produces: `export function SlotGrid({ days, slotsByDay, selectedStart, selectedEnd, onSelectRange }: { days: { date: string; cells: SlotCell[] }[]; selectedStart?: { date: string; time: string }; selectedEnd?: { date: string; time: string } | null; onSelectRange: (start: { date: string; time: string }, end: { date: string; time: string } | null) => void })`
  - Two-tap selection: first tap sets start, second tap (later) sets end; tapping an unavailable/closed/blocked cell calls `onSuggest(day, time)` back to parent via optional `onSuggest` prop so `cowork-detail` pre-selects next available.
  - Month-jump bottom sheet (reuse existing `Modal` pattern from `cowork-detail.tsx`).

- [ ] **Step 1: Implement the grid render** (week view, time on Y-axis, day columns on X-axis, colored cells per state)

Color map (from spec): available = green `#5ecf83`, booked = pink `#f28b9f`, blocked = dark `#d3d3d3`, closed = grey diagonal (use `rgba(128,128,128,0.35)` + a diagonal `transform`), selected = white border highlight.

- [ ] **Step 2: Implement two-tap selection + suggestion callback**

- [ ] **Step 3: Implement month-jump picker**

- [ ] **Step 4: Lint**

Run: `npx expo lint`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/SlotGrid.tsx
git commit -m "feat(frontend): reusable SlotGrid availability component"
```

---

### Task 9: Guest discovery — Discover "Spaces" mode + SpaceCard

**Files:**
- Create: `components/SpaceCard.tsx`
- Modify: `app/(tabs)/discover.tsx`
- Test: `npx expo lint` + manual

**Interfaces:**
- Consumes: `useCoWork` (`fetchPublishedSpaces`), `CoWorkSpace` from `@/types/user`, `Colors`, `TouchableScale`, `AccessibleText`.
- Produces: `SpaceCard` component + `viewMode: 'spaces'` branch in discover; `router.push({ pathname: '/cowork-detail', params: { spaceId: space.id } })`.

- [ ] **Step 1: Create `components/SpaceCard.tsx`**

Props `{ space: CoWorkSpace; onPress: () => void }`. Shows cover `space.images[0]` (or gradient fallback), title, location with `MapPin`, from-price (`min` of published subspaces' `pricePerHour`), rating badge if `rating > 0`. Reuse `OptimizedImage` if already used by other cards (check `components/LodgingCard` for the image component pattern).

- [ ] **Step 2: Extend `discover.tsx`**

Add `'spaces'` to `ViewMode`. Add a filter row (space type, max hourly price, capacity, instant-book-only) rendered only when `viewMode === 'spaces'`. Add the branch that maps `publishedSpaces` → `SpaceCard`. Fetch via `useCoWork` hook selector `spaces` (loaded in `loadData`). Wire quick filters as `useState`.

- [ ] **Step 3: Lint + manual smoke on device via `bunx rork start --tunnel`**

- [ ] **Step 4: Commit**

```bash
git add components/SpaceCard.tsx app/\(tabs\)/discover.tsx
git commit -m "feat(frontend): spaces mode in Discover"
```

---

### Task 10: Guest booking — rebuild cowork-detail with SlotGrid + checkout

**Files:**
- Modify: `app/cowork-detail.tsx`
- Test: `npx expo lint` + manual E2E

**Interfaces:**
- Consumes: `useCoWork` (`fetchSpaceDetail`, `createBooking`), `useUser`, Task 8 `SlotGrid`, Task 7 types.
- Produces: rebuilt screen flow: subspace picker → billing → SlotGrid availability → price summary → confirm modal → payment path (Instant: existing `checkout`/cart or direct `/api/spaces/pay/{bookingId}`; Request: submit checkout with `mode:'request'` → wait screen).

- [ ] **Step 1: Replace local calendar/hours with SlotGrid**

Call `fetchSpaceDetail(spaceId)` → render `SlotGrid` seeded from `space.subspaces[i].availability`. Two-tap sets `selectedStart`/`selectedEnd`. On tapping a non-available cell, call parent `suggestNext(day, time)` and pre-select from `nextAvailable` result; show a hint banner "Sugerimos {time} que está disponible".

- [ ] **Step 2: Wire booking submit**

`handleBook`: ensure `currentUser`; if subspace `instantBook` → `createBooking({... mode:'instant'})` then route to payment via `/api/spaces/pay/stripe/${bookingId}` (existing `checkout.tsx` components or inline StripeSheet); on success show confirmation screen. If request mode → `createBooking({... mode:'request'})`, show "Sin cargo todavía..." confirmation screen. Cancel policy string shown in confirm modal if present.

- [ ] **Step 3: Handle 409 slot_taken**

Catch `ApiError` status 409 → show alert "Ese horario ya no está disponible" + call `suggestNext` to next free slot.

- [ ] **Step 4: Lint + manual E2E (instant pay + request)**

- [ ] **Step 5: Commit**

```bash
git add app/cowork-detail.tsx
git commit -m "feat(frontend): cowork booking with slot grid + checkout"
```

---

### Task 11: Guest "Mis reservas" + notifications

**Files:**
- Create: `app/my-bookings.tsx`
- Modify: `app/(tabs)/profile.tsx` (add menu link)
- Modify: `hooks/notificationManager.ts` (wired already; add cowork event types) — only if a `sendNotification`/push path exists; otherwise create a local in-app notification entry via existing `notification-store`.
- Test: `npx expo lint` + manual

**Interfaces:**
- Consumes: `useCoWork.fetchGuestBookings`, `updateBookingStatus`, `useUser`, types.
- Produces: `/my-bookings` screen with upcoming/past lists, status badges, cancel action (calls `updateBookingStatus(id, 'cancelled')`), and a voucher-style summary. Adds name to `SpaceBooking` display via `guestName`.

- [ ] **Step 1: Build `app/my-bookings.tsx`** (list pattern mirrors existing screens; status→color map: pending amber, confirmed green, cancelled grey)

- [ ] **Step 2: Add menu item in profile**

- [ ] **Step 3: Hook notifications**

Wire `fetchOwnerBookings` polling → when a guest booking flips to confirmed/cancelled, dispatch via existing `notification-store` (`useNotifications`) so the app inbox shows it. (If `notification-store` requires entries, add one per booking event with `title`/`body`/`type: 'cowork'`.)

- [ ] **Step 4: Lint + manual**

- [ ] **Step 5: Commit**

```bash
git add app/my-bookings.tsx app/\(tabs\)/profile.tsx hooks/cowork-store.ts
git commit -m "feat(frontend): guest bookings screen + notifications"
```

---

### Task 12: Owner listing — new fields, image upload, publish gate

**Files:**
- Create: `components/ImageUploader.tsx`
- Modify: `app/add-space.tsx`, `app/add-subspace.tsx`
- Test: `npx expo lint` + manual

**Interfaces:**
- Consumes: `expo-image-picker` (already a dependency), `useCoWork.addSpace/addSubSpace/updateSpace/updateSubSpace`.
- Produces: `ImageUploader({ images, onChange }: { images: string[]; onChange: (imgs: string[]) => void })` — pick multiple via `expo-image-picker` `launchImageLibraryAsync({ allowsMultipleSelection: true })`, preview grid with remove buttons.

- [ ] **Step 1: Implement `ImageUploader`**

- [ ] **Step 2: Extend `add-space.tsx`**

Add `businessHours` editor (per-day start/end toggles), image uploader, and disable the "Publicar" toggle unless gate passes (≥3 images, ≥1 active subspace with price and hours). Show a checklist of what's missing.

- [ ] **Step 3: Extend `add-subspace.tsx`**

Add `instantBook` toggle, `slotGranularity` selector, `minAdvance`/`maxDuration` inputs, `cancellationPolicy` text, and validate week/month units require a price (reject `$0` for enabled units).

- [ ] **Step 4: Enforce `calendarMode`**

`calendarMode` ('unified'|'separate') today is stored but never applied. In `cowork-detail.tsx` and `manage-space.tsx`, when `space.calendarMode === 'unified'`, the SlotGrid renders one shared grid across all subspaces (a booking anywhere blocks the shared timeline); when `'separate'`, each subspace renders its own grid. Server availability endpoint already returns per-subspace cells; the frontend unifies visually by overlaying all subspace bookings onto a single grid when the mode is unified. Verify behavior in Task 10 and Task 13 wiring.

- [ ] **Step 4: Lint + manual**

- [ ] **Step 5: Commit**

```bash
git add components/ImageUploader.tsx app/add-space.tsx app/add-subspace.tsx
git commit -m "feat(frontend): owner listing fields, images, publish gate"
```

---

### Task 13: Owner dashboard — Solicitudes queue + calendar rebuild

**Files:**
- Modify: `app/manage-space.tsx`
- Test: `npx expo lint` + manual E2E

**Interfaces:**
- Consumes: `useCoWork.fetchOwnerBookings/updateBookingStatus/fetchSpaceDetail`, Task 8 `SlotGrid`.
- Produces: fourth tab "Solicitudes" (request-mode pending with Accept/Decline), calendar tab built on `SlotGrid` (occupied/pending blocks), bookings tab showing mode badge + guest name. Accept → `POST /api/spaces/bookings/:id/accepted`; Decline → `.../:id/declined`; then refresh.

- [ ] **Step 1: Extend tab state to include `'requests'`**

- [ ] **Step 2: Build Solicitudes tab** (list pending request-mode bookings with guest contact, date/slot, price; Accept/Decline buttons with loading state)

- [ ] **Step 3: Rebuild Calendar tab with SlotGrid** (tap block → booking detail modal with cancel/block toggle)

- [ ] **Step 4: Bookings tab: add mode badge + guestName**

- [ ] **Step 5: Lint + manual**

- [ ] **Step 6: Commit**

```bash
git add app/manage-space.tsx
git commit -m "feat(frontend): owner requests queue + calendar rebuild"
```

---

### Task 14: Backend tests for double-book protection + integration wiring

**Files:**
- Create: `backend/src/__tests__/space-double-book.test.ts`
- Modify: `backend/src/__tests__/setup.ts` if needed (no — keep as-is)

**Interfaces:**
- Consumes: Task 3 `timesOverlap`, Task 4 `findOverlappingBooking` (mocked), Task 5 checkout handler.

- [ ] **Step 1: Write the failing test** — mock `space-booking.findOverlappingBooking` to return a row for the same slot, invoke the checkout handler via `mockRequest`/`mockResponse`, assert 409 `slot_taken` and that `createSpaceBooking` was NOT called. Second test: two sequential checkouts with different slots both succeed. Third: pending request-mode booking older than 48h auto-flips to cancelled when read.

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- space-double-book.test`
Expected: FAIL.

- [ ] **Step 3: Implement**

Add the auto-expiry sweep in `getBookingsForOwner`/`getBookingsForGuest` (parse `created_at`, update and return). Ensure checkout handler checks `findOverlappingBooking` BEFORE insert (already in Task 5/6 — verify and tighten if missing). Set `status` flip for expired requests.

- [ ] **Step 4: Run full backend test suite**

Run: `npm test`
Expected: all pass (including existing tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/__tests__/space-double-book.test.ts backend/src/models/space-booking.ts backend/src/routes/spaces.ts
git commit -m "test(backend): double-book protection + request expiry"
```

---

### Task 15: E2E verification checklist + final lint + manifest

**Files:**
- Create: `documentation/COWORK_E2E_CHECKLIST.md`
- Test: full manual pass

- [ ] **Step 1: Write the E2E checklist doc** mirroring `documentation/FUNCTIONAL_DIAGNOSTIC_CHECKLIST.md` style, covering: owner creates space (gate), adds subspaces with hours/images, publishes; guest sees it in Discover and filters; instant-book: pick slot → pay → booking appears in manage-space + guest bookings; request mode: submit → owner accepts/declines → guest notified; 409 conflict path; multi-day and business-hours edges; both payment providers (Stripe + MP, environment permitting).

- [ ] **Step 2: Run `npm test` (backend) and `npx expo lint` (frontend) and `npx tsc --noEmit`**

- [ ] **Step 3: Manual E2E pass using `bunx rork start --tunnel` on device**

- [ ] **Step 4: Commit**

```bash
git add documentation/COWORK_E2E_CHECKLIST.md
git commit -m "docs: cowork E2E verification checklist"
```

---

## Deferred (not in this plan)

Two-way reviews · QR check-in · host payout UI · calendar/day-time variable pricing · unifying all booking systems · payment capture integration beyond hold (`/accepted`, `/declined` use existing `updateTransactionStatus` semantics).