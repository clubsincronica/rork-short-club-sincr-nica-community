import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  X, 
  Flashlight, 
  FlashlightOff,
  WifiOff,
  Wifi,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Database,
  Clock
} from '@/components/SmartIcons';

// Safe NetInfo implementation with error handling
let NetInfo: any = null;
try {
  if (Platform.OS !== 'web') {
    NetInfo = require('@react-native-community/netinfo');
  }
} catch (error) {
  console.warn('@react-native-community/netinfo not available:', error);
}

// Fallback NetInfo for web/development
const SafeNetInfo = NetInfo || {
  addEventListener: (callback: (state: any) => void) => {
    // Mock network state for development
    const mockState = {
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi'
    };
    // Call callback immediately with mock state
    setTimeout(() => callback(mockState), 0);
    // Return unsubscribe function
    return () => {};
  },
  fetch: () => Promise.resolve({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi'
  })
};
import { Colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AttendanceManager } from '@/utils/ticketGenerator';
import { TouchableScale } from '@/components/TouchableScale';

interface QRScannerOfflineProps {
  onScan: (data: string, isOffline?: boolean) => void;
  onClose: () => void;
  isVisible: boolean;
  eventId: string;
}

interface OfflineScan {
  id: string;
  qrData: string;
  eventId: string;
  timestamp: string;
  synced: boolean;
  scanLocation?: string;
}

