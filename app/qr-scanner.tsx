import React, { useState } from 'react';
import { View, StyleSheet, Modal, Text, TouchableOpacity } from 'react-native';
import { QRScanner } from '@/components/QRScanner';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { X } from 'lucide-react-native';

export default function QRScannerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isVisible, setIsVisible] = useState(true);
  const [resultModal, setResultModal] = useState<{ visible: boolean; title: string; message: string; data: string }>({ 
    visible: false, 
    title: '', 
    message: '', 
    data: '' 
  });

  const handleScan = (data: string) => {
    // Input validation
    if (!data || typeof data !== 'string') {
      console.error('Invalid QR code data');
      return;
    }
    
    const trimmedData = data.trim();
    if (!trimmedData) {
      console.error('Empty QR code data');
      return;
    }
    
    if (trimmedData.length > 2000) {
      console.error('QR code data too long');
      return;
    }
    
    console.log('QR Code data:', trimmedData);
    
    // Handle different types of QR codes
    if (trimmedData.startsWith('http://') || trimmedData.startsWith('https://')) {
      setResultModal({
        visible: true,
        title: 'URL Detectada',
        message: `¿Deseas abrir este enlace?\n\n${trimmedData}`,
        data: trimmedData
      });
    } else if (trimmedData.includes('@') && trimmedData.includes('.')) {
      setResultModal({
        visible: true,
        title: 'Email Detectado',
        message: `Email encontrado: ${trimmedData}`,
        data: trimmedData
      });
    } else if (trimmedData.match(/^\+?[\d\s\-\(\)]+$/)) {
      setResultModal({
        visible: true,
        title: 'Teléfono Detectado',
        message: `Número de teléfono: ${trimmedData}`,
        data: trimmedData
      });
    } else {
      setResultModal({
        visible: true,
        title: 'Código QR Escaneado',
        message: `Contenido: ${trimmedData}`,
        data: trimmedData
      });
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    router.back();
  };

  const handleResultClose = () => {
    setResultModal({ visible: false, title: '', message: '', data: '' });
    router.back();
  };

  const handleResultAction = () => {
    if (resultModal.data.startsWith('http://') || resultModal.data.startsWith('https://')) {
      console.log('Opening URL:', resultModal.data);
      // You could use expo-web-browser to open the URL
    }
    handleResultClose();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Modal
        visible={isVisible}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <QRScanner
          isVisible={isVisible}
          onScan={handleScan}
          onClose={handleClose}
        />
      </Modal>
      
      <Modal
        visible={resultModal.visible}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.resultModalOverlay}>
          <View style={styles.resultModalContent}>
            <View style={styles.resultModalHeader}>
              <Text style={styles.resultModalTitle}>{resultModal.title}</Text>
              <TouchableOpacity onPress={handleResultClose}>
                <X size={24} color={Colors.textLight} />
              </TouchableOpacity>
            </View>
            <Text style={styles.resultModalMessage}>{resultModal.message}</Text>
            <View style={styles.resultModalButtons}>
              <TouchableOpacity style={styles.resultModalButton} onPress={handleResultClose}>
                <Text style={styles.resultModalButtonText}>Cerrar</Text>
              </TouchableOpacity>
              {(resultModal.data.startsWith('http://') || resultModal.data.startsWith('https://')) && (
                <TouchableOpacity style={[styles.resultModalButton, styles.resultModalButtonPrimary]} onPress={handleResultAction}>
                  <Text style={[styles.resultModalButtonText, styles.resultModalButtonTextPrimary]}>Abrir</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  resultModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  resultModalContent: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  resultModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  resultModalMessage: {
    fontSize: 16,
    color: Colors.textLight,
    lineHeight: 24,
    marginBottom: 24,
  },
  resultModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  resultModalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  resultModalButtonPrimary: {
    backgroundColor: Colors.primary,
  },
  resultModalButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  resultModalButtonTextPrimary: {
    color: Colors.white,
  },
});
