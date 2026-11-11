import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import { User, PaymentMethod, UserPreferences } from '@/types/user';
import { mockUsers } from '@/mocks/data';

// Backend URL for production (Render) — used by web view only
const BACKEND_URL = 'https://clubsincronica-backend.onrender.com';

// Detect if currently on web platform (Expo web)
const isWebPlatform = (() => {
  try {
    const hostname = window?.location?.hostname || '';
    // Web: localhost con puerto (localhost:8081) o IP o dominio con punto
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const hasDot = hostname.includes('.') || isLocalhost;
    return typeof window !== 'undefined' && hasDot;
  } catch (e) { return false; }
})();

// Generic API caller for web platform
async function apiFetch(endpoint, options = {}) {
  try {
    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      credentials: 'include',  // Allow cookies/auth to pass
    });
    if (!res.ok) {
      const e = await res.text();
      throw new Error(`Backend error ${res.status}: ${e}`);
    }
    return await res.json();
  } catch (err) {
    if (__DEV__) console.error('apiFetch error:', err.message);
    return null;
  }
}

export const [UserProvider, useUser] = createContextHook(() => {
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
      // En modo web (Expo web), consultar el backend real en Render
      if (isWebPlatform) {
        try {
          const user = await apiFetch('/users/login', {
            method: 'POST',
            body: { email: userData.email, password: userData.password },
          });
          if (!user || !user.email) throw new Error('User not found from backend');
          // Guardar en AsyncStorage también para persistencia local
          await AsyncStorage.setItem('currentUser', JSON.stringify(user));
          // Cargar payment methods from backend si vienen, si no, mocks
          const pms = user.paymentMethods || [
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
          await AsyncStorage.setItem('paymentMethods', JSON.stringify(pms));
          return { user, paymentMethods: pms };
        } catch (err) {
          // backend falló → NO caemos a mocks silenciosos.
          // En producción mostraríamos un mensaje al usuario; en dev lo registramos.
          if (__DEV__) console.error('Backend login error, falling back to mocks:', err.message);
          // Retornamos null para indicar que el login no pudo completarse desde el backend
          return { user: null, paymentMethods: [] };
        }
      }
      // Modo nativo (móvil APK): usar mocks locales como antes
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
        console.log('Login successful, updating state for:', user?.email || 'null user');
      }
      // Solo actualizar estado si hay usuario válido
      if (user) {
        setCurrentUser(user);
        setPaymentMethods(paymentMethods);
        queryClient.setQueryData(['currentUser'], user);
        queryClient.setQueryData(['paymentMethods'], paymentMethods);
      } else {
        // Login falló (backend caído, credenciales inválidas): limpiar y mostrar error
        setCurrentUser(null);
        setPaymentMethods([]);
        queryClient.setQueryData(['currentUser'], null);
        queryClient.setQueryData(['paymentMethods'], []);
        if (__DEV__) console.error('Login failed — no user returned from auth backend');
      }
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
});