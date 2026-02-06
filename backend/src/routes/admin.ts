import express, { Request, Response } from 'express';
import { authenticateJWT } from '../middleware/security';
import { requireSuperUser } from '../middleware/roles';

const router = express.Router();

// Middleware alias for consistency
const requireAdmin = requireSuperUser();

// All admin routes require authentication and superuser role
router.use(authenticateJWT);
router.use(requireAdmin);

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
        const transactionsResult = await pgClient.query('SELECT COUNT(*) as count FROM transactions WHERE status = $1', ['completed']);
        const totalTransactions = parseInt(transactionsResult[0]?.count || '0');

        // Get total revenue (app fees)
        const revenueResult = await pgClient.query('SELECT SUM(app_fee_amount) as total FROM transactions WHERE status = $1', ['completed']);
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
      WHERE status = $1
      GROUP BY payment_provider
    `, ['completed']);

        // Get revenue by month (last 12 months)
        const byMonthResult = await pgClient.query(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as transaction_count,
        SUM(app_fee_amount) as total_fees,
        SUM(total_amount) as total_volume
      FROM transactions
      WHERE status = $1 AND created_at >= NOW() - INTERVAL '12 months'
      GROUP BY month
      ORDER BY month DESC
    `, ['completed']);

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
 * GET /api/admin/blocked-emails
 * Returns list of blocked email addresses
 */
router.get('/blocked-emails', async (req: Request, res: Response) => {
    try {
        const pgClient = require('../db/postgres-client');
        const result = await pgClient.query('SELECT email FROM blocked_emails');
        res.json({ emails: result.map((r: any) => r.email) });
    } catch (error) {
        console.error('Error fetching blocked emails:', error);
        res.status(500).json({ error: 'Error fetching blocked emails' });
    }
});

/**
 * POST /api/admin/remove-user
 * Blocks and deletes a user by email
 */
router.post('/remove-user', async (req: Request, res: Response) => {
    try {
        const pgClient = require('../db/postgres-client');
        const { email } = req.body;

        if (!email || typeof email !== 'string') {
            return res.status(400).json({ error: 'Valid email required' });
        }

        // Block user by adding to blocked_emails table (create if not exists)
        await pgClient.query(`CREATE TABLE IF NOT EXISTS blocked_emails (email TEXT PRIMARY KEY, blocked_at TIMESTAMP DEFAULT NOW())`);
        await pgClient.query(`INSERT INTO blocked_emails (email) VALUES ($1) ON CONFLICT (email) DO NOTHING`, [email]);

        // Delete user from users table
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
 * Unblocks a user by removing from blocked_emails
 */
router.post('/unblock-user', async (req: Request, res: Response) => {
    try {
        const pgClient = require('../db/postgres-client');
        const { email } = req.body;

        if (!email || typeof email !== 'string') {
            return res.status(400).json({ error: 'Valid email required' });
        }

        const result = await pgClient.query('DELETE FROM blocked_emails WHERE email = $1 RETURNING email', [email]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Email not found in blocked list' });
        }

        res.json({ success: true, unblocked: result.rows[0].email });
    } catch (error) {
        console.error('Admin unblock-user error:', error);
        res.status(500).json({ error: 'Failed to unblock user' });
    }
});

// Config Management Endpoint
router.get('/config', async (req: Request, res: Response) => {
    try {
        const { getAllConfig } = require('../models/system-config');
        const config = await getAllConfig();
        res.json(config);
    } catch (error) {
        console.error('Admin config error:', error);
        res.status(500).json({ error: 'Failed to fetch config' });
    }
});

router.put('/config', async (req: Request, res: Response) => {
    try {
        const { setConfigValue } = require('../models/system-config');
        const { key, value, description } = req.body;

        if (!key || value === undefined) {
            return res.status(400).json({ error: 'Key and value required' });
        }

        await setConfigValue(key, value.toString(), description);
        res.json({ success: true, key, value });
    } catch (error) {
        console.error('Admin update config error:', error);
        res.status(500).json({ error: 'Failed to update config' });
    }
});

export default router;
