import express, { Request, Response } from 'express';
import { authenticateJWT } from '../middleware/security';
import { requireSuperUser } from '../middleware/roles';

const router = express.Router();

// All admin routes require authentication and superuser role
router.use(authenticateJWT);
router.use(requireSuperUser());

/**
 * GET /api/admin/stats
 * Returns overall platform statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
    try {
        const pgClient = require('../db/postgres-client');

        // Get total users
        const usersResult = await pgClient.query('SELECT COUNT(*) as count FROM users');
        const totalUsers = parseInt(usersResult[0]?.count || '0');

        // Get total transactions
        const transactionsResult = await pgClient.query("SELECT COUNT(*) as count FROM transactions WHERE status IN ($1, $2, $3)", ['completed', 'succeeded', 'approved']);
        const totalTransactions = parseInt(transactionsResult[0]?.count || '0');

        // Get total revenue (app fees)
        const revenueResult = await pgClient.query("SELECT SUM(app_fee_amount) as total FROM transactions WHERE status IN ($1, $2, $3)", ['completed', 'succeeded', 'approved']);
        const totalRevenue = parseFloat(revenueResult[0]?.total || '0');

        // Get total events
        const eventsResult = await pgClient.query('SELECT COUNT(*) as count FROM events');
        const totalEvents = parseInt(eventsResult[0]?.count || '0');

        // Get total conversations
        const conversationsResult = await pgClient.query('SELECT COUNT(*) as count FROM conversations');
        const totalConversations = parseInt(conversationsResult[0]?.count || '0');

        res.json({
            users: {
                total: totalUsers,
            },
            transactions: {
                total: totalTransactions,
            },
            revenue: {
                total: totalRevenue,
                currency: 'ARS',
            },
            events: {
                total: totalEvents,
            },
            conversations: {
                total: totalConversations,
            },
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

/**
 * GET /api/admin/revenue
 * Returns detailed revenue breakdown
 */
