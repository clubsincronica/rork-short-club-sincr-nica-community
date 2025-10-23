import React, { createContext, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import { User, PaymentMethod, UserPreferences } from '@/types/user';
import { mockUsers } from '@/mocks/data';

// Create the context manually for better React 19 compatibility
const UserContext = createContext<ReturnType<typeof useUserStore> | null>(null);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

const useUserStore = () => {
  // Check if we're in a preview environment
  const isPreview = (() => {
    try {
      return typeof window !== 'undefined' && (
        window.location?.hostname?.includes('rork') || 
        window.location?.hostname?.includes('localhost') ||
        window.location?.hostname?.includes('expo.dev')
      );
    } catch (error) {
      return false;
    }
  })();

  const [currentUser, setCurrentUser] = useState<User | null>(isPreview ? mockUsers[0] : null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>({
    notifications: true,
    newsletter: false,
    language: 'es',
    theme: 'light',
    autoBooking: false,
  });
  const queryClient = useQueryClient();

  const userQuery = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem('currentUser');
      return stored ? JSON.parse(stored) : null;
    }
  });

  const paymentMethodsQuery = useQuery({
    queryKey: ['paymentMethods'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem('paymentMethods');
      return stored ? JSON.parse(stored) : [];
    }
  });

  const preferencesQuery = useQuery({
    queryKey: ['userPreferences'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem('userPreferences');
      return stored ? JSON.parse(stored) : {
        notifications: true,
        newsletter: false,
        language: 'es',
        theme: 'light',
        autoBooking: false,
      };
    }
  });

  const loginMutation = useMutation({
    mutationFn: async (userData: { email: string; password?: string } | User) => {
      if (__DEV__) {
        console.log('Login mutation called with:', 'id' in userData ? 'User object' : userData.email);
      }
      // If full user object is provided, use it directly (for signup)
      const user = 'id' in userData ? userData : (mockUsers.find(u => u.email === userData.email) || mockUsers[0]);
      if (__DEV__) {
        console.log('User to login:', user.email);
      }
      await AsyncStorage.setItem('currentUser', JSON.stringify(user));
      
      // Load mock payment methods for testing
      const mockPaymentMethods: PaymentMethod[] = [
        {
          id: '1',
          type: 'card',
          last4: '4242',
          brand: 'Visa',
          expiryMonth: 12,
          expiryYear: 2025,
          isDefault: true,
        },
        {
          id: '2',
          type: 'card',
          last4: '5555',
          brand: 'Mastercard',
          expiryMonth: 6,
          expiryYear: 2024,
          isDefault: false,
        },
      ];
      await AsyncStorage.setItem('paymentMethods', JSON.stringify(mockPaymentMethods));
      
      return { user, paymentMethods: mockPaymentMethods };
    },
    onSuccess: ({ user, paymentMethods }) => {
      if (__DEV__) {
        console.log('Login successful, updating state for:', user.email);
      }
      setCurrentUser(user);
      setPaymentMethods(paymentMethods);
      queryClient.setQueryData(['currentUser'], user);
      queryClient.setQueryData(['paymentMethods'], paymentMethods);
    },
    onError: (error) => {
      if (__DEV__) {
        console.error('Login mutation error:', error);
      }
    }
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await AsyncStorage.removeItem('currentUser');
      await AsyncStorage.removeItem('paymentMethods');
      return null;
    },
    onSuccess: () => {
      setCurrentUser(null);
      setPaymentMethods([]);
      queryClient.setQueryData(['currentUser'], null);
      queryClient.setQueryData(['paymentMethods'], []);
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<User>) => {
      if (!currentUser) throw new Error('No user logged in');
      const updatedUser = { ...currentUser, ...updates };
      await AsyncStorage.setItem('currentUser', JSON.stringify(updatedUser));
      return updatedUser;
    },
    onSuccess: (user) => {
      setCurrentUser(user);
      queryClient.setQueryData(['currentUser'], user);
    }
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (updates: Partial<UserPreferences>) => {
      const updatedPreferences = { ...preferences, ...updates };
      await AsyncStorage.setItem('userPreferences', JSON.stringify(updatedPreferences));
      return updatedPreferences;
    },
    onSuccess: (prefs) => {
      setPreferences(prefs);
      queryClient.setQueryData(['userPreferences'], prefs);
    }
  });

  const addPaymentMethodMutation = useMutation({
    mutationFn: async (method: Omit<PaymentMethod, 'id'>) => {
      const newMethod: PaymentMethod = {
        ...method,
        id: Date.now().toString(),
      };
      const updatedMethods = [...paymentMethods, newMethod];
      await AsyncStorage.setItem('paymentMethods', JSON.stringify(updatedMethods));
      return updatedMethods;
    },
    onSuccess: (methods) => {
      setPaymentMethods(methods);
      queryClient.setQueryData(['paymentMethods'], methods);
    }
  });

  const removePaymentMethodMutation = useMutation({
    mutationFn: async (methodId: string) => {
      const updatedMethods = paymentMethods.filter(m => m.id !== methodId);
      await AsyncStorage.setItem('paymentMethods', JSON.stringify(updatedMethods));
      return updatedMethods;
    },
    onSuccess: (methods) => {
      setPaymentMethods(methods);
      queryClient.setQueryData(['paymentMethods'], methods);
    }
  });

  const setDefaultPaymentMethodMutation = useMutation({
    mutationFn: async (methodId: string) => {
      const updatedMethods = paymentMethods.map(m => ({
        ...m,
        isDefault: m.id === methodId,
      }));
      await AsyncStorage.setItem('paymentMethods', JSON.stringify(updatedMethods));
      return updatedMethods;
    },
    onSuccess: (methods) => {
      setPaymentMethods(methods);
      queryClient.setQueryData(['paymentMethods'], methods);
    }
  });

  useEffect(() => {
    if (userQuery.data) {
      setCurrentUser(userQuery.data);
    }
  }, [userQuery.data]);

  useEffect(() => {
    if (paymentMethodsQuery.data) {
      setPaymentMethods(paymentMethodsQuery.data);
    }
  }, [paymentMethodsQuery.data]);

  useEffect(() => {
    if (preferencesQuery.data) {
      setPreferences(preferencesQuery.data);
    }
  }, [preferencesQuery.data]);

  return useMemo(() => ({
    currentUser,
    paymentMethods,
    preferences,
    isLoading: userQuery.isLoading,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutate,
    updateProfile: updateProfileMutation.mutate,
    updateUser: updateProfileMutation.mutate,
    updatePreferences: updatePreferencesMutation.mutate,
    addPaymentMethod: addPaymentMethodMutation.mutate,
    removePaymentMethod: removePaymentMethodMutation.mutate,
    setDefaultPaymentMethod: setDefaultPaymentMethodMutation.mutate,
    isLoginLoading: loginMutation.isPending,
  }), [
    currentUser, 
    paymentMethods, 
    preferences,
    userQuery.isLoading, 
    loginMutation.mutateAsync, 
    logoutMutation.mutate, 
    updateProfileMutation.mutate, 
    updatePreferencesMutation.mutate,
    addPaymentMethodMutation.mutate,
    removePaymentMethodMutation.mutate,
    setDefaultPaymentMethodMutation.mutate,
    loginMutation.isPending
  ]);
};

// Manual provider component for React 19 compatibility
export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const userStore = useUserStore();
  return React.createElement(UserContext.Provider, { value: userStore }, children);
};
