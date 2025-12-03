// Development mocks for native modules to reduce warning noise
import { Platform } from 'react-native';

if (__DEV__ && Platform.OS === 'web') {
  // Mock NetInfo for web development
  const mockNetInfo = {
    fetch: () => Promise.resolve({ isConnected: true, type: 'wifi' }),
    addEventListener: () => () => {}, // Return unsubscribe function
    useNetInfo: () => ({ isConnected: true, type: 'wifi' }),
  };

  // Mock ExpoPushTokenManager for development
  const mockPushTokenManager = {
    getExpoPushTokenAsync: () => Promise.resolve('mock-push-token'),
  };

  // Install mocks globally for development
  const globalAny = global as any;
  if (!globalAny.mockNetInfo) {
    globalAny.mockNetInfo = mockNetInfo;
  }
  
  if (!globalAny.mockPushTokenManager) {
    globalAny.mockPushTokenManager = mockPushTokenManager;
  }
}

export const developmentMocks = {
  initialized: true,
};