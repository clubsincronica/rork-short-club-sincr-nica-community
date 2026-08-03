import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Dimensions, Modal, TextInput
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useCoWork } from '@/hooks/cowork-store';
import { useUser } from '@/hooks/user-store';
import { Colors } from '@/constants/colors';
import { ConstellationBackground } from '@/components/ConstellationBackground';
import { TouchableScale } from '@/components/TouchableScale';
import {
  ArrowLeft, MapPin, Star, Users, Clock, DollarSign, Calendar,
  CheckCircle, ChevronRight, Layers, Building, Key
} from '@/components/SmartIcons';
import { SubSpace, CoWorkSpace, BillingUnit, SpaceBooking } from '@/types/user';

const { width } = Dimensions.get('window');

const BILLING_LABELS: Record<BillingUnit, { label: string; plural: string }> = {
  hour: { label: 'hora', plural: 'horas' },
  day: { label: 'día', plural: 'días' },
  week: { label: 'semana', plural: 'semanas' },
  month: { label: 'mes', plural: 'meses' },
};

const TYPE_ICONS: Record<string, string> = {
  'streaming-set': '🎬', 'recording-booth': '🎧', 'office': '💼',
  'studio': '🎨', 'meeting-room': '📋', 'event-space': '🎉',
  'coworking-desk': '💻', 'other': '🏠',
};

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

