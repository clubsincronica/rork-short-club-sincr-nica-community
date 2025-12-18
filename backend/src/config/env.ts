import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Required environment variables
const requiredEnvVars = [
  'JWT_SECRET',
  'PORT',
] as const;

// Optional but recommended for production
const recommendedEnvVars = [
  'DATABASE_URL',
  'NODE_ENV',
] as const;

/**
 * Validates that all required environment variables are set
 * Throws an error if any required variable is missing
 */
export function validateEnvironment(): void {
  const missingVars: string[] = [];
  
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }
  
  // Warn about missing recommended variables
  const missingRecommended: string[] = [];
  for (const varName of recommendedEnvVars) {
    if (!process.env[varName]) {
      missingRecommended.push(varName);
    }
  }
  
  if (missingRecommended.length > 0) {
    console.warn(
      `⚠️  Missing recommended environment variables: ${missingRecommended.join(', ')}`
    );
  }
  
  console.log('✅ Environment variables validated successfully');
}

/**
 * Get JWT secret - throws error if not set (should never happen after validation)
 */
export function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set in environment variables');
  }
  return secret;
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
}
