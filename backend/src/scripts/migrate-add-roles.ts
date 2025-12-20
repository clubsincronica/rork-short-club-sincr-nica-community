import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || '';

if (!connectionString) {
    console.error('❌ DATABASE_URL not set. Cannot run migration.');
    process.exit(1);
}

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    const client = await pool.connect();

    try {
        console.log('🔄 Starting database migration: Add roles and financial tables...');

        // 1. Add role column to users table
        console.log('📝 Adding role column to users table...');
        await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'
    `);
        console.log('✅ Role column added');

        // 2. Create bank_accounts table
        console.log('📝 Creating bank_accounts table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS bank_accounts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        account_type TEXT NOT NULL,
        account_number TEXT NOT NULL,
        account_holder_name TEXT NOT NULL,
        bank_name TEXT,
        country_code TEXT NOT NULL,
        is_primary BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
        console.log('✅ bank_accounts table created');

        // 3. Create transactions table
        console.log('📝 Creating transactions table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER,
        total_amount DECIMAL(10,2) NOT NULL,
        app_fee_amount DECIMAL(10,2) NOT NULL,
        provider_amount DECIMAL(10,2) NOT NULL,
        provider_id INTEGER NOT NULL REFERENCES users(id),
        buyer_id INTEGER NOT NULL REFERENCES users(id),
        payment_provider TEXT NOT NULL,
        payment_id TEXT,
        status TEXT DEFAULT 'pending',
        currency TEXT DEFAULT 'ARS',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
        console.log('✅ transactions table created');

        // 4. Create indexes
        console.log('📝 Creating indexes...');
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bank_accounts_user 
      ON bank_accounts(user_id)
    `);
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_provider 
      ON transactions(provider_id)
    `);
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_buyer 
      ON transactions(buyer_id)
    `);
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_status 
      ON transactions(status)
    `);
        console.log('✅ Indexes created');

        console.log('🎉 Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

migrate().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
