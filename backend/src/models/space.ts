import { query } from '../db/postgres-client';

export interface SpaceRow {
    id: number;
    owner_id: number;
    title: string;
    description?: string | null;
    location?: string | null;
    images?: string | any[];
    amenities?: string | any[];
    calendar_mode: string;
    is_published: boolean;
    rating: number;
    review_count: number;
    tags?: string | any[];
    created_at?: string;
    updated_at?: string;
}

export interface SubSpaceRow {
    id: number;
    space_id: number;
    title: string;
    description?: string | null;
    type: string;
    capacity: number;
    features?: string | any[];
    images?: string | any[];
    price_hour?: number | null;
    price_day?: number | null;
    price_week?: number | null;
    price_month?: number | null;
    billing_units?: string | any[];
    is_active: boolean;
    floor_label?: string | null;
    calendar_mode: string;
    color?: string | null;
    instant_book: boolean;
    business_hours?: string | any[];
    slot_granularity: number;
    min_advance: number;
    max_duration: number;
    created_at?: string;
    updated_at?: string;
}

export interface CreateSpaceInput {
    ownerId: number;
    title: string;
    description?: string;
    location?: string;
    images?: any[];
    amenities?: any[];
    calendarMode?: string;
    tags?: any[];
}

export interface SpaceUpdate {
    title?: string;
    description?: string | null;
    location?: string | null;
    images?: any[];
    amenities?: any[];
    calendarMode?: string;
    isPublished?: boolean;
    rating?: number;
    reviewCount?: number;
    tags?: any[];
}

export interface CreateSubSpaceInput {
    spaceId: number;
    title: string;
    description?: string;
    type?: string;
    capacity?: number;
    features?: any[];
    images?: any[];
    priceHour?: number;
    priceDay?: number;
    priceWeek?: number;
    priceMonth?: number;
    billingUnits?: any[];
    isActive?: boolean;
    floorLabel?: string;
    calendarMode?: string;
    color?: string;
    instantBook?: boolean;
    businessHours?: any[];
    slotGranularity?: number;
    minAdvance?: number;
    maxDuration?: number;
}

export interface SubSpaceUpdate {
    title?: string;
    description?: string | null;
    type?: string;
    capacity?: number;
    features?: any[];
    images?: any[];
    priceHour?: number;
    priceDay?: number;
    priceWeek?: number;
    priceMonth?: number;
    billingUnits?: any[];
    isActive?: boolean;
    floorLabel?: string;
    calendarMode?: string;
    color?: string;
    instantBook?: boolean;
    businessHours?: any[];
    slotGranularity?: number;
    minAdvance?: number;
    maxDuration?: number;
}

const SPACE_JSON_COLUMNS = ['images', 'amenities', 'tags'];
const SUBSPACE_JSON_COLUMNS = ['features', 'images', 'billing_units', 'business_hours'];

const SPACE_COLUMNS: Record<string, string> = {
    title: 'title',
    description: 'description',
    location: 'location',
    images: 'images',
    amenities: 'amenities',
    calendarMode: 'calendar_mode',
    isPublished: 'is_published',
    rating: 'rating',
    reviewCount: 'review_count',
    tags: 'tags',
};

const SUBSPACE_COLUMNS: Record<string, string> = {
    title: 'title',
    description: 'description',
    type: 'type',
    capacity: 'capacity',
    features: 'features',
    images: 'images',
    priceHour: 'price_hour',
    priceDay: 'price_day',
    priceWeek: 'price_week',
    priceMonth: 'price_month',
    billingUnits: 'billing_units',
    isActive: 'is_active',
    floorLabel: 'floor_label',
    calendarMode: 'calendar_mode',
    color: 'color',
    instantBook: 'instant_book',
    businessHours: 'business_hours',
    slotGranularity: 'slot_granularity',
    minAdvance: 'min_advance',
    maxDuration: 'max_duration',
};

export function parseSpaceRow(row: SpaceRow): SpaceRow {
    const parsed: SpaceRow = { ...row };
    for (const key of SPACE_JSON_COLUMNS) {
        const value = (parsed as any)[key];
        if (typeof value === 'string') {
            try {
                (parsed as any)[key] = JSON.parse(value || '[]');
            } catch {
                (parsed as any)[key] = [];
            }
        }
    }
    return parsed;
}

export function parseSubSpaceRow(row: SubSpaceRow): SubSpaceRow {
    const parsed: SubSpaceRow = { ...row };
    for (const key of SUBSPACE_JSON_COLUMNS) {
        const value = (parsed as any)[key];
        if (typeof value === 'string') {
            try {
                (parsed as any)[key] = JSON.parse(value || '[]');
            } catch {
                (parsed as any)[key] = [];
            }
        }
    }
    return parsed;
}

