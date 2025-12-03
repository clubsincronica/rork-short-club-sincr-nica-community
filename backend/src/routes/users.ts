import express, { Request, Response } from 'express';
import { userQueries } from '../models/database-sqljs';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Register/Login - Create or get user
router.post('/auth', async (req: Request, res: Response) => {
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

    // Generate JWT token
    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });

    res.json({ user, token });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Get user profile
router.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const user: any = await userQueries.getUserById(parseInt(req.params.id));

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

// Update user profile
router.put('/users/:id', async (req: Request, res: Response) => {
  try {
    const { name, avatar, bio, location, latitude, longitude, phone, website, interests, services, isHost } = req.body;
    await userQueries.updateUser(
      parseInt(req.params.id),
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

    const user: any = await userQueries.getUserById(parseInt(req.params.id));
    
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
router.get('/users/nearby/:latitude/:longitude', async (req: Request, res: Response) => {
  try {
    const { latitude, longitude } = req.params;
    const radius = parseFloat(req.query.radius as string) || 50; // Default 50km
    const limit = parseInt(req.query.limit as string) || 20;

    const users: any[] = await userQueries.getNearbyUsers(
      parseFloat(latitude),
      parseFloat(longitude),
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
router.get('/users/search/:query', async (req: Request, res: Response) => {
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
