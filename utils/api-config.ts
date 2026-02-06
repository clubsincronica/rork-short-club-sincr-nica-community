// Backend API Configuration with runtime/build-time overrides
// Priority for determining URLs (highest -> lowest):
// 1. process.env.* (set at build time)
// 2. global.__API_BASE_URL__ / global.__SOCKET_URL__ (runtime override)
// 3. Expo Constants.manifest.extra (if available)
// 4. __DEV__ local IP fallback (useful when testing on physical device)
// 5. Hardcoded production URL placeholder

const API_CONFIG = {
  LOCAL_IP: '192.168.0.77',
  PORT: '3000',
};

let ExpoConstants: any = undefined;
try {
  // Dynamically require to avoid build errors if expo-constants isn't present
  // (it's present in typical Expo projects)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ExpoConstants = require('expo-constants');
  ExpoConstants = ExpoConstants && ExpoConstants.default ? ExpoConstants.default : ExpoConstants;
} catch (e) {
  ExpoConstants = undefined;
}

const getFromExpoExtra = (key: string) => {
  try {
    if (!ExpoConstants) return undefined;
    // Different Expo versions expose manifest/expoConfig differently
    // Check multiple locations for the `extra` object
    const manifest = (ExpoConstants.manifest ?? ExpoConstants.expoConfig ?? {}) as any;
    const extra = manifest.extra ?? manifest.runtimeExtra ?? {};
    return extra[key] ?? extra[key.toLowerCase()];
  } catch (err) {
    return undefined;
  }
};

const deriveSocketUrlFromHttp = (httpUrl: string) => {
  if (!httpUrl) return httpUrl;
  if (httpUrl.startsWith('https://')) return httpUrl.replace('https://', 'wss://');
  if (httpUrl.startsWith('http://')) return httpUrl.replace('http://', 'ws://');
  return httpUrl;
};

export const getApiBaseUrl = (): string => {
  // If in development, use local IP
  if (__DEV__) {
    // Return your local IP for physical device testing, or localhost for web
    // Update API_CONFIG.LOCAL_IP at the top of this file if needed
    return `http://${API_CONFIG.LOCAL_IP}:${API_CONFIG.PORT}`;
  }
  // Always use the deployed Render backend URL for all environments
  return 'https://clubsincronica-backend.onrender.com';
};

export const API_BASE_URL = getApiBaseUrl();

export const getSocketUrl = (): string => {
  // 1) Build-time override
  if (typeof process !== 'undefined' && process.env && process.env.SOCKET_URL) {
    return process.env.SOCKET_URL;
  }

  // 2) Runtime override
  // @ts-ignore
  if (typeof global !== 'undefined' && (global as any).__SOCKET_URL__) {
    // @ts-ignore
    return (global as any).__SOCKET_URL__;
  }

  // 3) Expo extra
  const fromExpo = getFromExpoExtra('SOCKET_URL') || getFromExpoExtra('socket_url') || getFromExpoExtra('socketUrl');
  if (fromExpo) return fromExpo;

  // 4) Derive from API_BASE_URL
  return deriveSocketUrlFromHttp(API_BASE_URL);
};

export const SOCKET_URL = getSocketUrl();

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: '/api/auth',
  USERS: '/api/users',
  NEARBY_USERS: '/api/users/nearby',
  SEARCH_USERS: '/api/users/search',
  CONVERSATIONS: '/api/conversations',
  MESSAGES: '/api/messages',
  HEALTH: '/health',
};

console.log('🌐 API Base URL:', API_BASE_URL);
console.log('🔌 Socket URL:', SOCKET_URL);
