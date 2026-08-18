import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, RefreshControl, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useCoWork } from '@/hooks/cowork-store';
import { useUser } from '@/hooks/user-store';
import { useNotifications } from '@/hooks/notification-store';
import { Colors } from '@/constants/colors';
import { ConstellationBackground } from '@/components/ConstellationBackground';
import { TouchableScale } from '@/components/TouchableScale';
import { AccessibleText } from '@/components/AccessibleText';
import {
  ArrowLeft, Building, Calendar, Clock, DollarSign, Layers,
  X, RefreshCw, BookOpen
} from '@/components/SmartIcons';
import { SpaceBooking } from '@/types/user';

// Persisted map of bookingId -> last-known status. Used to emit a local
// notification only when a booking flips to confirmed/cancelled (avoids
// duplicates across refreshes). Stored in AsyncStorage; no backend needed.
const STATUS_KEY = 'cowork_booking_statuses_v1';

const BILLING_LABELS: Record<string, { singular: string; plural: string }> = {
  hour: { singular: 'hora', plural: 'horas' },
  day: { singular: 'día', plural: 'días' },
  week: { singular: 'semana', plural: 'semanas' },
  month: { singular: 'mes', plural: 'meses' },
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pendiente', color: '#8a6400', bg: '#fbeb5c40' },
  confirmed: { label: 'Confirmada', color: '#1f5138', bg: '#9bdbbf50' },
  cancelled: { label: 'Cancelada', color: '#5a5f66', bg: '#c4d8e770' },
};

const todayStr = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const formatDate = (iso: string) => {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts.map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  if (isNaN(dt.getTime())) return iso;
  return dt.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};

const formatPrice = (n: number) =>
  n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

const billingLabel = (unit: string, quantity: number) => {
  const meta = BILLING_LABELS[unit] ?? BILLING_LABELS.hour;
  return `${quantity} ${quantity === 1 ? meta.singular : meta.plural}`;
};

