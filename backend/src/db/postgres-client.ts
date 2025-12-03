import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || '';

if (!connectionString) {
  // eslint-disable-next-line no-console
  console.warn('Postgres connection string (DATABASE_URL) not set. Postgres client will be inactive.');
}

const pool = new Pool({
  connectionString: connectionString || undefined,
  // If using self-signed certs on some hosts you might need:
  // ssl: { rejectUnauthorized: false }
});

export const query = async (text: string, params?: any[]) => {
  if (!connectionString) throw new Error('DATABASE_URL not set');
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res.rows;
  } finally {
    client.release();
  }
};

export const getPool = () => pool;

export default { query, getPool };
