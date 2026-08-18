/**
 * Global test setup file
 * Runs before all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.PORT = '3002'; // Use different port for testing
process.env.STRIPE_SECRET_KEY = 'test-stripe-key-for-testing-only'; // Enable stripe client construction in tests

// Suppress console output during tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
// };

// Extend Jest timeout for database operations
jest.setTimeout(10000);

// Global cleanup to prevent worker process hanging
afterAll(async () => {
  // Allow pending operations to complete
  await new Promise(resolve => setTimeout(resolve, 100));
});