export function QRScannerOffline({ onScan, onClose, isVisible, eventId }: QRScannerOfflineProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [offlineScans, setOfflineScans] = useState<OfflineScan[]>([]);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const insets = useSafeAreaInsets();

  const OFFLINE_SCANS_KEY = 'offline_qr_scans';

  useEffect(() => {
    if (isVisible) {
      setScanned(false);
      checkNetworkStatus();
      loadOfflineScans();
    }
  }, [isVisible]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    try {
      // Skip NetInfo in development/web environment where native module isn't available
      if (__DEV__ && Platform.OS === 'web') {
        console.log('Development web environment - skipping NetInfo setup');
        setIsOnline(true); // Assume online in web dev
        return;
      }

      unsubscribe = SafeNetInfo.addEventListener((state: any) => {
        const wasOffline = !isOnline;
        const isNowOnline = state.isConnected ?? false;
        
        setIsOnline(isNowOnline);
        
        // If we just came back online, try to sync offline scans
        if (wasOffline && isNowOnline && pendingSyncCount > 0) {
          syncOfflineScans();
        }
      });
    } catch (error) {
      console.error('Error setting up NetInfo listener:', error);
      // Fallback to assuming online in development
      if (__DEV__) {
        setIsOnline(true);
      }
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isOnline, pendingSyncCount]);

  const checkNetworkStatus = async () => {
    try {
      // Skip NetInfo in development/web environment
      if (__DEV__ && Platform.OS === 'web') {
        setIsOnline(true); // Assume online in web dev
        return;
      }

      const state = await SafeNetInfo.fetch();
      setIsOnline(state.isConnected ?? false);
    } catch (error) {
      console.error('Error checking network status:', error);
      // Fallback to assuming online in development
      if (__DEV__) {
        setIsOnline(true);
      }
    }
  };

  const loadOfflineScans = async () => {
    try {
      const stored = await AsyncStorage.getItem(OFFLINE_SCANS_KEY);
      const scans = stored ? JSON.parse(stored) : [];
      setOfflineScans(scans);
      setPendingSyncCount(scans.filter((scan: OfflineScan) => !scan.synced).length);
    } catch (error) {
      console.error('Error loading offline scans:', error);
    }
  };

  const saveOfflineScan = async (qrData: string) => {
    try {
      const newScan: OfflineScan = {
        id: `offline_${Date.now()}`,
        qrData,
        eventId,
        timestamp: new Date().toISOString(),
        synced: false,
        scanLocation: 'Offline Mode',
      };

      const stored = await AsyncStorage.getItem(OFFLINE_SCANS_KEY);
      const scans = stored ? JSON.parse(stored) : [];
      scans.push(newScan);
      
      await AsyncStorage.setItem(OFFLINE_SCANS_KEY, JSON.stringify(scans));
      setOfflineScans(scans);
      setPendingSyncCount(scans.filter((scan: OfflineScan) => !scan.synced).length);
      
      console.log('Saved offline scan:', newScan.id);
      return newScan;
    } catch (error) {
      console.error('Error saving offline scan:', error);
      return null;
    }
  };

  const syncOfflineScans = async () => {
    if (!isOnline || pendingSyncCount === 0) return;

    try {
      setIsProcessing(true);
      console.log('Syncing offline scans...');

      const stored = await AsyncStorage.getItem(OFFLINE_SCANS_KEY);
      const scans = stored ? JSON.parse(stored) : [];
      const unsyncedScans = scans.filter((scan: OfflineScan) => !scan.synced);

      let syncedCount = 0;
      for (const scan of unsyncedScans) {
        try {
          // Use AttendanceManager to process the offline scan
          const result = await AttendanceManager.checkInTicket(
            scan.eventId,
            scan.qrData,
            scan.scanLocation
          );

          if (result.success) {
            // Mark as synced
            scan.synced = true;
            syncedCount++;
            console.log(`Synced offline scan: ${scan.id}`);
          } else {
            console.log(`Failed to sync scan ${scan.id}: ${result.message}`);
          }
        } catch (error) {
          console.error(`Error syncing scan ${scan.id}:`, error);
        }
      }

      // Update storage with synced status
      await AsyncStorage.setItem(OFFLINE_SCANS_KEY, JSON.stringify(scans));
      setOfflineScans(scans);
      setPendingSyncCount(scans.filter((scan: OfflineScan) => !scan.synced).length);

      if (syncedCount > 0) {
        Alert.alert(
          'Sincronización Exitosa',
          `Se sincronizaron ${syncedCount} escaneos offline exitosamente.`
        );
      }
    } catch (error) {
      console.error('Error syncing offline scans:', error);
      Alert.alert('Error de Sincronización', 'No se pudieron sincronizar los escaneos offline.');
    } finally {
      setIsProcessing(false);
    }
  };

  const clearSyncedScans = async () => {
    try {
      const stored = await AsyncStorage.getItem(OFFLINE_SCANS_KEY);
      const scans = stored ? JSON.parse(stored) : [];
      const unsyncedOnly = scans.filter((scan: OfflineScan) => !scan.synced);
      
      await AsyncStorage.setItem(OFFLINE_SCANS_KEY, JSON.stringify(unsyncedOnly));
      setOfflineScans(unsyncedOnly);
      setPendingSyncCount(unsyncedOnly.length);
      
      Alert.alert('Éxito', 'Escaneos sincronizados eliminados del almacenamiento local.');
    } catch (error) {
      console.error('Error clearing synced scans:', error);
    }
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    setIsProcessing(true);

    console.log('QR Code scanned:', { type, data, isOnline });

    try {
      if (isOnline) {
        // Online mode - process immediately
        const result = await AttendanceManager.checkInTicket(eventId, data);
        
        if (result.success) {
          Alert.alert('✅ Check-in Exitoso', result.message);
          onScan(data, false);
        } else {
          Alert.alert('❌ Error de Check-in', result.message);
        }
      } else {
        // Offline mode - save for later sync
        const offlineScan = await saveOfflineScan(data);
        
        if (offlineScan) {
          Alert.alert(
            '📱 Guardado Offline',
            `Ticket guardado localmente. Se procesará cuando vuelva la conexión.`,
            [
              { text: 'Entendido', onPress: () => onScan(data, true) }
            ]
          );
        } else {
          Alert.alert('Error', 'No se pudo guardar el escaneo offline.');
        }
      }
    } catch (error) {
      console.error('Error processing scan:', error);
      Alert.alert('Error', 'Error al procesar el código QR.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isVisible) {
    return null;
  }

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Solicitando permisos de cámara...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.message}>Necesitamos acceso a tu cámara para escanear códigos QR</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Conceder Permiso</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Web fallback - show message that QR scanning is not available
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity style={styles.headerButton} onPress={onClose}>
            <X size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.webFallback}>
          <Text style={styles.webFallbackTitle}>Escáner QR no disponible</Text>
          <Text style={styles.webFallbackMessage}>
            El escáner QR no está disponible en la versión web. 
            Por favor, usa la aplicación móvil para escanear códigos QR.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={onClose}>
            <Text style={styles.permissionButtonText}>Entendido</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={'back' as CameraType}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'pdf417'],
        }}
      >
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity style={styles.headerButton} onPress={onClose}>
            <X size={24} color={Colors.white} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>
            Escanear Código QR {!isOnline && '(Offline)'}
          </Text>
          
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => setFlashEnabled(!flashEnabled)}
          >
            {flashEnabled ? (
              <FlashlightOff size={24} color={Colors.white} />
            ) : (
              <Flashlight size={24} color={Colors.white} />
            )}
          </TouchableOpacity>
        </View>

        {/* Network Status Banner */}
        <View style={[
          styles.networkBanner,
          { backgroundColor: isOnline ? Colors.success : Colors.warning }
        ]}>
          <View style={styles.networkStatus}>
            {isOnline ? (
              <Wifi size={16} color={Colors.white} />
            ) : (
              <WifiOff size={16} color={Colors.white} />
            )}
            <Text style={styles.networkText}>
              {isOnline ? 'En línea' : 'Modo offline'}
            </Text>
          </View>
          
          {pendingSyncCount > 0 && (
            <TouchableScale
              style={styles.syncButton}
              onPress={syncOfflineScans}
              disabled={!isOnline || isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <RefreshCw size={14} color={Colors.white} />
              )}
              <Text style={styles.syncButtonText}>
                {pendingSyncCount} pendiente{pendingSyncCount > 1 ? 's' : ''}
              </Text>
            </TouchableScale>
          )}
        </View>

        <View style={styles.scanArea}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            
            {isProcessing && (
              <View style={styles.processingOverlay}>
                <ActivityIndicator size="large" color={Colors.white} />
                <Text style={styles.processingText}>Procesando...</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            {isOnline 
              ? 'Apunta la cámara hacia el código QR'
              : 'Escaneando en modo offline - se sincronizará cuando vuelva la conexión'
            }
          </Text>
          
          {scanned && (
            <TouchableOpacity 
              style={styles.scanAgainButton}
              onPress={() => setScanned(false)}
              disabled={isProcessing}
            >
              <Text style={styles.scanAgainText}>Escanear de nuevo</Text>
            </TouchableOpacity>
          )}

          {/* Offline Status Panel */}
          {!isOnline && (
            <View style={styles.offlinePanel}>
              <View style={styles.offlinePanelHeader}>
                <Database size={16} color={Colors.warning} />
                <Text style={styles.offlinePanelTitle}>Modo Offline Activo</Text>
              </View>
              <Text style={styles.offlinePanelText}>
                Los tickets se guardarán localmente y se procesarán cuando se restaure la conexión.
              </Text>
            </View>
          )}

          {/* Offline Scans Summary */}
          {offlineScans.length > 0 && (
            <View style={styles.offlineSummary}>
              <TouchableScale
                style={styles.offlineSummaryHeader}
                onPress={() => Alert.alert(
                  'Escaneos Offline',
                  `Total: ${offlineScans.length}\nPendientes: ${pendingSyncCount}\nSincronizados: ${offlineScans.length - pendingSyncCount}`,
                  [
                    { text: 'Cerrar' },
                    ...(pendingSyncCount === 0 && offlineScans.length > 0 ? [{
                      text: 'Limpiar Sincronizados',
                      onPress: clearSyncedScans
                    }] : [])
                  ]
                )}
              >
                <Clock size={14} color={Colors.info} />
                <Text style={styles.offlineSummaryText}>
                  {offlineScans.length} escaneo{offlineScans.length > 1 ? 's' : ''} offline
                </Text>
                {pendingSyncCount > 0 && (
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>{pendingSyncCount}</Text>
                  </View>
                )}
              </TouchableScale>
            </View>
          )}
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  camera: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    textAlign: 'center',
  },
  networkBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  networkStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  networkText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.white,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  syncButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.white,
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: Colors.white,
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  processingText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '500',
    marginTop: 10,
  },
  instructions: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 16,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  scanAgainButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 15,
  },
  scanAgainText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  offlinePanel: {
    backgroundColor: 'rgba(255, 193, 7, 0.9)',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    maxWidth: 300,
  },
  offlinePanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  offlinePanelTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  offlinePanelText: {
    fontSize: 12,
    color: Colors.white,
    lineHeight: 16,
  },
  offlineSummary: {
    marginTop: 10,
  },
  offlineSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 123, 255, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  offlineSummaryText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.white,
  },
  pendingBadge: {
    backgroundColor: Colors.error,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.white,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    color: Colors.text,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 15,
  },
  permissionButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  closeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  closeButtonText: {
    color: Colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
  webFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  webFallbackTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 20,
  },
  webFallbackMessage: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
});