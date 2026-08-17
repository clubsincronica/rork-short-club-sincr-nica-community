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