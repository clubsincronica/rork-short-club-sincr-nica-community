import { Tabs } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Briefcase, MessageCircle, User, MapPin, Users, Shield } from '@/components/SmartIcons';

import { useUser } from '@/hooks/user-store';

export default function TabLayout() {

  const insets = useSafeAreaInsets();
  const { currentUser } = useUser();

  // Debug logging for user role
  console.log('[TabLayout] currentUser:', currentUser);
  const isSuperUser = currentUser?.role === 'superuser';
  console.log('[TabLayout] isSuperUser:', isSuperUser);

  const tabScreens = [
    <Tabs.Screen
      key="discover"
      name="discover"
      options={{
        title: 'Descubrir',
        tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
      }}
    />,
    <Tabs.Screen
      key="near-me"
      name="near-me"
      options={{
        title: 'Comunidad',
        tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
      }}
    />,
    <Tabs.Screen
      key="messages"
      name="messages"
      options={{
        title: 'Mensajes',
        tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} />,
      }}
    />,
    <Tabs.Screen
      key="services"
      name="services"
      options={{
        title: 'Servicios',
        tabBarIcon: ({ color, size }) => <Briefcase color={color} size={size} />,
      }}
    />,
    <Tabs.Screen
      key="profile"
      name="profile"
      options={{
        title: 'Perfil',
        tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
      }}
    />,
  ];
  if (isSuperUser) {
    tabScreens.push(
      <Tabs.Screen
        key="admin"
        name="admin"
        options={{
          title: 'Admin',
          tabBarIcon: ({ color, size }) => <Shield color={color} size={size} />,
        }}
      />
    );
  }
  console.log('[TabLayout] Tab children count:', tabScreens.length);
  tabScreens.forEach((child, idx) => {
    console.log(`[TabLayout] Tab child ${idx}:`, child?.props?.name);
  });
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#9bdbbf',
        tabBarInactiveTintColor: '#b8b0c4',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1a0d2e',
          borderTopWidth: 1,
          borderTopColor: 'rgba(107, 76, 138, 0.3)',
          paddingBottom: insets.bottom,
          height: 60 + insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      {tabScreens}
    </Tabs>
  );
}