export default function CoWorkDetailScreen() {
  const insets = useSafeAreaInsets();
  const { spaceId, subSpaceId } = useLocalSearchParams<{ spaceId: string; subSpaceId?: string }>();
  const { currentUser } = useUser();
  const { getSpaceById, getBookingsForSubSpace, addBooking, isSlotAvailable, loadData } = useCoWork();

  const [selectedSubSpace, setSelectedSubSpace] = useState<SubSpace | null>(null);
  const [selectedBilling, setSelectedBilling] = useState<BillingUnit | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [startTime, setStartTime] = useState('09:00');
  const [quantity, setQuantity] = useState(1);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  useEffect(() => { loadData(); }, []);

  const space = useMemo(() => getSpaceById(spaceId || ''), [spaceId, getSpaceById]);

  // Pre-select sub-space from params
  useEffect(() => {
    if (space && subSpaceId) {
      const sub = space.subSpaces.find(s => s.id === subSpaceId);
      if (sub) setSelectedSubSpace(sub);
    }
  }, [space, subSpaceId]);

  const subSpaceBookings = useMemo(() =>
    selectedSubSpace ? getBookingsForSubSpace(selectedSubSpace.id) : [],
    [selectedSubSpace, getBookingsForSubSpace]
  );

  const priceForBilling = useMemo((): number => {
    if (!selectedSubSpace || !selectedBilling) return 0;
    return {
      hour: selectedSubSpace.pricePerHour,
      day: selectedSubSpace.pricePerDay,
      week: selectedSubSpace.pricePerWeek,
      month: selectedSubSpace.pricePerMonth,
    }[selectedBilling] || 0;
  }, [selectedSubSpace, selectedBilling]);

  const totalPrice = priceForBilling * quantity;

  const calculateEndTime = (start: string, hrs: number) => {
    const [h] = start.split(':').map(Number);
    return `${String((h + hrs) % 24).padStart(2, '0')}:00`;
  };

  const endTime = selectedBilling === 'hour' ? calculateEndTime(startTime, quantity) : '23:59';

  const dateStr = selectedDate
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
    : '';

  const isAvailable = useMemo(() => {
    if (!selectedSubSpace || !dateStr) return true;
    return isSlotAvailable(selectedSubSpace.id, dateStr, startTime, endTime);
  }, [selectedSubSpace, dateStr, startTime, endTime]);

  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const bookedDays = useMemo(() => {
    if (!selectedSubSpace) return new Set<string>();
    return new Set(subSpaceBookings.filter(b => b.status !== 'cancelled').map(b => b.date));
  }, [subSpaceBookings, selectedSubSpace]);

  const handleBook = async () => {
    if (!currentUser) { Alert.alert('Inicia sesión', 'Necesitas estar logueado para reservar.'); return; }
    if (!selectedSubSpace || !selectedDate || !selectedBilling) {
      Alert.alert('Faltan datos', 'Selecciona un sub-espacio, fecha y tipo de facturación.'); return;
    }
    if (!isAvailable) { Alert.alert('No disponible', 'Ese horario ya está reservado.'); return; }

    try {
      await addBooking({
        subSpaceId: selectedSubSpace.id,
        spaceId: space!.id,
        userId: String(currentUser.id),
        date: dateStr,
        startTime,
        endTime,
        billingUnit: selectedBilling,
        quantity,
        totalPrice,
        notes,
      });
      setShowBookingModal(false);
      setBookingConfirmed(true);
    } catch (e) {
      Alert.alert('Error', 'No se pudo completar la reserva.');
    }
  };

  if (!space) {
    return (
      <ConstellationBackground intensity="light">
        <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
          <Building size={60} color={Colors.textLight} />
          <Text style={{ fontSize: 16, color: Colors.text, marginTop: 12 }}>Espacio no encontrado</Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20, padding: 12, backgroundColor: Colors.primary, borderRadius: 12 }}>
            <Text style={{ color: Colors.white, fontWeight: '700' }}>Volver</Text>
          </TouchableOpacity>
        </View>
      </ConstellationBackground>
    );
  }

  if (bookingConfirmed) {
    return (
      <ConstellationBackground intensity="light">
        <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }]}>
          <LinearGradient colors={['#4f8497', '#9bdbbf']} style={styles.confirmIcon}>
            <CheckCircle size={48} color={Colors.white} />
          </LinearGradient>
          <Text style={styles.confirmTitle}>¡Reserva confirmada!</Text>
          <Text style={styles.confirmSub}>
            Tu reserva en {selectedSubSpace?.title} está confirmada para el {dateStr}.
          </Text>
          <Text style={styles.confirmPrice}>Total: ${totalPrice.toLocaleString()}</Text>
          <TouchableOpacity style={styles.confirmBtn} onPress={() => router.back()}>
            <Text style={styles.confirmBtnText}>Volver al inicio</Text>
          </TouchableOpacity>
        </View>
      </ConstellationBackground>
    );
  }

  return (
    <ConstellationBackground intensity="light">
      <ScrollView style={[styles.container, { paddingTop: insets.top }]} showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.heroContainer}>
          <LinearGradient
            colors={['#2c6d85', '#4f8497', '#9bdbbf']}
            style={styles.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <TouchableOpacity style={[styles.backBtn, { top: 16 + insets.top }]} onPress={() => router.back()}>
            <ArrowLeft size={22} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>{space.title}</Text>
            <View style={styles.heroMeta}>
              <MapPin size={14} color="rgba(255,255,255,0.9)" />
              <Text style={styles.heroLocation}>{space.location}</Text>
            </View>
            {space.rating > 0 && (
              <View style={styles.heroRating}>
                <Star size={13} color={Colors.gold} />
                <Text style={styles.heroRatingText}>{space.rating.toFixed(1)} ({space.reviewCount} reseñas)</Text>
              </View>
            )}
          </View>
        </View>

        {/* Space description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre este espacio</Text>
          <Text style={styles.description}>{space.description}</Text>
          <View style={styles.tagsRow}>
            {space.tags.map(tag => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Sub-spaces */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Elige un espacio para reservar</Text>
          <Text style={styles.sectionSub}>Selecciona el ambiente que mejor se adapte a tus necesidades</Text>
          {space.subSpaces.filter(s => s.isActive).map(sub => (
            <SubSpaceCard
              key={sub.id}
              sub={sub}
              isSelected={selectedSubSpace?.id === sub.id}
              onSelect={() => {
                setSelectedSubSpace(sub);
                setSelectedBilling(sub.billingUnits[0]);
                setQuantity(1);
                setSelectedDate(null);
              }}
            />
          ))}
        </View>

        {/* Billing selector */}
        {selectedSubSpace && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>¿Cómo quieres reservar?</Text>
            <View style={styles.billingRow}>
              {selectedSubSpace.billingUnits.map(unit => {
                const price = { hour: selectedSubSpace.pricePerHour, day: selectedSubSpace.pricePerDay, week: selectedSubSpace.pricePerWeek, month: selectedSubSpace.pricePerMonth }[unit] || 0;
                return (
                  <TouchableOpacity
                    key={unit}
                    style={[styles.billingChip, selectedBilling === unit && styles.billingChipActive]}
                    onPress={() => { setSelectedBilling(unit); setQuantity(1); }}
                  >
                    <Text style={[styles.billingChipLabel, selectedBilling === unit && styles.billingChipLabelActive]}>
                      por {BILLING_LABELS[unit].label}
                    </Text>
                    <Text style={[styles.billingChipPrice, selectedBilling === unit && styles.billingChipPriceActive]}>
                      ${price.toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Quantity */}
            <View style={styles.quantityRow}>
              <Text style={styles.quantityLabel}>Cantidad de {selectedBilling ? BILLING_LABELS[selectedBilling].plural : ''}:</Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity style={styles.quantityBtn} onPress={() => setQuantity(Math.max(1, quantity - 1))}>
                  <Text style={styles.quantityBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.quantityValue}>{quantity}</Text>
                <TouchableOpacity style={styles.quantityBtn} onPress={() => setQuantity(quantity + 1)}>
                  <Text style={styles.quantityBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Hour start time */}
            {selectedBilling === 'hour' && (
              <View style={styles.timeRow}>
                <Text style={styles.quantityLabel}>Hora de inicio:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeScroll}>
                  {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'].map(h => (
                    <TouchableOpacity
                      key={h}
                      style={[styles.timeChip, startTime === h && styles.timeChipActive]}
                      onPress={() => setStartTime(h)}
                    >
                      <Text style={[styles.timeChipText, startTime === h && styles.timeChipTextActive]}>{h}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* Date picker */}
        {selectedSubSpace && selectedBilling && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Selecciona una fecha</Text>
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={() => { const d = new Date(selectedMonth); d.setMonth(d.getMonth() - 1); setSelectedMonth(d); }}>
                <Text style={styles.navArrow}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.monthTitle}>{MONTHS[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}</Text>
              <TouchableOpacity onPress={() => { const d = new Date(selectedMonth); d.setMonth(d.getMonth() + 1); setSelectedMonth(d); }}>
                <Text style={styles.navArrow}>›</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.weekHeaders}>
              {WEEKDAYS.map(d => <Text key={d} style={styles.weekHeader}>{d}</Text>)}
            </View>
            <View style={styles.calGrid}>
              {[...Array(firstDayOfMonth(selectedMonth)).fill(null), ...Array.from({ length: daysInMonth(selectedMonth) }, (_, i) => i + 1)].map((day, idx) => {
                if (!day) return <View key={`e-${idx}`} style={styles.calCell} />;
                const dStr = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isBooked = bookedDays.has(dStr);
                const isPast = new Date(dStr) < new Date(new Date().toDateString());
                const isSel = selectedDate?.getDate() === day && selectedDate?.getMonth() === selectedMonth.getMonth() && selectedDate?.getFullYear() === selectedMonth.getFullYear();
                return (
                  <TouchableOpacity
                    key={day}
                    style={[styles.calCell, isSel && styles.calCellSelected, (isBooked || isPast) && styles.calCellUnavailable]}
                    onPress={() => {
                      if (!isBooked && !isPast) setSelectedDate(new Date(dStr));
                    }}
                    disabled={isBooked || isPast}
                  >
                    <Text style={[styles.calDayText, isSel && styles.calDayTextSelected, (isBooked || isPast) && styles.calDayTextUnavailable]}>
                      {day}
                    </Text>
                    {isBooked && <View style={styles.bookedDot} />}
                  </TouchableOpacity>
                );
              })}
            </View>
            {selectedDate && (
              <View style={styles.selectedDateBadge}>
                <Calendar size={14} color={Colors.primary} />
                <Text style={styles.selectedDateText}>
                  {WEEKDAYS[selectedDate.getDay()]} {selectedDate.getDate()} de {MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Price summary & Book button */}
        {selectedSubSpace && selectedBilling && selectedDate && (
          <View style={styles.bookingFooter}>
            <View>
              <Text style={styles.totalLabel}>Total estimado</Text>
              <Text style={styles.totalPrice}>${totalPrice.toLocaleString()}</Text>
              <Text style={styles.totalSub}>
                {quantity} {BILLING_LABELS[selectedBilling].plural} · {selectedSubSpace.title}
              </Text>
            </View>
            <TouchableScale
              style={[styles.bookBtn, !isAvailable && { backgroundColor: Colors.error }]}
              onPress={() => isAvailable ? setShowBookingModal(true) : Alert.alert('No disponible', 'Ese horario ya está reservado.')}
            >
              <Text style={styles.bookBtnText}>
                {isAvailable ? 'Reservar ahora' : 'No disponible'}
              </Text>
            </TouchableScale>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Booking Confirmation Modal */}
      <Modal visible={showBookingModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirmar Reserva</Text>
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Espacio:</Text>
              <Text style={styles.modalValue}>{selectedSubSpace?.title}</Text>
            </View>
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Fecha:</Text>
              <Text style={styles.modalValue}>{dateStr}</Text>
            </View>
            {selectedBilling === 'hour' && (
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Horario:</Text>
                <Text style={styles.modalValue}>{startTime} – {endTime}</Text>
              </View>
            )}
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Duración:</Text>
              <Text style={styles.modalValue}>{quantity} {selectedBilling ? BILLING_LABELS[selectedBilling].plural : ''}</Text>
            </View>
            <View style={[styles.modalRow, { borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 8, paddingTop: 12 }]}>
              <Text style={[styles.modalLabel, { fontWeight: '800', fontSize: 16 }]}>Total:</Text>
              <Text style={[styles.modalValue, { fontWeight: '800', fontSize: 18, color: Colors.primary }]}>${totalPrice.toLocaleString()}</Text>
            </View>
            <TextInput
              style={styles.notesInput}
              placeholder="Notas adicionales (opcional)..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              placeholderTextColor={Colors.textLight}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowBookingModal(false)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableScale style={styles.modalConfirmBtn} onPress={handleBook}>
                <Text style={styles.modalConfirmText}>Confirmar</Text>
              </TouchableScale>
            </View>
          </View>
        </View>
      </Modal>
    </ConstellationBackground>
  );
}

function SubSpaceCard({ sub, isSelected, onSelect }: { sub: SubSpace; isSelected: boolean; onSelect: () => void }) {
  const lowestPrice = useMemo(() => {
    const prices = [sub.pricePerHour, sub.pricePerDay, sub.pricePerWeek, sub.pricePerMonth].filter(Boolean) as number[];
    return prices.length > 0 ? Math.min(...prices) : 0;
  }, [sub]);

  const lowestUnit = sub.billingUnits[0];

  return (
    <TouchableOpacity
      style={[subCard.card, isSelected && { borderColor: sub.color || Colors.primary, borderWidth: 2.5 }]}
      onPress={onSelect}
      activeOpacity={0.85}
    >
      {isSelected && (
        <View style={[subCard.selectedBadge, { backgroundColor: sub.color || Colors.primary }]}>
          <CheckCircle size={14} color={Colors.white} />
          <Text style={subCard.selectedBadgeText}>Seleccionado</Text>
        </View>
      )}
      <View style={[subCard.colorStrip, { backgroundColor: sub.color || Colors.primary }]} />
      <View style={{ flex: 1, padding: 14 }}>
        <View style={subCard.titleRow}>
          <Text style={subCard.emoji}>{TYPE_ICONS[sub.type] || '🏠'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={subCard.title}>{sub.title}</Text>
            {sub.floorLabel && <Text style={subCard.floor}>{sub.floorLabel}</Text>}
          </View>
          <View>
            <Text style={[subCard.price, { color: sub.color || Colors.primary }]}>${lowestPrice.toLocaleString()}</Text>
            <Text style={subCard.priceSub}>/{BILLING_LABELS[lowestUnit].label}</Text>
          </View>
        </View>
        <Text style={subCard.description} numberOfLines={2}>{sub.description}</Text>
        <View style={subCard.metaRow}>
          <View style={subCard.metaItem}>
            <Users size={12} color={Colors.textLight} />
            <Text style={subCard.metaText}>hasta {sub.capacity}</Text>
          </View>
          {sub.billingUnits.map(u => (
            <View key={u} style={[subCard.unitTag, { borderColor: (sub.color || Colors.primary) + '60' }]}>
              <Text style={[subCard.unitTagText, { color: sub.color || Colors.primary }]}>por {BILLING_LABELS[u].label}</Text>
            </View>
          ))}
        </View>
        {sub.features.slice(0, 3).length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 5, marginTop: 8 }}>
            {sub.features.slice(0, 3).map(f => (
              <View key={f} style={subCard.featureTag}><Text style={subCard.featureText}>✓ {f}</Text></View>
            ))}
          </ScrollView>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroContainer: { height: 240, position: 'relative' },
  hero: { ...StyleSheet.absoluteFill },
  backBtn: {
    position: 'absolute', left: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20, padding: 10,
    zIndex: 10,
  },
  heroContent: {
    position: 'absolute', bottom: 24, left: 20, right: 20,
  },
  heroTitle: { fontSize: 26, fontWeight: '900', color: Colors.white, marginBottom: 6, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroLocation: { fontSize: 13, color: 'rgba(255,255,255,0.9)' },
  heroRating: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  heroRatingText: { fontSize: 13, color: Colors.gold, fontWeight: '600' },
  section: {
    paddingHorizontal: 16, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.border + '40',
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 6 },
  sectionSub: { fontSize: 13, color: Colors.textLight, marginBottom: 14 },
  description: { fontSize: 14, color: Colors.textLight, lineHeight: 21 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  tag: { backgroundColor: Colors.primary + '15', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  billingRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  billingChip: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center', minWidth: 90,
  },
  billingChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  billingChipLabel: { fontSize: 12, color: Colors.textLight, fontWeight: '600' },
  billingChipLabelActive: { color: Colors.white },
  billingChipPrice: { fontSize: 16, fontWeight: '800', color: Colors.text, marginTop: 2 },
  billingChipPriceActive: { color: Colors.white },
  quantityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  quantityLabel: { fontSize: 14, fontWeight: '600', color: Colors.text },
  quantityControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  quantityBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.primary + '20', alignItems: 'center', justifyContent: 'center' },
  quantityBtnText: { fontSize: 20, color: Colors.primary, fontWeight: '700', lineHeight: 22 },
  quantityValue: { fontSize: 20, fontWeight: '800', color: Colors.text, minWidth: 28, textAlign: 'center' },
  timeRow: { marginTop: 8 },
  timeScroll: { gap: 6, paddingVertical: 8 },
  timeChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  timeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  timeChipText: { fontSize: 13, color: Colors.textLight, fontWeight: '600' },
  timeChipTextActive: { color: Colors.white },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  navArrow: { fontSize: 28, color: Colors.primary, fontWeight: '300', paddingHorizontal: 8 },
  monthTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  weekHeaders: { flexDirection: 'row', marginBottom: 6 },
  weekHeader: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: Colors.textLight },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: (width - 32) / 7, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  calCellSelected: { backgroundColor: Colors.primary },
  calCellUnavailable: { opacity: 0.35 },
  calDayText: { fontSize: 14, color: Colors.text, fontWeight: '500' },
  calDayTextSelected: { color: Colors.white, fontWeight: '800' },
  calDayTextUnavailable: { color: Colors.textLight },
  bookedDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.error, marginTop: 2 },
  selectedDateBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 12, backgroundColor: Colors.primary + '15',
    borderRadius: 12, padding: 12,
  },
  selectedDateText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  bookingFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 20,
    backgroundColor: Colors.white,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 8,
    borderTopWidth: 1, borderTopColor: Colors.border + '40',
  },
  totalLabel: { fontSize: 12, color: Colors.textLight, fontWeight: '600' },
  totalPrice: { fontSize: 26, fontWeight: '900', color: Colors.text },
  totalSub: { fontSize: 11, color: Colors.textLight, marginTop: 2 },
  bookBtn: {
    backgroundColor: Colors.primary, borderRadius: 16,
    paddingHorizontal: 22, paddingVertical: 14,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  bookBtnText: { color: Colors.white, fontWeight: '800', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 20 },
  modalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalLabel: { fontSize: 14, color: Colors.textLight, fontWeight: '600' },
  modalValue: { fontSize: 14, color: Colors.text, fontWeight: '700' },
  notesInput: {
    marginTop: 12, borderWidth: 1, borderColor: Colors.border, borderRadius: 12,
    padding: 12, fontSize: 14, color: Colors.text, minHeight: 70, textAlignVertical: 'top',
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: Colors.background, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  modalCancelText: { fontSize: 15, fontWeight: '700', color: Colors.textLight },
  modalConfirmBtn: { flex: 1.5, paddingVertical: 14, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center' },
  modalConfirmText: { fontSize: 15, fontWeight: '800', color: Colors.white },
  confirmIcon: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  confirmTitle: { fontSize: 24, fontWeight: '900', color: Colors.text, marginBottom: 12, textAlign: 'center' },
  confirmSub: { fontSize: 14, color: Colors.textLight, textAlign: 'center', lineHeight: 21, marginBottom: 8 },
  confirmPrice: { fontSize: 22, fontWeight: '800', color: Colors.primary, marginTop: 8 },
  confirmBtn: { marginTop: 28, backgroundColor: Colors.primary, borderRadius: 16, paddingHorizontal: 32, paddingVertical: 14 },
  confirmBtnText: { color: Colors.white, fontWeight: '800', fontSize: 16 },
});

const subCard = StyleSheet.create({
  card: {
    flexDirection: 'row', backgroundColor: Colors.white, borderRadius: 18, marginBottom: 14,
    overflow: 'hidden', borderWidth: 1.5, borderColor: Colors.border + '80',
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  selectedBadge: {
    position: 'absolute', top: 10, right: 10, zIndex: 5,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4,
  },
  selectedBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.white },
  colorStrip: { width: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  emoji: { fontSize: 22, marginRight: 8 },
  title: { fontSize: 15, fontWeight: '800', color: Colors.text },
  floor: { fontSize: 11, color: Colors.textLight, fontWeight: '600', marginTop: 1 },
  price: { fontSize: 18, fontWeight: '900', textAlign: 'right' },
  priceSub: { fontSize: 11, color: Colors.textLight, textAlign: 'right' },
  description: { fontSize: 12, color: Colors.textLight, lineHeight: 18, marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: Colors.textLight },
  unitTag: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  unitTagText: { fontSize: 10, fontWeight: '700' },
  featureTag: { backgroundColor: Colors.success + '15', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  featureText: { fontSize: 10, color: Colors.success, fontWeight: '600' },
});