export default function MyBookingsScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser } = useUser();
  const { bookings, fetchGuestBookings, updateBookingStatus, getSpaceById } = useCoWork();
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const bookingTitle = useCallback((b: SpaceBooking) => {
    const space = getSpaceById(b.spaceId);
    const sub = space?.subSpaces.find(s => s.id === b.subSpaceId);
    return sub?.title || space?.title || 'Espacio Co-Work';
  }, [getSpaceById]);

  const loadBookings = useCallback(async () => {
    const rows = await fetchGuestBookings();
    try {
      const raw = await AsyncStorage.getItem(STATUS_KEY);
      const lastKnown: Record<string, string> = raw ? JSON.parse(raw) : {};
      const next: Record<string, string> = {};
      for (const b of rows) {
        next[b.id] = b.status;
        const prev = lastKnown[b.id];
        if (prev && prev !== b.status && b.status !== 'pending' && !(prev === 'cancelled' && b.status === 'cancelled')) {
          if (b.status === 'confirmed') {
            addNotification({
              title: 'Reserva confirmada',
              message: `El anfitrión confirmó tu reserva por "${bookingTitle(b)}".`,
              type: 'success',
            });
          } else if (b.status === 'cancelled') {
            addNotification({
              title: 'Reserva cancelada',
              message: `El anfitrión canceló tu reserva por "${bookingTitle(b)}".`,
              type: 'warning',
            });
          }
        }
      }
      await AsyncStorage.setItem(STATUS_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('Booking status tracking failed (non-fatal):', e);
    }
  }, [fetchGuestBookings, addNotification, bookingTitle]);

  const markSelfCancelled = useCallback(async (id: string) => {
    try {
      const raw = await AsyncStorage.getItem(STATUS_KEY);
      const latest: Record<string, string> = raw ? JSON.parse(raw) : {};
      latest[id] = 'cancelled';
      await AsyncStorage.setItem(STATUS_KEY, JSON.stringify(latest));
    } catch (e) {
      console.warn('Booking status tracking failed (non-fatal):', e);
    }
    // Ensure the flip-detection snapshot for this id reflects 'cancelled'
    // so loadBookings() below does NOT fire "El anfitrión canceló tu reserva"
    try {
      await AsyncStorage.setItem(STATUS_KEY, JSON.stringify({ [id]: 'cancelled' }));
    } catch (e) {
      console.warn('Failed to persist self-cancel snapshot:', e);
    }
  }, []);

  const loadBookingsRef = useRef(loadBookings);
  loadBookingsRef.current = loadBookings;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await loadBookingsRef.current();
      } catch (e) {
        console.warn('Failed to load guest bookings:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadBookings();
    } catch (e) {
      console.warn('Refresh failed:', e);
    } finally {
      setRefreshing(false);
    }
  }, [loadBookings]);

  const { upcoming, past } = useMemo(() => {
    const today = todayStr();
    const up: SpaceBooking[] = [];
    const pa: SpaceBooking[] = [];
    for (const b of bookings) {
      if (b.date >= today) up.push(b);
      else pa.push(b);
    }
    up.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
    pa.sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime));
    return { upcoming: up, past: pa };
  }, [bookings]);

  const handleCancel = useCallback((booking: SpaceBooking) => {
    Alert.alert(
      'Cancelar reserva',
      `¿Seguro que deseas cancelar tu reserva por "${bookingTitle(booking)}" del ${formatDate(booking.date)}?`,
      [
        { text: 'Seguir reservando', style: 'cancel' },
        {
          text: 'Cancelar reserva',
          style: 'destructive',
          onPress: async () => {
            setCancellingId(booking.id);
            try {
              await updateBookingStatus(booking.id, 'cancelled');
              await markSelfCancelled(booking.id);
              await loadBookings();
              addNotification({
                title: 'Reserva cancelada',
                message: `Tu reserva por "${bookingTitle(booking)}" fue cancelada.`,
                type: 'warning',
              });
            } catch (e) {
              console.warn('Cancel failed:', e);
              Alert.alert('Error', 'No se pudo cancelar la reserva. Intenta de nuevo.');
            } finally {
              setCancellingId(null);
            }
          },
        },
      ]
    );
  }, [bookingTitle, updateBookingStatus, markSelfCancelled, loadBookings, addNotification]);

  if (!currentUser) {
    return (
      <ConstellationBackground intensity="light">
        <View style={[styles.container, styles.centered]}>
          <Building size={60} color={Colors.textLight} />
          <Text style={styles.emptyTitle}>Inicia sesión para ver tus reservas</Text>
          <TouchableScale style={styles.primaryBtn} onPress={() => router.push('/login')}>
            <AccessibleText style={styles.primaryBtnText}>Iniciar Sesión</AccessibleText>
          </TouchableScale>
        </View>
      </ConstellationBackground>
    );
  }

  return (
    <ConstellationBackground intensity="light">
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <LinearGradient
          colors={['#2c6d85', '#4f8497', '#6aaaca']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <ArrowLeft size={22} color={Colors.white} />
            </TouchableOpacity>
            <View style={styles.headerTitleBox}>
              <Calendar size={20} color={Colors.white} />
              <Text style={styles.headerTitle}>Mis Reservas</Text>
            </View>
            <TouchableOpacity style={styles.headerRefreshBtn} onPress={onRefresh}>
              <RefreshCw size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerSub}>Modalidad Co-Work – tus reservas de espacios</Text>
        </LinearGradient>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Cargando tus reservas…</Text>
          </View>
        ) : bookings.length === 0 ? (
          <View style={styles.emptyBox}>
            <BookOpen size={72} color={Colors.border} />
            <Text style={styles.emptyTitle}>Aún no tienes reservas</Text>
            <Text style={styles.emptySub}>
              Explora espacios Co-Work y reserva un ambiente por hora, día, semana o mes.
            </Text>
            <TouchableScale style={styles.primaryBtn} onPress={() => router.push('/(tabs)/discover')}>
              <AccessibleText style={styles.primaryBtnText}>Descubrir espacios →</AccessibleText>
            </TouchableScale>
          </View>
        ) : (
          <>
            {upcoming.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Próximas</Text>
                {upcoming.map(b => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    title={bookingTitle(b)}
                    onCancel={() => handleCancel(b)}
                    canCancel={b.status === 'pending' || b.status === 'confirmed'}
                    cancelling={cancellingId === b.id}
                  />
                ))}
              </View>
            )}
            {past.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Anteriores</Text>
                {past.map(b => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    title={bookingTitle(b)}
                    onCancel={() => handleCancel(b)}
                    canCancel={false}
                    cancelling={false}
                  />
                ))}
              </View>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ConstellationBackground>
  );
}

