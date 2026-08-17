import { query } from '../db/postgres-client';
jest.mock('../db/postgres-client', () => ({
  query: jest.fn(),
}));
const mockedQuery = query as any;

import {
  createSpace, getSpaceById, getPublishedSpaces, updateSpace, deleteSpace,
  createSubSpace, updateSubSpace, deleteSubSpace, getSubSpacesBySpace,
  setSpacePublished, getSpacesByOwner, getSubSpaceById, getSubSpaceBySpaceId,
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

  it('getPublishedSpaces keeps publish filter and applies maxHourlyPrice EXISTS', async () => {
    mockedQuery.mockResolvedValueOnce([{ id: 1, is_published: true, title: 'A' }]);
    const rows = await getPublishedSpaces({ maxHourlyPrice: 500 });
    expect(rows[0]).toEqual({ id: 1, is_published: true, title: 'A' });
    const [sql, params] = mockedQuery.mock.calls[0];
    expect(sql).toContain('WHERE s.is_published = true');
    expect(sql).toContain('EXISTS (SELECT 1 FROM subspaces WHERE space_id = s.id AND price_hour <= $1)');
    expect(params).toEqual([500]);
  });

  it('getPublishedSpaces applies type/capacity filters via subspaces join', async () => {
    mockedQuery.mockResolvedValueOnce([{ id: 2, title: 'B' }]);
    await getPublishedSpaces({ type: 'desk', capacity: 2 });
    const [sql, params] = mockedQuery.mock.calls[0];
    expect(sql).toContain('JOIN subspaces su ON su.space_id = s.id');
    expect(sql).toContain('su.type = $1');
    expect(sql).toContain('su.capacity >= $2');
    expect(params).toEqual(['desk', 2]);
  });

  it('getPublishedSpaces ends up without filters returns all published', async () => {
    mockedQuery.mockResolvedValueOnce([]);
    await getPublishedSpaces();
    const [sql] = mockedQuery.mock.calls[0];
    expect(sql).toContain('WHERE s.is_published = true');
    expect(sql).not.toContain('JOIN');
    expect(sql).not.toContain('EXISTS');
  });

  it('updateSpace builds a dynamic SET', async () => {
    mockedQuery.mockResolvedValueOnce([]);
    await updateSpace(5, { title: 'Renamed', tags: ['a', 'b'] });
    expect(mockedQuery).toHaveBeenCalledTimes(1);
    const [sql, params] = mockedQuery.mock.calls[0];
    expect(sql).toContain('UPDATE spaces SET title = $1, tags = $2');
    expect(params).toEqual(['Renamed', '["a","b"]', 5]);
  });

  it('deleteSpace removes by id', async () => {
    mockedQuery.mockResolvedValueOnce([]);
    await deleteSpace(9);
    expect(mockedQuery).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM spaces WHERE id'),
      [9]
    );
  });

  it('createSubSpace inserts and returns lastID', async () => {
    mockedQuery.mockResolvedValueOnce([{ id: 11 }]);
    const res = await createSubSpace({ spaceId: 1, title: 'Desk 1', priceHour: 300 });
    expect(res.lastID).toBe(11);
    expect(mockedQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO subspaces'),
      expect.arrayContaining([1, 'Desk 1', 300])
    );
  });

  it('updateSubSpace updates billing_units as JSON', async () => {
    mockedQuery.mockResolvedValueOnce([]);
    await updateSubSpace(4, { billingUnits: ['hour', 'day'] });
    const [sql, params] = mockedQuery.mock.calls[0];
    expect(sql).toContain('UPDATE subspaces SET billing_units = $1');
    expect(params).toEqual(['["hour","day"]', 4]);
  });

  it('deleteSubSpace removes by id', async () => {
    mockedQuery.mockResolvedValueOnce([]);
    await deleteSubSpace(3);
    expect(mockedQuery).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM subspaces WHERE id'),
      [3]
    );
  });

  it('getSubSpacesBySpace returns parsed rows', async () => {
    mockedQuery.mockResolvedValueOnce([{ id: 1, space_id: 1, images: '["a.png"]' }]);
    const rows = await getSubSpacesBySpace(1);
    expect(rows[0]).toEqual({ id: 1, space_id: 1, images: ['a.png'] });
    expect(mockedQuery).toHaveBeenCalledWith(
      expect.stringContaining('WHERE space_id = $1'),
      [1]
    );
  });

  it('getSpacesByOwner returns owner spaces flat', async () => {
    mockedQuery.mockResolvedValueOnce([{ id: 2, owner_id: 3 }]);
    const rows = await getSpacesByOwner(3);
    expect(rows).toHaveLength(1);
    expect(mockedQuery).toHaveBeenCalledWith(
      expect.stringContaining('WHERE owner_id = $1'),
      [3]
    );
  });

  it('getSubSpaceById returns row or null', async () => {
    mockedQuery.mockResolvedValueOnce([{ id: 8, space_id: 1 }]);
    expect(await getSubSpaceById(8)).toEqual({ id: 8, space_id: 1 });
    mockedQuery.mockResolvedValueOnce([]);
    expect(await getSubSpaceById(99)).toBeNull();
  });

  it('getSubSpaceBySpaceId scopes by space and subspace', async () => {
    mockedQuery.mockResolvedValueOnce([{ id: 4, space_id: 2 }]);
    const row = await getSubSpaceBySpaceId(2, 4);
    expect(row).toEqual({ id: 4, space_id: 2 });
    expect(mockedQuery).toHaveBeenCalledWith(
      expect.stringContaining('WHERE space_id = $1 AND id = $2'),
      [2, 4]
    );
  });
});