export async function createSpace(input: CreateSpaceInput): Promise<{ lastID: number }> {
    const res = await query(
        `INSERT INTO spaces (
      owner_id, title, description, location, images, amenities, calendar_mode, tags
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [
            input.ownerId,
            input.title,
            input.description || null,
            input.location || null,
            JSON.stringify(input.images ?? []),
            JSON.stringify(input.amenities ?? []),
            input.calendarMode || 'unified',
            JSON.stringify(input.tags ?? []),
        ]
    );
    return { lastID: res[0]?.id ?? null };
}

export async function getPublishedSpaces(filters?: { type?: string; capacity?: number; maxHourlyPrice?: number }): Promise<SpaceRow[]> {
    const clauses: string[] = ['s.is_published = true'];
    const params: any[] = [];
    let joinSql = '';

    if (filters?.type !== undefined) {
        params.push(filters.type);
        clauses.push(`su.type = $${params.length}`);
        joinSql = ` JOIN subspaces su ON su.space_id = s.id`;
    }
    if (filters?.capacity !== undefined) {
        params.push(filters.capacity);
        clauses.push(`su.capacity >= $${params.length}`);
        joinSql = joinSql || ` JOIN subspaces su ON su.space_id = s.id`;
    }
    if (filters?.maxHourlyPrice !== undefined) {
        params.push(filters.maxHourlyPrice);
        clauses.push(`EXISTS (SELECT 1 FROM subspaces WHERE space_id = s.id AND price_hour <= $${params.length})`);
    }

    const sql = `SELECT DISTINCT s.* FROM spaces s${joinSql} WHERE ${clauses.join(' AND ')} ORDER BY s.created_at DESC`;
    const rows = await query(sql, params);
    return (rows || []).map(parseSpaceRow);
}

export async function getSpaceById(id: number): Promise<SpaceRow | null> {
    const rows = await query(`SELECT * FROM spaces WHERE id = $1 LIMIT 1`, [id]);
    return rows[0] ? parseSpaceRow(rows[0]) : null;
}

export async function getSpacesByOwner(ownerId: number): Promise<SpaceRow[]> {
    const rows = await query(`SELECT * FROM spaces WHERE owner_id = $1 ORDER BY created_at DESC`, [ownerId]);
    return (rows || []).map(parseSpaceRow);
}

export async function updateSpace(id: number, updates: SpaceUpdate): Promise<void> {
    const setClauses: string[] = [];
    const params: any[] = [];
    for (const [key, value] of Object.entries(updates)) {
        const column = SPACE_COLUMNS[key];
        if (!column) continue;
        params.push(SPACE_JSON_COLUMNS.includes(column) ? JSON.stringify(value ?? []) : value);
        setClauses.push(`${column} = $${params.length}`);
    }
    if (setClauses.length === 0) return;
    params.push(id);
    await query(`UPDATE spaces SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${params.length}`, params);
}

export async function deleteSpace(id: number): Promise<void> {
    await query(`DELETE FROM spaces WHERE id = $1`, [id]);
}

export async function setSpacePublished(id: number, isPublished: boolean): Promise<void> {
    await query(`UPDATE spaces SET is_published = $1, updated_at = NOW() WHERE id = $2`, [isPublished, id]);
}

export async function createSubSpace(input: CreateSubSpaceInput): Promise<{ lastID: number }> {
    const res = await query(
        `INSERT INTO subspaces (
      space_id, title, description, type, capacity, features, images,
      price_hour, price_day, price_week, price_month, billing_units,
      is_active, floor_label, calendar_mode, color, instant_book, business_hours,
      slot_granularity, min_advance, max_duration
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21) RETURNING id`,
        [
            input.spaceId,
            input.title,
            input.description || null,
            input.type || 'other',
            input.capacity ?? 1,
            JSON.stringify(input.features ?? []),
            JSON.stringify(input.images ?? []),
            input.priceHour ?? null,
            input.priceDay ?? null,
            input.priceWeek ?? null,
            input.priceMonth ?? null,
            JSON.stringify(input.billingUnits ?? ['hour']),
            input.isActive ?? true,
            input.floorLabel || null,
            input.calendarMode || 'unified',
            input.color || null,
            input.instantBook ?? false,
            JSON.stringify(input.businessHours ?? []),
            input.slotGranularity ?? 30,
            input.minAdvance ?? 120,
            input.maxDuration ?? 8,
        ]
    );
    return { lastID: res[0]?.id ?? null };
}

export async function updateSubSpace(subSpaceId: number, updates: SubSpaceUpdate): Promise<void> {
    const setClauses: string[] = [];
    const params: any[] = [];
    for (const [key, value] of Object.entries(updates)) {
        const column = SUBSPACE_COLUMNS[key];
        if (!column) continue;
        params.push(SUBSPACE_JSON_COLUMNS.includes(column) ? JSON.stringify(value ?? []) : value);
        setClauses.push(`${column} = $${params.length}`);
    }
    if (setClauses.length === 0) return;
    params.push(subSpaceId);
    await query(`UPDATE subspaces SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${params.length}`, params);
}

export async function deleteSubSpace(subSpaceId: number): Promise<void> {
    await query(`DELETE FROM subspaces WHERE id = $1`, [subSpaceId]);
}

export async function getSubSpacesBySpace(spaceId: number): Promise<SubSpaceRow[]> {
    const rows = await query(`SELECT * FROM subspaces WHERE space_id = $1 ORDER BY id`, [spaceId]);
    return (rows || []).map(parseSubSpaceRow);
}

export async function getSubSpaceById(id: number): Promise<SubSpaceRow | null> {
    const rows = await query(`SELECT * FROM subspaces WHERE id = $1 LIMIT 1`, [id]);
    return rows[0] ? parseSubSpaceRow(rows[0]) : null;
}

export async function getSubSpaceBySpaceId(spaceId: number, subSpaceId: number): Promise<SubSpaceRow | null> {
    const rows = await query(`SELECT * FROM subspaces WHERE space_id = $1 AND id = $2 LIMIT 1`, [spaceId, subSpaceId]);
    return rows[0] ? parseSubSpaceRow(rows[0]) : null;
}