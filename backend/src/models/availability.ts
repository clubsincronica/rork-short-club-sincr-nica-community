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
    const [y, mo, d] = date.split('-').map(Number);
    const [h, mi] = start.split(':').map(Number);
    const cellTime = new Date(Date.UTC(y, mo - 1, d, h, mi, 0));
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