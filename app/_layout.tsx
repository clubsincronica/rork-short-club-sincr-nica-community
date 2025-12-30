import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { UserProvider } from '@/hooks/user-store';
import { CalendarProvider } from '@/hooks/calendar-store';
import { VendorProvider } from '@/hooks/vendor-store';
import { ProductsProvider } from '@/hooks/products-store';
import { ServicesProvider } from '@/hooks/services-store';
import CustomSplashScreen from '@/components/SplashScreen';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppSettingsProvider, useAppSettings } from '@/hooks/app-settings-store';
import { NotificationProvider } from '@/hooks/notification-store';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorText: {
    textAlign: 'center',
    color: '#666',
  },
});

function RootLayoutNav() {
  const { settings, isLoading } = useAppSettings();
  const router = useRouter();

  if (__DEV__) {
    console.log('RootLayoutNav - isLoading:', isLoading, 'hasCompletedOnboarding:', settings.hasCompletedOnboarding);
  }

  useEffect(() => {
    try {
      // Allow direct access to main app for demo/preview purposes
      // Only redirect to onboarding if explicitly needed
      if (!isLoading && !settings.hasCompletedOnboarding) {
        // Check if we're in a preview environment (like Rork)
        const isPreview = Platform.OS === 'web' && typeof window !== 'undefined' && (
          window.location?.hostname?.includes('rork') ||
          window.location?.hostname?.includes('localhost') ||
          window.location?.hostname?.includes('expo.dev')
        );

        if (__DEV__) {
          console.log('Preview environment detected:', isPreview);
        }

        if (!isPreview) {
          router.replace('/onboarding');
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Error in RootLayoutNav useEffect:', error);
      }
    }
  }, [isLoading, settings.hasCompletedOnboarding, router]);

  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="calendar" options={{ presentation: 'modal', title: 'Mi Calendario' }} />
      <Stack.Screen name="payment" options={{ presentation: 'modal', title: 'Pago' }} />
      <Stack.Screen name="notifications" options={{ presentation: 'modal', title: 'Notificaciones' }} />
      <Stack.Screen name="vendor-dashboard" options={{ headerShown: false }} />

      <Stack.Screen name="settings" options={{ presentation: 'modal', title: 'Settings' }} />
      <Stack.Screen name="privacy" options={{ presentation: 'modal', title: 'Privacy Policy' }} />
      <Stack.Screen name="help" options={{ presentation: 'modal', title: 'Help & Support' }} />
      <Stack.Screen name="add-event" options={{ presentation: 'modal', title: 'Add Event' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const initializeApp = async () => {
      try {
        if (__DEV__) {
          console.log('Initializing app...');
        }
        await SplashScreen.hideAsync();

        // Reduce splash time for preview environments
        const isPreview = Platform.OS === 'web' && typeof window !== 'undefined' && (
          window.location?.hostname?.includes('rork') ||
          window.location?.hostname?.includes('localhost') ||
          window.location?.hostname?.includes('expo.dev')
        );

        const splashDuration = isPreview ? 500 : 2000;
        if (__DEV__) {
          console.log('Splash duration:', splashDuration, 'Preview:', isPreview);
        }

        timeoutId = setTimeout(() => {
          if (__DEV__) {
            console.log('App ready!');
          }
          setIsReady(true);
        }, splashDuration);
      } catch (err) {
        if (__DEV__) {
          console.error('Error initializing app:', err);
        }
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsReady(true); // Still show the app even if there's an error
      }
    };

    initializeApp();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  if (!isReady) {
    return <CustomSplashScreen />;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>App Error</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppSettingsProvider>
          <UserProvider>
            <CalendarProvider>
              <NotificationProvider>
                <ServicesProvider>
                  <ProductsProvider>
                    <VendorProvider>
                      <GestureHandlerRootView style={styles.rootContainer}>
                        <RootLayoutNav />
                      </GestureHandlerRootView>
                    </VendorProvider>
                  </ProductsProvider>
                </ServicesProvider>
              </NotificationProvider>
            </CalendarProvider>
          </UserProvider>
        </AppSettingsProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
