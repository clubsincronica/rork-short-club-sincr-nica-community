/**
 * Centralized logging utility
 * In development: logs to console
 * In production: logs only errors and warnings (could be extended to external service)
 */

const isDevelopment = __DEV__ || process.env.NODE_ENV !== 'production';

export const logger = {
  /**
   * Debug logging - only in development
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Info logging - only in development
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[INFO]', ...args);
    }
  },

  /**
   * Warning logging - always logged
   */
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
  },

  /**
   * Error logging - always logged
   */
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  },

  /**
   * Success logging - only in development
   */
  success: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[SUCCESS] ✅', ...args);
    }
  },
};

// Export for backwards compatibility
export default logger;
