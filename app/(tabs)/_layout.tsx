import { Tabs } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Briefcase, MessageCircle, User, MapPin, Users, Shield } from '@/components/SmartIcons';

import { useUser } from '@/hooks/user-store';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { currentUser } = useUser();



  // Check if current user is a superuser
  const isSuperUser = currentUser?.role === 'superuser';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#9bdbbf',  // Mint green for active tabs
        tabBarInactiveTintColor: '#b8b0c4', // Lighter purple-gray for much better contrast
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1a0d2e',
          borderTopWidth: 1,
          borderTopColor: 'rgba(107, 76, 138, 0.3)',
          paddingBottom: insets.bottom, // Fix Android navigation bar covering tabs
          height: 60 + insets.bottom, // Adjust height for safe area
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',  // Slightly bolder for better readability
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Descubrir',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />

      <Tabs.Screen
        name="near-me"
        options={{
          title: 'Comunidad',
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Mensajes',
          tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Servicios',
          tabBarIcon: ({ color, size }) => <Briefcase color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
      {isSuperUser && (
        <Tabs.Screen
          name="admin"
          options={{
            title: 'Admin',
            tabBarIcon: ({ color, size }) => <Shield color={color} size={size} />,
          }}
        />
      )}
    </Tabs>
  );
}
