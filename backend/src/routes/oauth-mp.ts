import express, { Request, Response } from 'express';
import { authenticateJWT } from '../middleware/security';
import * as db from '../db/postgres-client';

const router = express.Router();

const MP_AUTH_BASE = 'https://auth.mercadopago.com/authorization';
const MP_TOKEN_URL = 'https://api.mercadopago.com/oauth/token';

// ─── GET /api/oauth/mp/connect ────────────────────────────────────────────────
// Vendor calls this (authenticated). Returns the MP authorization URL.
// The frontend opens it in a browser/WebView.
router.get('/connect', authenticateJWT, (req: any, res: Response) => {
  const appId = process.env.MERCADOPAGO_APP_ID;
  const redirectUri = process.env.MERCADOPAGO_REDIRECT_URI;

  if (!appId || !redirectUri) {
    return res.status(500).json({ error: 'MERCADOPAGO_APP_ID and MERCADOPAGO_REDIRECT_URI must be set in environment variables.' });
  }

  // `state` carries the vendor's user ID so the callback knows who to update
  const state = Buffer.from(JSON.stringify({ userId: req.user.userId })).toString('base64url');

  const url = `${MP_AUTH_BASE}?response_type=code&client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

  res.json({ url });
});

// ─── GET /api/oauth/mp/callback ───────────────────────────────────────────────
// MercadoPago redirects here after vendor approves.
// Exchange `code` for access_token and store it against the vendor's user row.
router.get('/callback', async (req: Request, res: Response) => {
  const { code, state, error } = req.query as Record<string, string>;

  if (error) {
    return res.status(400).send(`MercadoPago authorization denied: ${error}`);
  }

  if (!code || !state) {
    return res.status(400).json({ error: 'Missing code or state parameter' });
  }

  let userId: number;
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString());
    userId = parseInt(decoded.userId, 10);
    if (!userId || isNaN(userId)) throw new Error('invalid userId');
  } catch {
    return res.status(400).json({ error: 'Invalid state parameter' });
  }

  const clientId = process.env.MERCADOPAGO_APP_ID;
  const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET;
  const redirectUri = process.env.MERCADOPAGO_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return res.status(500).json({ error: 'MERCADOPAGO_APP_ID, MERCADOPAGO_CLIENT_SECRET and MERCADOPAGO_REDIRECT_URI must be set.' });
  }

  try {
    const tokenRes = await fetch(MP_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('MP token exchange failed:', err);
      return res.status(502).json({ error: 'Failed to exchange code with MercadoPago', detail: err });
    }

    const tokenData: any = await tokenRes.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    const expiresAt = new Date(Date.now() + (expires_in || 15552000) * 1000); // default 180 days

    await db.query(
      `UPDATE users
         SET mp_access_token     = $1,
             mp_refresh_token    = $2,
             mp_token_expires_at = $3,
             updated_at          = NOW()
       WHERE id = $4`,
      [access_token, refresh_token ?? null, expiresAt, userId]
    );

    // Redirect to a success deep-link / page the mobile app can detect via WebView nav
    const successUrl = process.env.MERCADOPAGO_SUCCESS_REDIRECT || 'https://clubsincronica.app/mp-connected';
    res.redirect(successUrl);
  } catch (err: any) {
    console.error('MP OAuth callback error:', err);
    res.status(500).json({ error: 'Internal error during MP OAuth exchange' });
  }
});

// ─── GET /api/oauth/mp/status ─────────────────────────────────────────────────
// Returns whether the authenticated vendor has a valid MP token.
router.get('/status', authenticateJWT, async (req: any, res: Response) => {
  try {
    const rows: any = await db.query(
      `SELECT mp_access_token, mp_token_expires_at FROM users WHERE id = $1`,
      [req.user.userId]
    );
    const user = rows[0];
    if (!user || !user.mp_access_token) {
      return res.json({ connected: false });
    }
    const expired = user.mp_token_expires_at && new Date(user.mp_token_expires_at) < new Date();
    res.json({ connected: !expired, expiresAt: user.mp_token_expires_at });
  } catch (err) {
    console.error('MP status check error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// ─── DELETE /api/oauth/mp/disconnect ──────────────────────────────────────────
// Revokes the stored token (vendor disconnects their MP account).
router.delete('/disconnect', authenticateJWT, async (req: any, res: Response) => {
  try {
    await db.query(
      `UPDATE users SET mp_access_token = NULL, mp_refresh_token = NULL, mp_token_expires_at = NULL, updated_at = NOW() WHERE id = $1`,
      [req.user.userId]
    );
    res.json({ disconnected: true });
  } catch (err) {
    console.error('MP disconnect error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

export default router;
