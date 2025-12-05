import React, { useState, useEffect, createContext, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export interface AppSettings {
  language: Language | null;
  location: {
    country: string;
    city: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  } | null;
  currency: Currency | null;
  hasCompletedOnboarding: boolean;
}

const STORAGE_KEY = '@app_settings';

const AppSettingsContext = createContext<any>(null);

export const AppSettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const contextValue = useAppSettingsHook();
  return <AppSettingsContext.Provider value={contextValue}>{children}</AppSettingsContext.Provider>;
};

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within AppSettingsProvider');
  }
  return context;
};

const useAppSettingsHook = () => {
  // Check if we're in a preview environment
  const isPreview = (() => {
    try {
      return typeof window !== 'undefined' && (
        window.location?.hostname?.includes('rork') || 
        window.location?.hostname?.includes('localhost') ||
        window.location?.hostname?.includes('expo.dev')
      );
    } catch (error) {
      console.log('Error checking preview environment:', error);
      return false;
    }
  })();

  const [settings, setSettings] = useState<AppSettings>({
    language: isPreview ? { code: 'en', name: 'English', nativeName: 'English' } : null,
    location: isPreview ? { country: 'United States', city: 'New York' } : null,
    currency: isPreview ? { code: 'USD', symbol: '$', name: 'US Dollar' } : null,
    hasCompletedOnboarding: isPreview, // Skip onboarding in preview
  });
  const [isLoading, setIsLoading] = useState(!isPreview); // Don't load if preview

  useEffect(() => {
    if (!isPreview) {
      loadSettings();
    }
  }, [isPreview]);

  const loadSettings = async () => {
    try {
      console.log('Loading app settings...');
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('Loaded settings:', parsed);
        setSettings(parsed);
      } else {
        console.log('No stored settings found, using defaults');
      }
    } catch (error) {
      console.error('Error loading app settings:', error);
      // Use default settings on error
      setSettings({
        language: null,
        location: null,
        currency: null,
        hasCompletedOnboarding: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: AppSettings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving app settings:', error);
    }
  };

  const updateLanguage = (language: Language) => {
    const updated = { ...settings, language };
    saveSettings(updated);
  };

  const updateLocation = (location: AppSettings['location']) => {
    const updated = { ...settings, location };
    saveSettings(updated);
  };

  const updateCurrency = (currency: Currency) => {
    const updated = { ...settings, currency };
    saveSettings(updated);
  };

  const completeOnboarding = () => {
    const updated = { ...settings, hasCompletedOnboarding: true };
    saveSettings(updated);
  };

  const resetSettings = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setSettings({
        language: null,
        location: null,
        currency: null,
        hasCompletedOnboarding: false,
      });
    } catch (error) {
      console.error('Error resetting settings:', error);
    }
  };

  return {
    settings,
    isLoading,
    updateLanguage,
    updateLocation,
    updateCurrency,
    completeOnboarding,
    resetSettings,
  };

  return {
    settings,
    isLoading,
    updateLanguage,
    updateLocation, 
    updateCurrency,
    completeOnboarding,
    resetSettings,
  };
};
