import { Alert } from 'react-native';

export interface NetworkErrorHandler {
  onError?: (error: Error) => void;
  showAlert?: boolean;
  retryCallback?: () => Promise<void>;
}

export class NetworkManager {
  private static instance: NetworkManager;
  private isOnline: boolean = true;
  private retryQueue: Array<() => Promise<void>> = [];

  static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }

  setConnectionStatus(isOnline: boolean) {
    this.isOnline = isOnline;
    
    if (isOnline && this.retryQueue.length > 0) {
      // Process retry queue when back online
      this.processRetryQueue();
    }
  }

  async handleNetworkRequest<T>(
    requestFn: () => Promise<T>,
    options: NetworkErrorHandler = {}
  ): Promise<T | null> {
    const { onError, showAlert = true, retryCallback } = options;

    try {
      if (!this.isOnline) {
        throw new Error('No internet connection');
      }

      return await requestFn();
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      
      console.error('Network request failed:', errorMessage);
      
      if (onError) {
        onError(error as Error);
      }

      if (showAlert) {
        this.showErrorAlert(errorMessage, retryCallback);
      }

      // Add to retry queue if we have a retry callback
      if (retryCallback && !this.isOnline) {
        this.retryQueue.push(retryCallback);
      }

      return null;
    }
  }

  private getErrorMessage(error: any): string {
    if (error.message?.includes('Network request failed')) {
      return 'Sin conexión a internet. Revisa tu conexión y vuelve a intentar.';
    }
    
    if (error.message?.includes('timeout')) {
      return 'La conexión ha tardado demasiado. Inténtalo de nuevo.';
    }
    
    if (error.status >= 500) {
      return 'Error del servidor. Inténtalo más tarde.';
    }
    
    if (error.status === 404) {
      return 'Recurso no encontrado.';
    }
    
    if (error.status === 401 || error.status === 403) {
      return 'No tienes permisos para realizar esta acción.';
    }
    
    return error.message || 'Ha ocurrido un error inesperado.';
  }

  private showErrorAlert(message: string, retryCallback?: () => Promise<void>) {
    const buttons = [
      { text: 'OK', style: 'cancel' as const }
    ];

    if (retryCallback) {
      buttons.unshift({
        text: 'Reintentar',
        onPress: () => retryCallback(),
      } as any);
    }

    Alert.alert(
      'Error de conexión',
      message,
      buttons
    );
  }

  private async processRetryQueue() {
    const queue = [...this.retryQueue];
    this.retryQueue = [];

    for (const retryFn of queue) {
      try {
        await retryFn();
      } catch (error) {
        console.error('Retry failed:', error);
        // Re-add to queue if still failing
        this.retryQueue.push(retryFn);
      }
    }
  }

  // Helper method for common network scenarios
  async withOfflineSupport<T>(
    onlineAction: () => Promise<T>,
    offlineAction?: () => T,
    options: NetworkErrorHandler = {}
  ): Promise<T | null> {
    if (!this.isOnline && offlineAction) {
      try {
        return offlineAction();
      } catch (error) {
        console.error('Offline action failed:', error);
        return null;
      }
    }

    return this.handleNetworkRequest(onlineAction, options);
  }
}

// Helper hook for React components
export function useNetworkError() {
  const networkManager = NetworkManager.getInstance();
  
  return {
    handleRequest: networkManager.handleNetworkRequest.bind(networkManager),
    withOfflineSupport: networkManager.withOfflineSupport.bind(networkManager),
    setOnline: (isOnline: boolean) => networkManager.setConnectionStatus(isOnline),
  };
}

// Utility function for simple error handling
export function handleAsyncError<T>(
  promise: Promise<T>,
  defaultValue?: T
): Promise<[T | null, Error | null]> {
  return promise
    .then<[T, null]>((data: T) => [data, null])
    .catch<[T | null, Error]>((error: Error) => [defaultValue || null, error]);
}

export default NetworkManager;