router.get('/revenue', async (req: Request, res: Response) => {
    try {
        const pgClient = require('../db/postgres-client');

        // Get revenue by payment provider
        const byProviderResult = await pgClient.query(`
      SELECT 
        payment_provider,
        COUNT(*) as transaction_count,
        SUM(app_fee_amount) as total_fees,
        SUM(total_amount) as total_volume
      FROM transactions
      WHERE status IN ($1, $2, $3)
      GROUP BY payment_provider
    `, ['completed', 'succeeded', 'approved']);

        // Get revenue by month (last 12 months)
        const byMonthResult = await pgClient.query(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as transaction_count,
        SUM(app_fee_amount) as total_fees,
        SUM(total_amount) as total_volume
      FROM transactions
      WHERE status IN ($1, $2, $3) AND created_at >= NOW() - INTERVAL '12 months'
      GROUP BY month
      ORDER BY month DESC
    `, ['completed', 'succeeded', 'approved']);

        res.json({
            byProvider: byProviderResult || [],
            byMonth: byMonthResult || [],
        });
    } catch (error) {
        console.error('Admin revenue error:', error);
        res.status(500).json({ error: 'Failed to fetch revenue data' });
    }
});

/**
 * GET /api/admin/users
 * Returns paginated user list
 */
router.get('/users', async (req: Request, res: Response) => {
    try {
        const pgClient = require('../db/postgres-client');
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = (page - 1) * limit;

        const users = await pgClient.query(`
      SELECT id, email, name, role, is_host, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

        const countResult = await pgClient.query('SELECT COUNT(*) as count FROM users');
        const total = parseInt(countResult[0]?.count || '0');

        res.json({
            users: users || [],
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Admin users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

/**
 * GET /api/admin/transactions
 * Returns paginated transaction history
 */
router.get('/transactions', async (req: Request, res: Response) => {
    try {
        const pgClient = require('../db/postgres-client');
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = (page - 1) * limit;

        const transactions = await pgClient.query(`
      SELECT 
        t.*,
        p.name as provider_name,
        b.name as buyer_name
      FROM transactions t
      LEFT JOIN users p ON t.provider_id = p.id
      LEFT JOIN users b ON t.buyer_id = b.id
      ORDER BY t.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

        const countResult = await pgClient.query('SELECT COUNT(*) as count FROM transactions');
        const total = parseInt(countResult[0]?.count || '0');

        res.json({
            transactions: transactions || [],
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Admin transactions error:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

/**
 * POST /api/admin/remove-user
 * Blocks a user's email and deletes their account
 */
router.post('/remove-user', async (req: Request, res: Response) => {
    try {
        const pgClient = require('../db/postgres-client');
        const { email } = req.body;
        if (!email || typeof email !== 'string') {
            return res.status(400).json({ error: 'Email is required' });
        }
        await pgClient.query(`CREATE TABLE IF NOT EXISTS blocked_emails (email TEXT PRIMARY KEY, blocked_at TIMESTAMP DEFAULT NOW())`);
        await pgClient.query(`INSERT INTO blocked_emails (email) VALUES ($1) ON CONFLICT (email) DO NOTHING`, [email]);
        const result = await pgClient.query('DELETE FROM users WHERE email = $1 RETURNING id, email, name', [email]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'No user found for email' });
        }
        res.json({ success: true, deleted: result.rows[0] });
    } catch (error) {
        console.error('Admin remove-user error:', error);
        res.status(500).json({ error: 'Failed to remove user' });
    }
});

/**
 * POST /api/admin/unblock-user
 * Removes a user's email from the blocked list
 */
router.post('/unblock-user', async (req: Request, res: Response) => {
    try {
        const pgClient = require('../db/postgres-client');
        const { email } = req.body;
        if (!email || typeof email !== 'string') {
            return res.status(400).json({ error: 'Email is required' });
        }
        await pgClient.query('DELETE FROM blocked_emails WHERE email = $1', [email]);
        res.json({ success: true });
    } catch (error) {
        console.error('Admin unblock-user error:', error);
        res.status(500).json({ error: 'Failed to unblock user' });
    }
});

/**
 * GET /api/admin/settings
 * Returns current platform settings (commission rate, etc.)
 */
router.get('/settings', async (req: Request, res: Response) => {
    try {
        const pgClient = require('../db/postgres-client');
        const rows = await pgClient.query('SELECT key, value FROM platform_settings');
        const settings = Object.fromEntries((rows || []).map((r: any) => [r.key, r.value]));
        res.json(settings);
    } catch (error) {
        console.error('Admin settings GET error:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

/**
 * PUT /api/admin/settings
 * Updates platform settings. Accepts { commission_rate: number (0–1) }.
 */
router.put('/settings', async (req: Request, res: Response) => {
    try {
        const pgClient = require('../db/postgres-client');
        const { commission_rate } = req.body;

        if (commission_rate === undefined) {
            return res.status(400).json({ error: 'commission_rate is required' });
        }

        const rate = parseFloat(commission_rate);
        if (isNaN(rate) || rate < 0 || rate > 1) {
            return res.status(400).json({ error: 'commission_rate must be a number between 0 and 1' });
        }

        await pgClient.query(
            `INSERT INTO platform_settings (key, value, updated_at)
             VALUES ('commission_rate', $1, NOW())
             ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
            [rate.toString()]
        );

        res.json({ success: true, commission_rate: rate });
    } catch (error) {
        console.error('Admin settings PUT error:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

/**
 * GET /api/admin/blocked-emails
 * Returns list of blocked emails
 */
router.get('/blocked-emails', async (req: Request, res: Response) => {
    try {
        const pgClient = require('../db/postgres-client');
        const result = await pgClient.query('SELECT email FROM blocked_emails');
        const rows: any[] = Array.isArray(result) ? result : (result.rows || []);
        return res.json({ emails: rows.map((r: any) => r.email) });
    } catch (err) {
        console.error('Error fetching blocked emails:', err);
        return res.status(500).json({ error: 'Error fetching blocked emails' });
    }
});

export default router;
