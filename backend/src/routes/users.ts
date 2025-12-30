import express, { Request, Response } from 'express';
import { userQueries } from '../models/database-sqljs';
import { getJWTSecret } from '../config/env';
import {
  addBankAccount,
  getBankAccountsByUserId,
  updateBankAccount,
  deleteBankAccount
} from '../models/bank-account';
import { authLimiter, strictLimiter } from '../middleware/rateLimiter';
import { parseIntSafe, parseFloatSafe, authenticateJWT } from '../middleware/security';
import {
  validateAuth,
  validateUserId,
  validateUpdateUser,
  validateNearbyUsers,
  validateSearch,
  handleValidationErrors,
} from '../middleware/validation';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Register/Login - Create or get user (with rate limiting and validation)
router.post('/auth', authLimiter, validateAuth, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    let { email, password, name, avatar, bio, location, latitude, longitude, phone, website, interests, services, isHost } = req.body;
    console.log(`[AUTH DEBUG] Received login request for email: '${email}'`);
    // Log the raw request body for debugging
    console.log('[AUTH DEBUG] Raw request body:', req.body);

    // Default coordinates if not provided (so users are always discoverable)
    if (latitude === undefined || latitude === null) {
      // Example: assign by email for known users, else default to SF
      if (email === 'matias.cazeaux@gmail.com') latitude = -38.02;
      else if (email === 'eularra@gmail.com') latitude = 40.4168;
      else if (email === 'tom_weasley@hotmail.com') latitude = 37.7749;
      else latitude = 37.7749;
    }
    if (longitude === undefined || longitude === null) {
      if (email === 'matias.cazeaux@gmail.com') longitude = -57.53;
      else if (email === 'eularra@gmail.com') longitude = -3.7038;
      else if (email === 'tom_weasley@hotmail.com') longitude = -122.4194;
      else longitude = -122.4194;
    }

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Always try to get or create user by email
    let user: any = await userQueries.getUserByEmail(email);
    let isNewUser = false;

    // Block both creation and login for matiascazeaux@gmail.com (no-dot)
    if (email === 'matiascazeaux@gmail.com') {
      console.warn(`[AUTH BLOCKED] Attempt to create or login blocked user: '${email}'. Returning error.`);
      return res.status(403).json({ error: 'This user is blocked. Please use matias.cazeaux@gmail.com.' });
    }
    if (!user) {
      // Extra debug: If the login request is for matias.cazeaux@gmail.com, log if the no-dot user is being created
      if (email === 'matias.cazeaux@gmail.com') {
        console.log(`[AUTH DEBUG] Login request for matias.cazeaux@gmail.com. No user found, creating new user.`);
      } else {
        console.log(`[AUTH DEBUG] No user found for email: '${email}'. Creating new user.`);
      }
      // Create new user (even if password is blank)
      const passwordHash = password ? await bcrypt.hash(password, 10) : '';
      const result = await userQueries.createUser(
        email,
        passwordHash || null,
        name || 'User',
        avatar || undefined,
        bio || undefined,
        location || undefined,
        latitude || undefined,
        longitude || undefined,
        phone || undefined,
        website || undefined,
        interests ? JSON.stringify(interests) : undefined,
        services ? JSON.stringify(services) : undefined,
        isHost ? 1 : 0
      );
      user = await userQueries.getUserById(result.lastID);
      isNewUser = true;
      console.log(`[AUTH DEBUG] Created new user: ${JSON.stringify(user)}`);
      console.log(`[AUTH DEBUG] Email used for user creation: '${email}'`);
    } else {
      // Existing user: enforce password rules
      if (user.password_hash && user.password_hash.length > 0) {
        // User has a password set, require correct password
        if (!password || !(await bcrypt.compare(password, user.password_hash))) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
      } else {
        // User has no password set (legacy or OAuth), only allow login if no password is provided
        if (password) {
          return res.status(401).json({ error: 'Password not set for this user, login without password.' });
        }
      }
    }

    // If user still not found, fail (should never happen)
    if (!user || !user.id) {
      return res.status(500).json({ error: 'Failed to create or retrieve user' });
    }

    // Parse JSON fields
    if (user.interests) user.interests = JSON.parse(user.interests);
    if (user.services) user.services = JSON.parse(user.services);
    user.isHost = user.is_host === 1;

    // Generate JWT token with proper secret and include role
    const jwtSecret = getJWTSecret();
    const token = jwt.sign({
      userId: user.id,
      email: user.email,
      role: user.role || 'user'
    }, jwtSecret, { expiresIn: '30d' });
    console.log(`[AUTH DEBUG] Email returned in token: '${user.email}'`);
    res.json({ user, token, isNewUser });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Get all users (for community directory)
router.get('/users', async (req: Request, res: Response) => {
  try {
    const users: any[] = await userQueries.getAllUsers();

    // Parse JSON fields
    users.forEach(user => {
      if (user.interests) user.interests = JSON.parse(user.interests);
      if (user.services) user.services = JSON.parse(user.services);
      user.isHost = user.is_host === 1;
    });

    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get user profile
router.get('/users/:id', validateUserId, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const userId = parseIntSafe(req.params.id, 'user ID');
    const user: any = await userQueries.getUserById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Parse JSON fields
    if (user.interests) user.interests = JSON.parse(user.interests);
    if (user.services) user.services = JSON.parse(user.services);
    user.isHost = user.is_host === 1;

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Update user profile (with stricter rate limiting for security)
router.put('/users/:id', strictLimiter, validateUserId, validateUpdateUser, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const userId = parseIntSafe(req.params.id, 'user ID');
    const { name, avatar, bio, location, latitude, longitude, phone, website, interests, services, isHost } = req.body;
    await userQueries.updateUser(
      userId,
      name,
      avatar,
      bio,
      location,
      latitude,
      longitude,
      phone,
      website,
      interests ? JSON.stringify(interests) : undefined,
      services ? JSON.stringify(services) : undefined,
      isHost ? 1 : 0
    );

    const user: any = await userQueries.getUserById(userId);

    // Parse JSON fields
    if (user.interests) user.interests = JSON.parse(user.interests);
    if (user.services) user.services = JSON.parse(user.services);
    user.isHost = user.is_host === 1;

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Get nearby users
router.get('/users/nearby/:latitude/:longitude', validateNearbyUsers, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const latitude = parseFloatSafe(req.params.latitude, 'latitude', -90, 90);
    const longitude = parseFloatSafe(req.params.longitude, 'longitude', -180, 180);
    const radius = req.query.radius ? parseFloatSafe(req.query.radius, 'radius', 0.1, 10000) : 50;
    const limit = req.query.limit ? parseIntSafe(req.query.limit, 'limit', 1, 100) : 20;

    const users: any[] = await userQueries.getNearbyUsers(
      latitude,
      longitude,
      radius,
      limit
    );

    // Parse JSON fields
    users.forEach(user => {
      if (user.interests) user.interests = JSON.parse(user.interests);
      if (user.services) user.services = JSON.parse(user.services);
      user.isHost = user.is_host === 1;
    });

    res.json(users);
  } catch (error) {
    // Log the full error object for debugging
    console.error('Nearby users error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    const errMsg = (error instanceof Error && error.message) ? error.message : 'Failed to get nearby users';
    res.status(500).json({ error: errMsg });
  }
});

// Search users
router.get('/users/search/:query', validateSearch, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const users: any[] = await userQueries.searchUsers(req.params.query);

    // Parse JSON fields
    users.forEach(user => {
      if (user.interests) user.interests = JSON.parse(user.interests);
      if (user.services) user.services = JSON.parse(user.services);
      user.isHost = user.is_host === 1;
    });

    res.json(users);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Bank Account Endpoints

// Get all bank accounts for the current user
router.get('/users/me/bank-accounts', authenticateJWT, async (req: Request | any, res: Response) => {
  try {
    const userId = req.user.userId;
    const accounts = await getBankAccountsByUserId(userId);
    res.json(accounts);
  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    res.status(500).json({ error: 'Failed to fetch bank accounts' });
  }
});

// Add a new bank account
router.post('/users/me/bank-accounts', authenticateJWT, async (req: Request | any, res: Response) => {
  try {
    const userId = req.user.userId;
    const accountData = { ...req.body, userId };
    const result = await addBankAccount(accountData);
    res.status(201).json({ id: result.lastID, ...accountData });
  } catch (error) {
    console.error('Error adding bank account:', error);
    res.status(500).json({ error: 'Failed to add bank account' });
  }
});

// Update a bank account
router.put('/users/me/bank-accounts/:id', authenticateJWT, async (req: Request | any, res: Response) => {
  try {
    const userId = req.user.userId;
    const accountId = parseInt(req.params.id);
    await updateBankAccount(accountId, userId, req.body);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating bank account:', error);
    res.status(500).json({ error: 'Failed to update bank account' });
  }
});

// Delete a bank account
router.delete('/users/me/bank-accounts/:id', authenticateJWT, async (req: Request | any, res: Response) => {
  try {
    const userId = req.user.userId;
    const accountId = parseInt(req.params.id);
    await deleteBankAccount(accountId, userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting bank account:', error);
    res.status(500).json({ error: 'Failed to delete bank account' });
  }
});

export default router;
