import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUser } from '@/hooks/user-store';
import { useAppSettings } from '@/hooks/app-settings-store';
import { Colors } from '@/constants/colors';

export default function Index() {
  const router = useRouter();
  const { currentUser, isLoading: userLoading } = useUser();
  const { settings, isLoading: settingsLoading } = useAppSettings();

  useEffect(() => {
    if (!userLoading && !settingsLoading) {
      console.log('Index - currentUser:', currentUser?.email, 'hasCompletedOnboarding:', settings.hasCompletedOnboarding);
      
      // Check if we're in a preview environment
      const isPreview = typeof window !== 'undefined' && (
        window.location?.hostname?.includes('rork') || 
        window.location?.hostname?.includes('localhost') ||
        window.location?.hostname?.includes('expo.dev')
      );
      
      if (isPreview) {
        // In preview mode, go directly to main app
        console.log('Preview mode detected - going to discover');
        router.replace('/discover');
      } else if (!settings.hasCompletedOnboarding) {
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
  }, [currentUser, userLoading, settings.hasCompletedOnboarding, settingsLoading, router]);

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
