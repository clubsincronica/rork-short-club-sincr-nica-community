import React, { useState } from 'react';
import { View, StyleSheet, Modal, Text, TouchableOpacity } from 'react-native';
import { QRScanner } from '@/components/QRScanner';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { X } from '@/components/SmartIcons';
import { TicketGenerator } from '@/utils/ticketGenerator';
import { useCalendar } from '@/hooks/calendar-store';
import { ActivityIndicator } from 'react-native';

export default function QRScannerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { updateAttendance } = useCalendar();
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resultModal, setResultModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    data: string;
    type?: string;
  }>({
    visible: false,
    title: '',
    message: '',
    data: '',
    type: ''
  });

  const handleScan = async (data: string) => {
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

    console.log('QR Code data:', trimmedData);

    // Check if it's a Club Sincrónica ticket
    if (trimmedData.includes('CLUB_SINCRONICA_TICKET')) {
      const validation = TicketGenerator.validateQRData(trimmedData);
      if (validation.valid && validation.ticket) {
        setLoading(true);
        const success = await updateAttendance(validation.ticket.reservationId.toString(), true);
        setLoading(false);

        if (success) {
          setResultModal({
            visible: true,
            title: '¡Ticket Válido!',
            message: `Bienvenido/a ${validation.ticket.attendeeName}\n\nEvento: ${validation.ticket.eventTitle}\nAsistencia registrada con éxito.`,
            data: trimmedData,
            type: 'ticket_success'
          });
        } else {
          setResultModal({
            visible: true,
            title: 'Error de Registro',
            message: 'El ticket es válido pero no se pudo registrar la asistencia en el servidor.',
            data: trimmedData,
            type: 'error'
          });
        }
        return;
      } else {
        setResultModal({
          visible: true,
          title: 'Ticket Inválido',
          message: validation.error || 'Este código QR no es un ticket válido de Club Sincrónica.',
          data: trimmedData,
          type: 'error'
        });
        return;
      }
    }

    // Handle different types of QR codes
    if (trimmedData.startsWith('http://') || trimmedData.startsWith('https://')) {
      setResultModal({
        visible: true,
        title: 'URL Detectada',
        message: `¿Deseas abrir este enlace?\n\n${trimmedData}`,
        data: trimmedData,
        type: 'url'
      });
    } else if (trimmedData.includes('@') && trimmedData.includes('.')) {
      setResultModal({
        visible: true,
        title: 'Email Detectado',
        message: `Email encontrado: ${trimmedData}`,
        data: trimmedData,
        type: 'email'
      });
    } else if (trimmedData.match(/^\+?[\d\s\-\(\)]+$/)) {
      setResultModal({
        visible: true,
        title: 'Teléfono Detectado',
        message: `Número de teléfono: ${trimmedData}`,
        data: trimmedData,
        type: 'phone'
      });
    } else {
      setResultModal({
        visible: true,
        title: 'Código QR Escaneado',
        message: `Contenido: ${trimmedData}`,
        data: trimmedData,
        type: 'text'
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
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Procesando...</Text>
          </View>
        )}
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
              {resultModal.type === 'ticket_success' || resultModal.type === 'error' ? (
                <TouchableOpacity style={[styles.resultModalButton, styles.resultModalButtonPrimary]} onPress={handleResultClose}>
                  <Text style={[styles.resultModalButtonText, styles.resultModalButtonTextPrimary]}>Aceptar</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity style={styles.resultModalButton} onPress={handleResultClose}>
                    <Text style={styles.resultModalButtonText}>Cerrar</Text>
                  </TouchableOpacity>
                  {(resultModal.data.startsWith('http://') || resultModal.data.startsWith('https://')) && (
                    <TouchableOpacity style={[styles.resultModalButton, styles.resultModalButtonPrimary]} onPress={handleResultAction}>
                      <Text style={[styles.resultModalButtonText, styles.resultModalButtonTextPrimary]}>Abrir</Text>
                    </TouchableOpacity>
                  )}
                </>
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
});
