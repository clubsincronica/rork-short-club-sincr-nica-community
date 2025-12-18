import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUser } from '@/hooks/user-store';
import { useAppSettings } from '@/hooks/app-settings-store';
import { Colors } from '@/constants/colors';

export default function Index() {
  const router = useRouter();
  const { currentUser, isLoading: userLoading, logout } = useUser();
  const { settings, isLoading: settingsLoading } = useAppSettings();

  // 🔧 TESTING MODE: Set to true to force logout and show login screen
  // Change to false after testing login flow
  const FORCE_LOGOUT_FOR_TESTING = true;

  useEffect(() => {
    if (!userLoading && !settingsLoading) {
      console.log('Index - currentUser:', currentUser?.email, 'hasCompletedOnboarding:', settings.hasCompletedOnboarding);
      
      // Force logout during testing if flag is enabled
      if (FORCE_LOGOUT_FOR_TESTING && currentUser) {
        console.log('🔧 TESTING MODE: Force logout enabled - clearing session');
        logout();
        router.replace('/login');
        return;
      }
      
      // Normal navigation flow
      if (!settings.hasCompletedOnboarding) {
        // First time user - show onboarding
        router.replace('/onboarding');
      } else if (!currentUser) {
        // Returning user but not logged in - show login
        router.replace('/login');
      } else {
        // User is logged in - go to main app
        router.replace('/discover');
      }
    }
  }, [currentUser, userLoading, settings.hasCompletedOnboarding, settingsLoading, router, logout]);

  // Show loading while determining where to navigate
  return (
    <SafeAreaView style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
