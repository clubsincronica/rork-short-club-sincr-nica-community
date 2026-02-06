import { query } from '../db/postgres-client';

export interface SystemConfig {
    key: string;
    value: string;
    description?: string;
    updated_at?: Date;
}

export async function getConfigValue(key: string, defaultValue: string = ''): Promise<string> {
    const rows = await query(
        `SELECT value FROM system_config WHERE key = $1`,
        [key]
    );
    return rows[0]?.value ?? defaultValue;
}

export async function setConfigValue(key: string, value: string, description?: string) {
    await query(
        `INSERT INTO system_config (key, value, description, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (key) DO UPDATE SET 
       value = EXCLUDED.value,
       description = COALESCE(EXCLUDED.description, system_config.description),
       updated_at = NOW()`,
        [key, value, description || null]
    );
}

export async function getAllConfig(): Promise<SystemConfig[]> {
    const rows = await query(`SELECT * FROM system_config ORDER BY key ASC`);
    return rows || [];
}
