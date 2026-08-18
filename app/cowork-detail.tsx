import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Modal, TextInput, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';
import { useCoWork } from '@/hooks/cowork-store';
import { useUser } from '@/hooks/user-store';
import { Colors } from '@/constants/colors';
import { ConstellationBackground } from '@/components/ConstellationBackground';
import { TouchableScale } from '@/components/TouchableScale';
import { SkeletonCard } from '@/components/SkeletonLoader';
import { SlotGrid, suggestNextSlot } from '@/components/SlotGrid';
import { ApiError, apiFetch } from '@/utils/apiClient';
import {
  ArrowLeft, MapPin, Star, Users, Clock, Calendar, CheckCircle,
  CreditCard, Lock, AlertCircle, Building, Info,
} from '@/components/SmartIcons';
import { SubSpace, CoWorkSpace, BillingUnit, SlotCell } from '@/types/user';

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

const DURATION_MAX = 31;

type TimeRef = { date: string; time: string };

interface BookingDraft {
  date: string;
  startTime: string;
  endTime: string;
  quantity: number;
  endDate: string;
}

interface DoneState {
  mode: 'instant' | 'request';
  totalPrice: number;
  date: string;
  subspaceTitle: string;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

const formatDate = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const todayStr = () => formatDate(new Date());

const monthStartStr = (dateStr: string) => `${dateStr.slice(0, 7)}-01`;

const monthEndStr = (monthFirst: string) => {
  const y = Number(monthFirst.slice(0, 4));
  const m = Number(monthFirst.slice(5, 7));
  return `${y}-${pad2(m)}-${pad2(new Date(y, m, 0).getDate())}`;
};

const addDays = (dateStr: string, days: number): string => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return formatDate(new Date(y, m - 1, d + days));
};

const addMonths = (dateStr: string, months: number): string => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return formatDate(new Date(y, m - 1 + months, d));
};

const dateDiffDays = (a: string, b: string): number => {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round(
    (new Date(by, bm - 1, bd).getTime() - new Date(ay, am - 1, ad).getTime()) / 86400000
  );
};

const timeToMinute = (t: string): number => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const minutesToTime = (min: number): string => {
  const c = ((min % 1440) + 1440) % 1440;
  return `${pad2(Math.floor(c / 60))}:${pad2(c % 60)}`;
};

const STATE_RANK: Record<SlotCell['state'], number> = { available: 3, booked: 2, blocked: 1, closed: 0 };

// unified calendar mode: overlay every active subspace's availability into one grid.
// A time-slot shows as available when any subspace offers it; otherwise the least
// restrictive state (booked > blocked > closed) wins.
function mergeAvailability(subs: SubSpace[]): { date: string; cells: SlotCell[] }[] {
  const byDate: Record<string, Record<string, SlotCell>> = {};
  for (const sub of subs) {
    for (const day of sub.availability ?? []) {
      if (!byDate[day.date]) byDate[day.date] = {};
      for (const cell of day.cells) {
        const cur = byDate[day.date][cell.start];
        if (!cur || STATE_RANK[cell.state] > STATE_RANK[cur.state]) {
          byDate[day.date][cell.start] = cell;
        }
      }
    }
  }
  return Object.keys(byDate)
    .sort()
    .map(d => ({
      date: d,
      cells: Object.values(byDate[d]).sort((a, b) => a.start.localeCompare(b.start)),
    }));
}

const STRIPE_PUBLISHABLE_KEY = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Constants = require('expo-constants').default;
    const key =
      Constants?.expoConfig?.extra?.stripePublishableKey ||
      Constants?.manifest?.extra?.stripePublishableKey;
    if (key) return key;
  } catch { /* expo-constants unavailable */ }
  if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_STRIPE_KEY) {
    return process.env.EXPO_PUBLIC_STRIPE_KEY;
  }
  return '';
})();

