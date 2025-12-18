import express, { Request, Response } from 'express';
import { userQueries } from '../models/database-sqljs';
import { getJWTSecret } from '../config/env';
import { authLimiter, strictLimiter } from '../middleware/rateLimiter';
import { parseIntSafe, parseFloatSafe } from '../middleware/security';
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
    const { email, password, name, avatar, bio, location, latitude, longitude, phone, website, interests, services, isHost } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    let user: any = await userQueries.getUserByEmail(email);

    if (!user) {
      // Create new user
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
    } else if (password) {
      // Verify password if provided
      if (!user.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }

    // Parse JSON fields
    if (user.interests) user.interests = JSON.parse(user.interests);
    if (user.services) user.services = JSON.parse(user.services);
    user.isHost = user.is_host === 1;

    // Generate JWT token with proper secret
    const jwtSecret = getJWTSecret();
    const token = jwt.sign({ userId: user.id, email: user.email }, jwtSecret, { expiresIn: '30d' });

    res.json({ user, token });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
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
    console.error('Nearby users error:', error);
    res.status(500).json({ error: 'Failed to get nearby users' });
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

export default router;
