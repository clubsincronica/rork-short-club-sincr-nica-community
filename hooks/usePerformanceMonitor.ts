import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  componentName: string;
}

export function usePerformanceMonitor(componentName: string) {
  const renderStartTime = useRef<number>(Date.now());
  const mountTime = useRef<number>(Date.now());

  useEffect(() => {
    mountTime.current = Date.now();
    
    return () => {
      const unmountTime = Date.now();
      const totalLifetime = unmountTime - mountTime.current;
      
      if (__DEV__) {
        console.log(`[Performance] ${componentName} lifetime: ${totalLifetime}ms`);
      }
    };
  }, [componentName]);

  useEffect(() => {
    const renderEndTime = Date.now();
    const renderTime = renderEndTime - renderStartTime.current;
    
    if (__DEV__ && renderTime > 16) { // Flag renders longer than 16ms (60fps)
      console.warn(`[Performance] ${componentName} slow render: ${renderTime}ms`);
    }
    
    renderStartTime.current = Date.now();
  });

  const measureAsync = async <T>(operation: () => Promise<T>, operationName: string): Promise<T> => {
    const startTime = Date.now();
    try {
      const result = await operation();
      const endTime = Date.now();
      
      if (__DEV__) {
        console.log(`[Performance] ${componentName}.${operationName}: ${endTime - startTime}ms`);
      }
      
      return result;
    } catch (error) {
      const endTime = Date.now();
      
      if (__DEV__) {
        console.error(`[Performance] ${componentName}.${operationName} failed after ${endTime - startTime}ms:`, error);
      }
      
      throw error;
    }
  };

  return { measureAsync };
}
