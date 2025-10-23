import React, { useState } from 'react';
import { View, Image, StyleSheet, useWindowDimensions, Text } from 'react-native';
import { Colors } from '@/constants/colors';

export default function CustomSplashScreen() {
  const { width, height } = useWindowDimensions();
  const [imageError, setImageError] = useState(false);
  
  console.log('CustomSplashScreen rendered');
  
  return (
    <View style={styles.container}>
      {!imageError ? (
        <Image
          source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/utfo3vusmpbdwwc9v7y92' }}
          style={[styles.logo, { width: width * 0.6, height: height * 0.3 }]}
          resizeMode="contain"
          onError={() => {
            console.log('Image failed to load, showing fallback');
            setImageError(true);
          }}
        />
      ) : (
        <View style={styles.fallback}>
          <Text style={styles.fallbackText}>Club Sincrónica</Text>
          <Text style={styles.fallbackSubtext}>Cargando...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    maxWidth: 400,
    maxHeight: 300,
  },
  fallback: {
    alignItems: 'center',
  },
  fallbackText: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 8,
  },
  fallbackSubtext: {
    fontSize: 16,
    color: Colors.textLight,
  },
});