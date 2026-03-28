import React from 'react';
import { View, Image, ImageProps, StyleSheet, TouchableOpacity } from 'react-native';
import { RefreshCw } from 'lucide-react-native';
import { useOptimizedImage } from '@/hooks/useOptimizedImage';
import { LoadingSpinner } from './LoadingSpinner';
import { Colors } from '@/constants/colors';

interface OptimizedImageProps extends Omit<ImageProps, 'source'> {
  uri: string;
  fallbackUri?: string;
  showRetry?: boolean;
}

export function OptimizedImage({ 
  uri, 
  fallbackUri, 
  showRetry = true, 
  style, 
  ...props 
}: OptimizedImageProps) {
  const { imageUri, isLoading, hasError, retry } = useOptimizedImage({ 
    uri, 
    fallbackUri 
  });

  if (isLoading) {
    return (
      <View style={[styles.container, style]}>
        <LoadingSpinner size="small" />
      </View>
    );
  }

  if (hasError) {
    return (
      <View style={[styles.container, styles.errorContainer, style]}>
        {showRetry && (
          <TouchableOpacity onPress={retry} style={styles.retryButton}>
            <RefreshCw size={16} color={Colors.textLight} />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <Image
      {...props}
      source={{ uri: imageUri }}
      style={style}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  errorContainer: {
    backgroundColor: Colors.border,
  },
  retryButton: {
    padding: 8,
  },
});