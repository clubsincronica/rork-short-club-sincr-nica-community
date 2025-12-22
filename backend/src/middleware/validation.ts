import { body, param, query, validationResult, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

/**
 * Validation error handler
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors.array() 
    });
  }
  next();
};

/**
 * Auth endpoint validation
 */
export const validateAuth: ValidationChain[] = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required'),
  body('password')
    .optional()
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be 8-128 characters'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be 1-100 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must be max 500 characters'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location must be max 100 characters'),
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number format'),
  body('website')
    .optional()
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('Invalid website URL'),
  body('isHost')
    .optional()
    .isBoolean()
    .withMessage('isHost must be boolean'),
];

/**
 * User ID parameter validation
 */
export const validateUserId: ValidationChain[] = [
  param('id')
    .isInt({ min: 1, max: 2147483647 })
    .withMessage('Invalid user ID'),
];

/**
 * Update user validation
 */
export const validateUpdateUser: ValidationChain[] = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be 1-100 characters'),
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be valid URL'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must be max 500 characters'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location must be max 100 characters'),
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number format'),
  body('website')
    .optional()
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('Invalid website URL'),
];

/**
 * Nearby users validation
 */
export const validateNearbyUsers: ValidationChain[] = [
  param('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  param('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  query('radius')
    .optional()
    .isFloat({ min: 0.1, max: 10000 })
    .withMessage('Radius must be between 0.1 and 10000 km'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

/**
 * Search query validation
 */
export const validateSearch: ValidationChain[] = [
  param('query')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be 1-100 characters'),
];

/**
 * Conversation ID validation
 */
export const validateConversationId: ValidationChain[] = [
  param('conversationId')
    .isInt({ min: 1 })
    .withMessage('Invalid conversation ID'),
];

/**
 * Create conversation validation
 */
export const validateCreateConversation: ValidationChain[] = [
  body('user1Id')
    .isInt({ min: 1 })
    .withMessage('Invalid user1Id'),
  body('user2Id')
    .isInt({ min: 1 })
    .withMessage('Invalid user2Id'),
  body('user1Id')
    .custom((value, { req }) => value !== req.body.user2Id)
    .withMessage('Cannot create conversation with yourself'),
];

/**
 * Mark as read validation
 */
export const validateMarkAsRead: ValidationChain[] = [
  body('userId')
    .isInt({ min: 1 })
    .withMessage('Invalid userId'),
];

/**
 * Message pagination validation
 */
export const validateMessagePagination: ValidationChain[] = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];