function BookingCard({ booking, title, onCancel, canCancel, cancelling }: {
  booking: SpaceBooking;
  title: string;
  onCancel: () => void;
  canCancel: boolean;
  cancelling: boolean;
}) {
  const space = useCoWork.getState().getSpaceById(booking.spaceId);
  const sub = space?.subSpaces.find(s => s.id === booking.subSpaceId);
  const status = STATUS_META[booking.status] ?? STATUS_META.pending;
  const isInstant = booking.mode === 'instant';

  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.topRow}>
        <View style={cardStyles.titleBox}>
          <Text style={cardStyles.title} numberOfLines={1}>{title}</Text>
          {sub && <Text style={cardStyles.subtitle} numberOfLines={1}>{sub.title}</Text>}
        </View>
        <View style={[cardStyles.badge, { backgroundColor: status.bg }]}>
          <Text style={[cardStyles.badgeText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      <View style={cardStyles.badgeRow}>
        <View style={[cardStyles.modeBadge, { backgroundColor: isInstant ? '#2d6a4f20' : '#2c528220' }]}>
          <Text style={[cardStyles.modeBadgeText, { color: isInstant ? Colors.success : Colors.info }]}>
            {isInstant ? '⚡ Instantánea' : 'Con solicitud'}
          </Text>
        </View>
        <Text style={cardStyles.bookingRef}>Reserva #{booking.id.slice(0, 8)}</Text>
      </View>

      <View style={cardStyles.details}>
        <DetailRow icon={Calendar} text={formatDate(booking.date)} />
        <DetailRow icon={Clock} text={`${booking.startTime} – ${booking.endTime}`} />
        <DetailRow icon={Layers} text={billingLabel(booking.billingUnit, booking.quantity)} />
        <DetailRow icon={DollarSign} text={formatPrice(booking.totalPrice)} strong />
      </View>

      {canCancel && (
        <TouchableOpacity
          style={[cardStyles.cancelBtn, cancelling && cardStyles.cancelBtnDisabled]}
          onPress={onCancel}
          disabled={cancelling}
        >
          <X size={16} color={Colors.error} />
          <Text style={cardStyles.cancelBtnText}>
            {cancelling ? 'Cancelando…' : 'Cancelar reserva'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function DetailRow({ icon: Icon, text, strong }: { icon: any; text: string; strong?: boolean }) {
  return (
    <View style={cardStyles.detailRow}>
      <View style={cardStyles.detailIcon}>
        <Icon size={15} color={Colors.primary} />
      </View>
      <Text style={[cardStyles.detailText, strong && cardStyles.detailTextStrong]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center', padding: 32 },
  scrollContent: { paddingBottom: 120 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginRight: 12,
  },
  headerRefreshBtn: {
    padding: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  headerTitleBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 44,
  },
  loadingBox: {
    alignItems: 'center',
    paddingTop: 64,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textLight,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  emptyBox: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  primaryBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    marginBottom: 16,
    padding: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  titleBox: { flex: 1 },
  title: { fontSize: 16, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textLight, marginTop: 2 },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  modeBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  modeBadgeText: { fontSize: 11, fontWeight: '600' },
  bookingRef: { fontSize: 11, color: Colors.textSecondary },
  details: {
    marginTop: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border + '60',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailText: { fontSize: 14, color: Colors.text },
  detailTextStrong: { fontWeight: '700', color: Colors.primaryDark },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.error + '40',
    backgroundColor: Colors.error + '10',
  },
  cancelBtnDisabled: { opacity: 0.6 },
  cancelBtnText: { fontSize: 13, fontWeight: '700', color: Colors.error },
});
