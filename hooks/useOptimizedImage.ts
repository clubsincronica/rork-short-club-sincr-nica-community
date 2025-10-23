import React, { useState, useEffect } from 'react';
import { Image } from 'react-native';

interface UseOptimizedImageProps {
  uri: string;
  fallbackUri?: string;
}

interface UseOptimizedImageReturn {
  imageUri: string;
  isLoading: boolean;
  hasError: boolean;
  retry: () => void;
}

export function useOptimizedImage({ 
  uri, 
  fallbackUri 
}: UseOptimizedImageProps): UseOptimizedImageReturn {
  const [imageUri, setImageUri] = useState<string>(uri);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);

  const loadImage = React.useCallback((imageUrl: string) => {
    if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim().length === 0) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    Image.prefetch(imageUrl)
      .then(() => {
        setImageUri(imageUrl);
        setIsLoading(false);
      })
      .catch(() => {
        if (fallbackUri && imageUrl !== fallbackUri) {
          setImageUri(fallbackUri);
          loadImage(fallbackUri);
        } else {
          setHasError(true);
          setIsLoading(false);
        }
      });
  }, [fallbackUri]);

  const retry = () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      loadImage(uri);
    }
  };

  useEffect(() => {
    loadImage(uri);
  }, [uri, retryCount, loadImage]);

  return {
    imageUri,
    isLoading,
    hasError,
    retry,
  };
}