function CoWorkDetailInner() {
  const insets = useSafeAreaInsets();
  const { spaceId, subSpaceId } = useLocalSearchParams<{ spaceId: string; subSpaceId?: string }>();
  const { currentUser } = useUser();
  const { fetchSpaceDetail, createBooking, fetchGuestBookings } = useCoWork();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [space, setSpace] = useState<CoWorkSpace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [payNotice, setPayNotice] = useState<string | null>(null);
  const [visibleMonth, setVisibleMonth] = useState(() => monthStartStr(todayStr()));
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [selectedBilling, setSelectedBilling] = useState<BillingUnit | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedStart, setSelectedStart] = useState<TimeRef | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<TimeRef | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<{ bookingId: number; totalPrice: number } | null>(null);
  const [paymentBusy, setPaymentBusy] = useState<'stripe' | 'mp' | null>(null);
  const [done, setDone] = useState<DoneState | null>(null);

  const loadDetail = useCallback(
    async (monthFirst: string, silent = false) => {
      if (!spaceId) return;
      if (!silent) setIsLoading(true);
      try {
        const detail = await fetchSpaceDetail(spaceId, {
          from: monthFirst,
          to: monthEndStr(monthFirst),
        });
        if (!detail) {
          setSpace(null);
          setNotFound(true);
          setLoadError(false);
          return;
        }
        setSpace(detail);
        setNotFound(false);
        setLoadError(false);
        setSelectedSubId(prev => {
          if (prev && detail.subSpaces.some(s => s.id === prev)) return prev;
          return subSpaceId && detail.subSpaces.some(s => s.id === subSpaceId) ? subSpaceId : null;
        });
        setHint(null);
      } catch {
        // 404s map to null inside fetchSpaceDetail; anything reaching here is a
        // real failure (network/server), so render the retryable error state.
        setLoadError(true);
        setNotFound(false);
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [spaceId, subSpaceId, fetchSpaceDetail]
  );

  useEffect(() => {
    if (!spaceId) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }
    loadDetail(monthStartStr(todayStr()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeSubs = useMemo(() => (space?.subSpaces ?? []).filter(s => s.isActive), [space]);

  const selectedSubSpace = useMemo(
    () => activeSubs.find(s => s.id === selectedSubId) ?? null,
    [activeSubs, selectedSubId]
  );

  // Single source of truth for instant mode, aligned with the backend: checkout
  // derives mode from sub.instant_book (the same column the store maps into
  // SubSpace.instantBook). The confirm-modal row and the payment handoff
  // therefore read the same signal, so the "Instantáneo" label can never
  // disagree with the flow that opens the pay modal.
  const isInstantBook = !!selectedSubSpace?.instantBook;

  const calendarMode = space?.calendarMode === 'separate' ? 'separate' : 'unified';

  const gridDays = useMemo(() => {
    if (!space) return [];
    return calendarMode === 'unified' ? mergeAvailability(activeSubs) : (selectedSubSpace?.availability ?? []);
  }, [space, calendarMode, activeSubs, selectedSubSpace]);

  const availableDates = useMemo(
    () => gridDays.filter(d => d.cells.some(c => c.state === 'available')).map(d => d.date),
    [gridDays]
  );

  const priceForBilling = useMemo((): number => {
    if (!selectedSubSpace || !selectedBilling) return 0;
    return (
      {
        hour: selectedSubSpace.pricePerHour,
        day: selectedSubSpace.pricePerDay,
        week: selectedSubSpace.pricePerWeek,
        month: selectedSubSpace.pricePerMonth,
      }[selectedBilling] || 0
    );
  }, [selectedSubSpace, selectedBilling]);

  // Only hour billing uses the two-tap SlotGrid. day/week/month use the simple
  // date chips (start date + quantity) per the global constraint.
  const showGrid = selectedBilling === 'hour';

  const bookingDraft = useMemo<BookingDraft | null>(() => {
    if (!selectedSubSpace || !selectedStart || !selectedBilling) return null;
    const startDate = selectedStart.date;
    if (selectedBilling === 'hour') {
      const start = selectedStart.time;
      let quantityH = 1;
      if (selectedEnd) {
        const totalMin =
          dateDiffDays(startDate, selectedEnd.date) * 1440 +
          (timeToMinute(selectedEnd.time) - timeToMinute(start));
        quantityH = Math.max(1, Math.round(totalMin / 60));
      }
      // Respect the subspace's max duration (owner-configured hour cap), defaulting
      // to 8h like the store, while never exceeding the backend 31-max validation.
      const hourCap = Math.min(DURATION_MAX, selectedSubSpace.maxDuration || 8);
      const q = Math.min(hourCap, quantityH);
      return {
        date: startDate,
        startTime: start,
        endTime: minutesToTime(timeToMinute(start) + q * 60),
        quantity: q,
        endDate: startDate,
      };
    }
    const q = Math.max(1, Math.min(DURATION_MAX, quantity));
    return {
      date: startDate,
      startTime: '00:00',
      endTime: '23:59',
      quantity: q,
      endDate:
        selectedBilling === 'day'
          ? addDays(startDate, q)
          : selectedBilling === 'week'
            ? addDays(startDate, q * 7)
            : addMonths(startDate, q),
    };
  }, [selectedSubSpace, selectedStart, selectedEnd, selectedBilling, quantity]);

  const totalPrice = useMemo(() => {
    if (!bookingDraft) return 0;
    return Math.round(priceForBilling * bookingDraft.quantity * 100) / 100;
  }, [bookingDraft, priceForBilling]);

  const selectSubSpace = (sub: SubSpace) => {
    setSelectedSubId(sub.id);
    setSelectedBilling(sub.billingUnits[0] ?? 'hour');
    setQuantity(1);
    setSelectedStart(null);
    setSelectedEnd(null);
    setHint(null);
  };

  const selectBilling = (unit: BillingUnit) => {
    setSelectedBilling(unit);
    setQuantity(1);
    setSelectedStart(null);
    setSelectedEnd(null);
    setHint(null);
  };

  const handleSelectRange = (start: TimeRef, end: TimeRef | null) => {
    setSelectedStart(start);
    setSelectedEnd(end);
    setHint(null);
  };

  const handleSelectDate = (date: string) => {
    setSelectedStart({ date, time: '00:00' });
    setSelectedEnd(null);
    setHint(null);
  };

  const applySuggestion = (date: string, preferredTime: string) => {
    const cells = gridDays.find(d => d.date === date)?.cells ?? [];
    const suggested = suggestNextSlot(cells, preferredTime);
    if (!suggested) {
      setHint('No quedan horarios disponibles para ese día.');
      return;
    }
    if (selectedBilling === 'hour') {
      setSelectedStart({ date, time: suggested });
    } else {
      setSelectedStart({ date, time: '00:00' });
    }
    setSelectedEnd(null);
  };

  const handleSuggest = (date: string, suggestedTime: string, _original: string) => {
    setHint(`Sugerimos ${suggestedTime}, que está disponible. Tócalo para reservar.`);
    applySuggestion(date, suggestedTime);
  };

  const handleMonthChange = (monthFirst: string) => {
    setVisibleMonth(monthFirst);
    setSelectedStart(null);
    setSelectedEnd(null);
    setHint(null);
    loadDetail(monthFirst);
  };

  const finishInstant = async () => {
    if (!pendingPayment) return;
    try {
      await fetchGuestBookings();
    } catch { /* ignore cache refresh errors */ }
    if (bookingDraft && selectedSubSpace) {
      setDone({
        mode: 'instant',
        totalPrice: pendingPayment.totalPrice,
        date: bookingDraft.date,
        subspaceTitle: selectedSubSpace.title,
      });
    }
    setPendingPayment(null);
  };

  const handlePayStripe = async () => {
    if (!pendingPayment) return;
    setPaymentBusy('stripe');
    try {
      const data = await apiFetch<{ clientSecret?: string }>(
        `/api/spaces/pay/stripe/${pendingPayment.bookingId}`,
        { method: 'POST' }
      );
      if (!data?.clientSecret) {
        Alert.alert('Error', 'No se recibió el secreto de pago del servidor.');
        return;
      }
      const initResult = await initPaymentSheet({
        paymentIntentClientSecret: data.clientSecret,
        merchantDisplayName: 'Club Sincrónica',
      });
      if (initResult.error) {
        Alert.alert('Stripe', `Error iniciando el pago: ${initResult.error.message}`);
        return;
      }
      const presentResult = await presentPaymentSheet();
      if (presentResult.error) {
        if (presentResult.error.code !== 'Canceled') {
          Alert.alert('Stripe', presentResult.error.message);
        }
        return;
      }
      await finishInstant();
    } catch (e) {
      Alert.alert('Error', e instanceof ApiError ? e.message : 'No se pudo iniciar el pago.');
    } finally {
      setPaymentBusy(null);
    }
  };

  const handlePayMercadoPago = async () => {
    if (!pendingPayment) return;
    setPaymentBusy('mp');
    try {
      const data = await apiFetch<{ init_point?: string; sandbox_init_point?: string }>(
        `/api/spaces/pay/mercadopago/${pendingPayment.bookingId}`,
        {
          method: 'POST',
          body: {
            back_urls: {
              success: 'https://clubsincronica.app/payment-success',
              failure: 'https://clubsincronica.app/payment-failure',
              pending: 'https://clubsincronica.app/payment-pending',
            },
          },
        }
      );
      const url = __DEV__ ? (data.sandbox_init_point || data.init_point) : data.init_point;
      if (!url) {
        Alert.alert('Error', 'No se recibió el punto de pago de MercadoPago.');
        return;
      }
      const result = await WebBrowser.openBrowserAsync(url);
      // openBrowserAsync for a hosted redirect cannot report the payment outcome
      // itself (type is CANCEL/DISMISS/OPENED/LOCKED, not SUCCESS). MP is a true
      // redirect to back_urls we don't deep-link, so the source of truth is the
      // backend: the webhook flips the booking to confirmed/paid. Only show
      // success when the backend confirms it; otherwise keep the booking held.
      const wasCancelled =
        result.type === WebBrowser.WebBrowserResultType.CANCEL ||
        result.type === WebBrowser.WebBrowserResultType.DISMISS;
      const paid = await isBookingPaid(pendingPayment.bookingId);
      if (paid) {
        await finishInstant();
      } else {
        setPendingPayment(null);
        setPayNotice(
          wasCancelled
            ? 'El pago no se completó. Podrás pagar desde Mis reservas.'
            : 'No pudimos confirmar el pago. Podrás pagar desde Mis reservas.'
        );
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 402) {
        Alert.alert('MercadoPago', e.message);
      } else {
        Alert.alert('Error', e instanceof ApiError ? e.message : 'No se pudo iniciar el pago.');
      }
    } finally {
      setPaymentBusy(null);
    }
  };

  // Server-side verification of a payment outcome. The MP webhook lands in the
  // transactions table and, for space bookings, marks the booking confirmed/paid
  // (backend/src/models/transaction.ts updateTransactionStatus). The guest can
  // read that through GET /api/spaces/bookings/guest (no per-booking status is
  // exposed today), so a cancelled browser is only acknowledged when the backend
  // actually reports the booking as confirmed (which the webhook only sets
  // alongside paid for space bookings). On any failure we conservatively
  // report "not paid" (booking stays held, cancellable via Mis reservas).
  const isBookingPaid = async (bookingId: number): Promise<boolean> => {
    try {
      const rows = await fetchGuestBookings();
      const found = rows.find(b => b.id === String(bookingId));
      return !!found && found.status === 'confirmed';
    } catch {
      return false;
    }
  };

  const requireSelection = (): boolean => {
    if (!currentUser) {
      Alert.alert('Inicia sesión', 'Necesitas estar logueado para reservar.');
      return false;
    }
    if (!selectedSubSpace || !selectedStart || !selectedBilling || !bookingDraft) {
      Alert.alert('Faltan datos', 'Selecciona un sub-espacio, una fecha/horario y el tipo de facturación.');
      return false;
    }
    return true;
  };

  const handleBook = async () => {
    if (!requireSelection() || !bookingDraft || !selectedSubSpace) return;
    setSubmitting(true);
    try {
      const result = await createBooking({
        subspaceId: selectedSubSpace.id,
        date: bookingDraft.date,
        startTime: bookingDraft.startTime,
        endTime: bookingDraft.endTime,
        billingUnit: selectedBilling!,
        quantity: bookingDraft.quantity,
        notes: notes.trim() || undefined,
      });
      setShowBookingModal(false);
      if (result.mode === 'instant') {
        setPendingPayment({ bookingId: result.bookingId, totalPrice: result.totalPrice });
      } else {
        try {
          await fetchGuestBookings();
        } catch { /* ignore cache refresh errors */ }
        setDone({
          mode: 'request',
          totalPrice: result.totalPrice,
          date: bookingDraft.date,
          subspaceTitle: selectedSubSpace.title,
        });
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        Alert.alert('Ese horario ya no está disponible', 'Sugerimos el próximo horario libre.');
        applySuggestion(bookingDraft.date, bookingDraft.startTime);
        loadDetail(visibleMonth, true);
      } else {
        Alert.alert('Error', 'No se pudo completar la reserva. Inténtalo de nuevo.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const dateRangeLabel = bookingDraft
    ? bookingDraft.date === bookingDraft.endDate
      ? bookingDraft.date
      : `${bookingDraft.date} → ${bookingDraft.endDate}`
    : '';

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading && !space) {
    return (
      <ConstellationBackground intensity="light">
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.heroContainer}>
            <LinearGradient colors={['#2c6d85', '#4f8497']} style={styles.hero} />
            <TouchableOpacity style={[styles.backBtn, { top: 16 + insets.top }]} onPress={() => router.back()}>
              <ArrowLeft size={22} color={Colors.white} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.skeletonContent}>
            <SkeletonCard lines={2} />
            <SkeletonCard lines={1} />
            <SkeletonCard lines={3} />
          </ScrollView>
        </View>
      </ConstellationBackground>
    );
  }

  // ── Loading error (network/server) ──────────────────────────────────────
  if (loadError) {
    return (
      <ConstellationBackground intensity="light">
        <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }]}>
          <AlertCircle size={60} color={Colors.textLight} />
          <Text style={styles.notFoundTitle}>No se pudo cargar el espacio</Text>
          <Text style={styles.loadErrorSub}>
            Revisa tu conexión e inténtalo de nuevo.
          </Text>
          <TouchableOpacity onPress={() => loadDetail(visibleMonth)} style={styles.notFoundBtn}>
            <Text style={styles.notFoundBtnText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </ConstellationBackground>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (notFound || !space) {
    return (
      <ConstellationBackground intensity="light">
        <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
          <Building size={60} color={Colors.textLight} />
          <Text style={styles.notFoundTitle}>Espacio no encontrado</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.notFoundBtn}>
            <Text style={styles.notFoundBtnText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </ConstellationBackground>
    );
  }

  // ── Success screens ───────────────────────────────────────────────────────
  if (done) {
    const isInstant = done.mode === 'instant';
    return (
      <ConstellationBackground intensity="light">
        <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }]}>
          <LinearGradient colors={['#4f8497', '#9bdbbf']} style={styles.confirmIcon}>
            <CheckCircle size={48} color={Colors.white} />
          </LinearGradient>
          <Text style={styles.confirmTitle}>
            {isInstant ? '¡Reserva confirmada!' : 'Solicitud enviada'}
          </Text>
          <Text style={styles.confirmSub}>
            {isInstant
              ? `Tu reserva en ${done.subspaceTitle} está confirmada para el ${done.date} con el pago ya realizado.`
              : `Tu solicitud en ${done.subspaceTitle} para el ${done.date} fue enviada.`}
          </Text>
          {!isInstant && (
            <View style={styles.requestNote}>
              <AlertCircle size={16} color={Colors.primary} />
              <Text style={styles.requestNoteText}>
                Sin cargo todavía: el anfitrión confirmará tu reserva en las próximas 48 horas.
              </Text>
            </View>
          )}
          <Text style={styles.confirmPrice}>Total: ${done.totalPrice.toLocaleString()}</Text>
          <TouchableOpacity style={styles.confirmBtn} onPress={() => router.back()}>
            <Text style={styles.confirmBtnText}>Listo</Text>
          </TouchableOpacity>
        </View>
      </ConstellationBackground>
    );
  }

  const canBook = !!bookingDraft && selectedStart !== null;

  return (
    <ConstellationBackground intensity="light">
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
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
        {payNotice && (
          <View style={styles.payNoticeBanner}>
            <Info size={16} color={Colors.textLight} />
            <Text style={styles.payNoticeText}>{payNotice}</Text>
            <TouchableOpacity onPress={() => setPayNotice(null)} accessibilityRole="button" accessibilityLabel="Ocultar aviso">
              <Text style={styles.hintClose}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
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

        {/* Sub-space selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Elige un espacio para reservar</Text>
          <Text style={styles.sectionSub}>Selecciona el ambiente que mejor se adapte a tus necesidades</Text>
          {activeSubs.length === 0 && (
            <Text style={styles.emptyText}>No hay ambientes disponibles en este espacio.</Text>
          )}
          {activeSubs.map(sub => (
            <SubSpaceCard
              key={sub.id}
              sub={sub}
              isSelected={selectedSubSpace?.id === sub.id}
              onSelect={() => selectSubSpace(sub)}
            />
          ))}
        </View>

        {/* Billing selector */}
        {selectedSubSpace && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>¿Cómo quieres reservar?</Text>
            <View style={styles.billingRow}>
              {selectedSubSpace.billingUnits.map(unit => {
                const price =
                  {
                    hour: selectedSubSpace.pricePerHour,
                    day: selectedSubSpace.pricePerDay,
                    week: selectedSubSpace.pricePerWeek,
                    month: selectedSubSpace.pricePerMonth,
                  }[unit] || 0;
                return (
                  <TouchableOpacity
                    key={unit}
                    style={[styles.billingChip, selectedBilling === unit && styles.billingChipActive]}
                    onPress={() => selectBilling(unit)}
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

            {/* Quantity (day/week/month via chips; hour duration derives from the grid) */}
            {!showGrid && (
              <View style={styles.quantityRow}>
                <Text style={styles.quantityLabel}>
                  Cantidad de {selectedBilling ? BILLING_LABELS[selectedBilling].plural : ''}:
                </Text>
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
            )}
          </View>
        )}

        {/* Availability */}
        {selectedSubSpace && selectedBilling && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Disponibilidad</Text>
            <Text style={styles.sectionSub}>
              {showGrid
                ? 'Toca un horario disponible para comenzar y otro para terminar.'
                : 'Elige la fecha de inicio.'}
            </Text>

            {hint && (
              <View style={styles.hintBanner}>
                <Info size={16} color={Colors.success} />
                <Text style={styles.hintText}>{hint}</Text>
                <TouchableOpacity onPress={() => setHint(null)} accessibilityRole="button" accessibilityLabel="Ocultar sugerencia">
                  <Text style={styles.hintClose}>✕</Text>
                </TouchableOpacity>
              </View>
            )}

            {showGrid ? (
              <SlotGrid
                days={gridDays}
                selectedStart={selectedStart}
                selectedEnd={selectedEnd}
                onSelectRange={handleSelectRange}
                onSuggest={handleSuggest}
                onMonthChange={handleMonthChange}
              />
            ) : (
              <>
                {availableDates.length === 0 ? (
                  <Text style={styles.emptyText}>Sin fechas disponibles.</Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateChipsRow}>
                    {availableDates.map(date => {
                      const isSel = selectedStart?.date === date;
                      return (
                        <TouchableOpacity
                          key={date}
                          style={[styles.dateChip, isSel && styles.dateChipActive]}
                          onPress={() => handleSelectDate(date)}
                          accessibilityRole="button"
                          accessibilityLabel={`Elegir fecha ${date}`}
                        >
                          <Calendar size={14} color={isSel ? Colors.white : Colors.primary} />
                          <Text style={[styles.dateChipText, isSel && styles.dateChipTextActive]}>{date}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}

                {selectedStart && selectedBilling && bookingDraft && (
                  <View style={styles.selectedDateBadge}>
                    <Clock size={14} color={Colors.primary} />
                    <Text style={styles.selectedDateText}>
                      Inicio {bookingDraft.date} · {bookingDraft.quantity}{' '}
                      {BILLING_LABELS[selectedBilling].plural} hasta {bookingDraft.endDate}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* Sticky price summary + CTA */}
      {canBook && (
        <View style={[styles.bookingFooter, { paddingBottom: 12 + insets.bottom }]}>
          <View style={styles.footerLeft}>
            <Text style={styles.totalLabel}>Total estimado</Text>
            <Text style={styles.totalPrice}>${totalPrice.toLocaleString()}</Text>
            <Text style={styles.totalSub}>
              {bookingDraft!.quantity} {selectedBilling ? BILLING_LABELS[selectedBilling].plural : ''} ·{' '}
              {selectedSubSpace?.title}
            </Text>
          </View>
          <TouchableScale style={styles.bookBtn} onPress={() => setShowBookingModal(true)}>
            <Text style={styles.bookBtnText}>Reservar ahora</Text>
          </TouchableScale>
        </View>
      )}

      {/* Booking Confirmation Modal */}
      <Modal visible={showBookingModal} animationType="slide" transparent onRequestClose={() => setShowBookingModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: 28 + insets.bottom }]}>
            <Text style={styles.modalTitle}>Confirmar Reserva</Text>
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Espacio:</Text>
              <Text style={styles.modalValue}>{selectedSubSpace?.title}</Text>
            </View>
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Fecha:</Text>
              <Text style={styles.modalValue}>{dateRangeLabel}</Text>
            </View>
            {selectedBilling === 'hour' && bookingDraft && (
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Horario:</Text>
                <Text style={styles.modalValue}>{bookingDraft.startTime} – {bookingDraft.endTime}</Text>
              </View>
            )}
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Duración:</Text>
              <Text style={styles.modalValue}>
                {bookingDraft?.quantity} {selectedBilling ? BILLING_LABELS[selectedBilling].plural : ''}
              </Text>
            </View>
            {isInstantBook && (
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Modalidad:</Text>
                <Text style={[styles.modalValue, { color: Colors.success }]}>Instantáneo (pago inmediato)</Text>
              </View>
            )}
            <View style={[styles.modalRow, styles.modalTotalRow]}>
              <Text style={[styles.modalLabel, styles.modalTotalLabel]}>Total:</Text>
              <Text style={[styles.modalValue, styles.modalTotalValue]}>${totalPrice.toLocaleString()}</Text>
            </View>
            {selectedSubSpace?.cancellationPolicy ? (
              <View style={styles.cancelPolicyBox}>
                <ShieldIcon size={14} color={Colors.textLight} />
                <Text style={styles.cancelPolicyText}>{selectedSubSpace.cancellationPolicy}</Text>
              </View>
            ) : null}
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
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowBookingModal(false)} disabled={submitting}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableScale style={[styles.modalConfirmBtn, submitting && { opacity: 0.7 }]} onPress={handleBook} disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.modalConfirmText}>Confirmar</Text>
                )}
              </TouchableScale>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment handoff modal (instant bookings) */}
      <Modal
        visible={!!pendingPayment}
        animationType="slide"
        transparent
        onRequestClose={() => {
          if (!paymentBusy) setPendingPayment(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: 28 + insets.bottom }]}>
            <Text style={styles.modalTitle}>Completa el pago</Text>
            <View style={styles.payAmountRow}>
              <Text style={styles.payAmountLabel}>Total a pagar</Text>
              <Text style={styles.payAmountValue}>${pendingPayment?.totalPrice.toLocaleString()}</Text>
            </View>
            <TouchableScale
              style={[styles.payStripeBtn, paymentBusy === 'stripe' && styles.payBtnBusy]}
              onPress={handlePayStripe}
              disabled={!!paymentBusy}
            >
              {paymentBusy === 'stripe' ? (
                <ActivityIndicator color={Colors.text} />
              ) : (
                <>
                  <CreditCard size={20} color={Colors.text} />
                  <Text style={styles.payStripeText}>Pagar con Stripe</Text>
                </>
              )}
            </TouchableScale>
            <TouchableScale
              style={[styles.payMpBtn, paymentBusy === 'mp' && styles.payBtnBusy]}
              onPress={handlePayMercadoPago}
              disabled={!!paymentBusy}
            >
              {paymentBusy === 'mp' ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Text style={styles.payMpLogo}>MP</Text>
                  <Text style={styles.payMpText}>Pagar con MercadoPago</Text>
                </>
              )}
            </TouchableScale>
            <TouchableOpacity
              style={styles.payCancel}
              onPress={() => setPendingPayment(null)}
              disabled={!!paymentBusy}
            >
              <Lock size={13} color={Colors.textLight} />
              <Text style={styles.payCancelText}>Pago seguro. Podrás pagar después desde tus reservas.</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ConstellationBackground>
  );
}

function ShieldIcon(props: { size?: number; color?: string }) {
  return <View style={[styles.shieldDot, { backgroundColor: (props.color || Colors.textLight) + '22' }]}><Text style={[styles.shieldText, { color: props.color || Colors.textLight }]}>i</Text></View>;
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
      {sub.instantBook && (
        <View style={subCard.instantTag}>
          <Text style={subCard.instantTagText}>Instantáneo ✓</Text>
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

export default function CoWorkDetailScreen() {
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <CoWorkDetailInner />
    </StripeProvider>
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
  emptyText: { fontSize: 13, color: Colors.textLight, marginVertical: 8 },
  skeletonContent: { padding: 16, gap: 12 },
  notFoundTitle: { fontSize: 16, color: Colors.text, marginTop: 12 },
  loadErrorSub: { fontSize: 13, color: Colors.textLight, marginTop: 6, textAlign: 'center' },
  notFoundBtn: { marginTop: 20, padding: 12, backgroundColor: Colors.primary, borderRadius: 12 },
  notFoundBtnText: { color: Colors.white, fontWeight: '700' },
  payNoticeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.textLight + '12', borderRadius: 12,
    padding: 12, marginHorizontal: 16, marginTop: 14,
  },
  payNoticeText: { flex: 1, fontSize: 13, color: Colors.textLight, fontWeight: '600', lineHeight: 18 },
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
  hintBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.success + '15', borderRadius: 12, padding: 12, marginBottom: 12,
  },
  hintText: { flex: 1, fontSize: 13, color: Colors.success, fontWeight: '600' },
  hintClose: { fontSize: 14, color: Colors.success, fontWeight: '800', paddingHorizontal: 6 },
  dateChipsRow: { gap: 8, paddingVertical: 4 },
  dateChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 9, backgroundColor: Colors.white,
  },
  dateChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dateChipText: { fontSize: 13, fontWeight: '700', color: Colors.text },
  dateChipTextActive: { color: Colors.white },
  selectedDateBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 12, backgroundColor: Colors.primary + '15',
    borderRadius: 12, padding: 12,
  },
  selectedDateText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  bookingFooter: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 14,
    backgroundColor: Colors.white,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 8,
    borderTopWidth: 1, borderTopColor: Colors.border + '40',
  },
  footerLeft: { flex: 1, paddingRight: 12 },
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
    padding: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 20 },
  modalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalLabel: { fontSize: 14, color: Colors.textLight, fontWeight: '600' },
  modalValue: { fontSize: 14, color: Colors.text, fontWeight: '700' },
  modalTotalRow: { borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 8, paddingTop: 12 },
  modalTotalLabel: { fontWeight: '800', fontSize: 16 },
  modalTotalValue: { fontWeight: '800', fontSize: 18, color: Colors.primary },
  cancelPolicyBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.background, borderRadius: 10, padding: 10, marginTop: 4,
  },
  cancelPolicyText: { flex: 1, fontSize: 12, color: Colors.textLight, lineHeight: 17 },
  shieldDot: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  shieldText: { fontSize: 11, fontWeight: '800' },
  notesInput: {
    marginTop: 12, borderWidth: 1, borderColor: Colors.border, borderRadius: 12,
    padding: 12, fontSize: 14, color: Colors.text, minHeight: 70, textAlignVertical: 'top',
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: Colors.background, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  modalCancelText: { fontSize: 15, fontWeight: '700', color: Colors.textLight },
  modalConfirmBtn: { flex: 1.5, paddingVertical: 14, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center' },
  modalConfirmText: { fontSize: 15, fontWeight: '800', color: Colors.white },
  payAmountRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.background, borderRadius: 12, padding: 16, marginBottom: 16,
  },
  payAmountLabel: { fontSize: 14, color: Colors.textLight, fontWeight: '600' },
  payAmountValue: { fontSize: 22, fontWeight: '900', color: Colors.text },
  payStripeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.gold, borderRadius: 14, paddingVertical: 15, marginBottom: 12,
  },
  payMpBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#009EE3', borderRadius: 14, paddingVertical: 15, marginBottom: 12,
  },
  payBtnBusy: { opacity: 0.7 },
  payStripeText: { fontSize: 15, fontWeight: '800', color: Colors.text },
  payMpLogo: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.white,
    textAlign: 'center', lineHeight: 20, fontSize: 10, fontWeight: '800', color: '#009EE3', overflow: 'hidden',
  },
  payMpText: { fontSize: 15, fontWeight: '800', color: Colors.white },
  payCancel: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  payCancelText: { fontSize: 12, color: Colors.textLight },
  confirmIcon: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  confirmTitle: { fontSize: 24, fontWeight: '900', color: Colors.text, marginBottom: 12, textAlign: 'center' },
  confirmSub: { fontSize: 14, color: Colors.textLight, textAlign: 'center', lineHeight: 21, marginBottom: 8 },
  requestNote: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primary + '12', borderRadius: 12, padding: 12, marginTop: 8,
  },
  requestNoteText: { flex: 1, fontSize: 13, color: Colors.primary, fontWeight: '600', lineHeight: 18 },
  confirmPrice: { fontSize: 22, fontWeight: '800', color: Colors.primary, marginTop: 8 },
  confirmBtn: { marginTop: 28, backgroundColor: Colors.primary, borderRadius: 16, paddingHorizontal: 40, paddingVertical: 14 },
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
  instantTag: {
    position: 'absolute', top: 10, left: 10, zIndex: 5,
    backgroundColor: Colors.success, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  instantTagText: { fontSize: 10, fontWeight: '800', color: Colors.white },
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