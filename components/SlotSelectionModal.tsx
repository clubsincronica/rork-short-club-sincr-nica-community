import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { X, Plus, Clock } from '@/components/SmartIcons';
import { Colors } from '@/constants/colors';

interface SlotSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSaveSlot: (slot: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    maxSlots?: number;
  }) => void;
}

const DAYS_OF_WEEK = [
  { id: 0, name: 'Domingo', short: 'Dom' },
  { id: 1, name: 'Lunes', short: 'Lun' },
  { id: 2, name: 'Martes', short: 'Mar' },
  { id: 3, name: 'Miércoles', short: 'Mié' },
  { id: 4, name: 'Jueves', short: 'Jue' },
  { id: 5, name: 'Viernes', short: 'Vie' },
  { id: 6, name: 'Sábado', short: 'Sáb' },
];

const TIME_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00', '22:30'
];

export function SlotSelectionModal({ visible, onClose, onSaveSlot }: SlotSelectionModalProps) {
  const [selectedDays, setSelectedDays] = useState<number[]>([1]); // Monday default
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('10:00');
  const [maxSlots, setMaxSlots] = useState<string>('1');

  const handleSave = () => {
    // Validate that end time is after start time
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    
    if (endMinutes <= startMinutes) {
      alert('La hora de fin debe ser posterior a la hora de inicio');
      return;
    }

    // Create a slot for each selected day
    selectedDays.forEach(dayOfWeek => {
      onSaveSlot({
        dayOfWeek,
        startTime,
        endTime,
        maxSlots: parseInt(maxSlots) || 1
      });
    });

    // Reset form
    setSelectedDays([1]);
    setStartTime('09:00');
    setEndTime('10:00');
    setMaxSlots('1');
    onClose();
  };

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>⏰ Nuevo Horario</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Plus size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Day Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 Día de la Semana</Text>
            <View style={styles.daysGrid}>
              {DAYS_OF_WEEK.map((day) => (
                <TouchableOpacity
                  key={day.id}
                  style={[
                    styles.dayButton,
                    selectedDays.includes(day.id) && styles.dayButtonSelected
                  ]}
                  onPress={() => {
                    if (selectedDays.includes(day.id)) {
                      setSelectedDays(selectedDays.filter(d => d !== day.id));
                    } else {
                      setSelectedDays([...selectedDays, day.id]);
                    }
                  }}
                >
                  <Text style={[
                    styles.dayButtonText,
                    selectedDays.includes(day.id) && styles.dayButtonTextSelected
                  ]}>
                    {day.short}
                  </Text>
                  <Text style={[
                    styles.dayButtonName,
                    selectedDays.includes(day.id) && styles.dayButtonNameSelected
                  ]}>
                    {day.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Time Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🕒 Horario</Text>
            
            <View style={styles.timeContainer}>
              <View style={styles.timeSection}>
                <Text style={styles.timeLabel}>Inicio</Text>
                <ScrollView 
                  style={styles.timeScroll} 
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                >
                  {TIME_SLOTS.map((time) => (
                    <TouchableOpacity
                      key={`start-${time}`}
                      style={[
                        styles.timeButton,
                        startTime === time && styles.timeButtonSelected
                      ]}
                      onPress={() => setStartTime(time)}
                    >
                      <Text style={[
                        styles.timeButtonText,
                        startTime === time && styles.timeButtonTextSelected
                      ]}>
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.timeArrow}>
                <Clock size={20} color={Colors.primary} />
              </View>

              <View style={styles.timeSection}>
                <Text style={styles.timeLabel}>Fin</Text>
                <ScrollView 
                  style={styles.timeScroll} 
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                >
                  {TIME_SLOTS.map((time) => (
                    <TouchableOpacity
                      key={`end-${time}`}
                      style={[
                        styles.timeButton,
                        endTime === time && styles.timeButtonSelected
                      ]}
                      onPress={() => setEndTime(time)}
                    >
                      <Text style={[
                        styles.timeButtonText,
                        endTime === time && styles.timeButtonTextSelected
                      ]}>
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            
            <Text style={styles.durationHint}>
              ⏱️ Duración: {Math.max(0, (timeToMinutes(endTime) - timeToMinutes(startTime)) / 60).toFixed(1)} horas
            </Text>
          </View>

          {/* Max Slots */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👥 Capacidad</Text>
            <TextInput
              style={styles.input}
              value={maxSlots}
              onChangeText={setMaxSlots}
              placeholder="1"
              keyboardType="numeric"
            />
            <Text style={styles.hint}>
              🎯 Máximo número de reservas simultáneas para este horario
            </Text>
          </View>

          {/* Preview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👁️ Vista Previa</Text>
            <View style={styles.preview}>
              <Text style={styles.previewText}>
                📅 {selectedDays.length > 0 ? selectedDays.map(dayId => DAYS_OF_WEEK[dayId].name).join(', ') : 'Ningún día seleccionado'}
              </Text>
              <Text style={styles.previewText}>
                🕒 {startTime} - {endTime}
              </Text>
              <Text style={styles.previewText}>
                👥 Hasta {maxSlots} reserva{maxSlots !== '1' ? 's' : ''}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  saveButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    flex: 1,
    minWidth: 80,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: 'center',
  },
  dayButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  dayButtonTextSelected: {
    color: Colors.white,
  },
  dayButtonName: {
    fontSize: 10,
    color: Colors.textLight,
    marginTop: 2,
  },
  dayButtonNameSelected: {
    color: Colors.white,
  },
  timeContainer: {
    flexDirection: 'row',
    gap: 16,
    height: 200,
  },
  timeSection: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  timeScroll: {
    flex: 1,
    maxHeight: 150,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeButton: {
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  timeButtonSelected: {
    backgroundColor: Colors.primary + '20',
  },
  timeButtonText: {
    fontSize: 14,
    color: Colors.text,
  },
  timeButtonTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  timeArrow: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
  },
  durationHint: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: Colors.white,
    textAlign: 'center',
  },
  hint: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 4,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  preview: {
    backgroundColor: Colors.secondary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  previewText: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 4,
  },
});