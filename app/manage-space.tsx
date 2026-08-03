import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Modal, Dimensions, FlatList
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
  ArrowLeft, Building, Plus, Layers, DollarSign, Calendar,
  ChevronRight, Users, MapPin, Edit3, Trash2, Key, Eye2,
  Clock, Star, PlusCircle, Check, CheckCircle
} from '@/components/SmartIcons';
import { SubSpace, CoWorkSpace, SpaceBooking } from '@/types/user';

const { width } = Dimensions.get('window');

const TYPE_ICONS: Record<string, string> = {
  'streaming-set': '🎬', 'recording-booth': '🎧', 'office': '💼',
  'studio': '🎨', 'meeting-room': '📋', 'event-space': '🎉',
  'coworking-desk': '💻', 'other': '🏠',
};
const BILLING_LABELS: Record<string, string> = { hour: '/hr', day: '/día', week: '/sem', month: '/mes' };

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function ManageSpaceScreen() {
  const insets = useSafeAreaInsets();
  const { spaceId } = useLocalSearchParams<{ spaceId: string }>();
  const { currentUser } = useUser();
  const { getSpaceById, getBookingsForSpace, deleteSubSpace, updateSubSpace, loadData } = useCoWork();
  const [activeTab, setActiveTab] = useState<'overview' | 'calendar' | 'bookings'>('overview');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [filterSubSpace, setFilterSubSpace] = useState<string>('all');

  useEffect(() => { loadData(); }, []);

  const space = useMemo(() => getSpaceById(spaceId || ''), [spaceId, getSpaceById]);
  const bookings = useMemo(() => getBookingsForSpace(spaceId || ''), [spaceId, getBookingsForSpace]);

  const calendarBookings = useMemo(() => {
    if (filterSubSpace === 'all') return bookings;
    return bookings.filter(b => b.subSpaceId === filterSubSpace);
  }, [bookings, filterSubSpace]);

  if (!space) {
    return (
      <ConstellationBackground intensity="light">
        <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
          <Building size={60} color={Colors.textLight} />
          <Text style={styles.notFoundText}>Espacio no encontrado</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backLinkBtn}>
            <Text style={styles.backLinkText}>← Volver a Mis Espacios</Text>
          </TouchableOpacity>
        </View>
      </ConstellationBackground>
    );
  }

  const handleDeleteSubSpace = (sub: SubSpace) => {
    Alert.alert('Eliminar Sub-espacio', `¿Eliminar "${sub.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: () => deleteSubSpace(space.id, sub.id),
      },
    ]);
  };

  const handleToggleSubSpace = (sub: SubSpace) => {
    updateSubSpace(space.id, sub.id, { isActive: !sub.isActive });
  };

  // Calendar helpers
  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const getBookingsForDate = (day: number) => {
    const dateStr = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return calendarBookings.filter(b => b.date === dateStr);
  };

  const totalEarnings = bookings
    .filter(b => b.status !== 'cancelled')
    .reduce((s, b) => s + b.totalPrice, 0);

  return (
    <ConstellationBackground intensity="light">
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <LinearGradient
          colors={['#2c6d85', '#4f8497']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <ArrowLeft size={22} color={Colors.white} />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.headerTitle} numberOfLines={1}>{space.title}</Text>
              <View style={styles.locationRow}>
                <MapPin size={11} color="rgba(255,255,255,0.8)" />
                <Text style={styles.locationText} numberOfLines={1}>{space.location}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => router.push({ pathname: '/add-space', params: { spaceId: space.id, editMode: 'true' } })}
            >
              <Edit3 size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.headerStats}>
            <StatChip icon="🏢" label={`${space.subSpaces.length} Sub-espacios`} />
            <StatChip icon="📅" label={`${bookings.filter(b => b.status !== 'cancelled').length} Reservas`} />
            <StatChip icon="💰" label={`$${totalEarnings.toLocaleString()}`} />
            <StatChip icon={space.isPublished ? '🟢' : '⚪'} label={space.isPublished ? 'Publicado' : 'Borrador'} />
          </View>
        </LinearGradient>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['overview', 'calendar', 'bookings'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'overview' ? '🏠 Sub-espacios' : tab === 'calendar' ? '📅 Calendario' : '📋 Reservas'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'overview' && (
            <SubSpacesTab
              space={space}
              onAdd={() => router.push({ pathname: '/add-subspace', params: { spaceId: space.id } })}
              onEdit={(sub) => router.push({ pathname: '/add-subspace', params: { spaceId: space.id, subSpaceId: sub.id, editMode: 'true' } })}
              onDelete={handleDeleteSubSpace}
              onToggle={handleToggleSubSpace}
            />
          )}
          {activeTab === 'calendar' && (
            <CalendarTab
              space={space}
              bookings={calendarBookings}
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
              filterSubSpace={filterSubSpace}
              onFilterChange={setFilterSubSpace}
              getBookingsForDate={getBookingsForDate}
              daysInMonth={daysInMonth}
              firstDayOfMonth={firstDayOfMonth}
            />
          )}
          {activeTab === 'bookings' && (
            <BookingsTab bookings={bookings} space={space} />
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    </ConstellationBackground>
  );
}

// ─── Sub-spaces Tab ────────────────────────────────────────────────────────────

function SubSpacesTab({ space, onAdd, onEdit, onDelete, onToggle }: {
  space: CoWorkSpace;
  onAdd: () => void;
  onEdit: (sub: SubSpace) => void;
  onDelete: (sub: SubSpace) => void;
  onToggle: (sub: SubSpace) => void;
}) {
  const floorGroups = useMemo(() => {
    const groups: Record<string, SubSpace[]> = {};
    space.subSpaces.forEach(sub => {
      const floor = sub.floorLabel || 'Sin piso';
      if (!groups[floor]) groups[floor] = [];
      groups[floor].push(sub);
    });
    return groups;
  }, [space.subSpaces]);

  return (
    <View style={tabStyles.container}>
      <TouchableScale style={tabStyles.addSubBtn} onPress={onAdd}>
        <PlusCircle size={18} color={Colors.primary} />
        <Text style={tabStyles.addSubBtnText}>Agregar Sub-espacio</Text>
      </TouchableScale>

      {space.subSpaces.length === 0 ? (
        <View style={tabStyles.empty}>
          <Layers size={56} color={Colors.border} />
          <Text style={tabStyles.emptyTitle}>Sin sub-espacios</Text>
          <Text style={tabStyles.emptySub}>Crea sub-espacios para poder arrendar partes individuales de tu propiedad.</Text>
        </View>
      ) : (
        Object.entries(floorGroups).map(([floor, subs]) => (
          <View key={floor} style={tabStyles.floorGroup}>
            <View style={tabStyles.floorHeader}>
              <Text style={tabStyles.floorLabel}>🏢 {floor}</Text>
            </View>
            {subs.map(sub => (
              <SubSpaceItem key={sub.id} sub={sub} onEdit={onEdit} onDelete={onDelete} onToggle={onToggle} />
            ))}
          </View>
        ))
      )}
    </View>
  );
}

function SubSpaceItem({ sub, onEdit, onDelete, onToggle }: {
  sub: SubSpace;
  onEdit: (sub: SubSpace) => void;
  onDelete: (sub: SubSpace) => void;
  onToggle: (sub: SubSpace) => void;
}) {
  const lowestPrice = useMemo(() => {
    const prices = [sub.pricePerHour, sub.pricePerDay, sub.pricePerWeek, sub.pricePerMonth].filter(Boolean) as number[];
    return prices.length > 0 ? Math.min(...prices) : 0;
  }, [sub]);

  const lowestUnit = useMemo(() => {
    if (sub.pricePerHour) return '/hr';
    if (sub.pricePerDay) return '/día';
    if (sub.pricePerWeek) return '/sem';
    return '/mes';
  }, [sub]);

  return (
    <View style={[subItemStyles.card, !sub.isActive && { opacity: 0.6 }]}>
      <View style={[subItemStyles.colorBar, { backgroundColor: sub.color || Colors.primary }]} />
      <View style={{ flex: 1, paddingLeft: 12 }}>
        <View style={subItemStyles.titleRow}>
          <Text style={subItemStyles.typeEmoji}>{TYPE_ICONS[sub.type] || '🏠'}</Text>
          <Text style={subItemStyles.title} numberOfLines={1}>{sub.title}</Text>
          <View style={[subItemStyles.activeBadge, { backgroundColor: sub.isActive ? Colors.success + '20' : Colors.border }]}>
            <Text style={[subItemStyles.activeBadgeText, { color: sub.isActive ? Colors.success : Colors.textLight }]}>
              {sub.isActive ? 'Activo' : 'Inactivo'}
            </Text>
          </View>
        </View>
        <Text style={subItemStyles.description} numberOfLines={2}>{sub.description}</Text>
        <View style={subItemStyles.metaRow}>
          <View style={subItemStyles.metaItem}>
            <Users size={11} color={Colors.textLight} />
            <Text style={subItemStyles.metaText}>{sub.capacity} personas</Text>
          </View>
          <View style={subItemStyles.metaItem}>
            <DollarSign size={11} color={Colors.primary} />
            <Text style={[subItemStyles.metaText, { color: Colors.primary, fontWeight: '700' }]}>
              ${lowestPrice.toLocaleString()}{lowestUnit}
            </Text>
          </View>
          {sub.billingUnits.length > 1 && (
            <Text style={subItemStyles.billingUnits}>
              ({sub.billingUnits.map(u => BILLING_LABELS[u]).join(' · ')})
            </Text>
          )}
        </View>
        {sub.features.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }} contentContainerStyle={{ gap: 4 }}>
            {sub.features.slice(0, 4).map(f => (
              <View key={f} style={subItemStyles.featureTag}>
                <Text style={subItemStyles.featureText}>{f}</Text>
              </View>
            ))}
          </ScrollView>
        )}
        <View style={subItemStyles.actionsRow}>
          <TouchableOpacity style={subItemStyles.actionBtn} onPress={() => onToggle(sub)}>
            <Text style={[subItemStyles.actionBtnText, { color: sub.isActive ? Colors.warning : Colors.success }]}>
              {sub.isActive ? 'Desactivar' : 'Activar'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={subItemStyles.actionBtn} onPress={() => onEdit(sub)}>
            <Edit3 size={13} color={Colors.primary} />
            <Text style={[subItemStyles.actionBtnText, { color: Colors.primary }]}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={subItemStyles.actionBtn} onPress={() => onDelete(sub)}>
            <Trash2 size={13} color={Colors.error} />
            <Text style={[subItemStyles.actionBtnText, { color: Colors.error }]}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Calendar Tab ──────────────────────────────────────────────────────────────

function CalendarTab({ space, bookings, selectedMonth, onMonthChange, filterSubSpace, onFilterChange, getBookingsForDate, daysInMonth, firstDayOfMonth }: any) {
  const days = daysInMonth(selectedMonth);
  const firstDay = firstDayOfMonth(selectedMonth);
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const selectedBookings = selectedDay ? getBookingsForDate(selectedDay) : [];

  return (
    <View style={calStyles.container}>
      {/* Filter by sub-space */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={calStyles.filterScroll} contentContainerStyle={calStyles.filterContent}>
        <TouchableOpacity
          style={[calStyles.filterChip, filterSubSpace === 'all' && calStyles.filterChipActive]}
          onPress={() => onFilterChange('all')}
        >
          <Text style={[calStyles.filterChipText, filterSubSpace === 'all' && calStyles.filterChipTextActive]}>Todos</Text>
        </TouchableOpacity>
        {space.subSpaces.map((sub: SubSpace) => (
          <TouchableOpacity
            key={sub.id}
            style={[calStyles.filterChip, filterSubSpace === sub.id && calStyles.filterChipActive, { borderColor: sub.color || Colors.primary }]}
            onPress={() => onFilterChange(sub.id)}
          >
            <View style={[calStyles.filterDot, { backgroundColor: sub.color || Colors.primary }]} />
            <Text style={[calStyles.filterChipText, filterSubSpace === sub.id && calStyles.filterChipTextActive]} numberOfLines={1}>
              {sub.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Month navigation */}
      <View style={calStyles.monthNav}>
        <TouchableOpacity onPress={() => { const d = new Date(selectedMonth); d.setMonth(d.getMonth() - 1); onMonthChange(d); }}>
          <Text style={calStyles.navArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={calStyles.monthTitle}>{MONTHS[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}</Text>
        <TouchableOpacity onPress={() => { const d = new Date(selectedMonth); d.setMonth(d.getMonth() + 1); onMonthChange(d); }}>
          <Text style={calStyles.navArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Weekday headers */}
      <View style={calStyles.weekHeaders}>
        {WEEKDAYS.map(d => <Text key={d} style={calStyles.weekHeader}>{d}</Text>)}
      </View>

      {/* Calendar grid */}
      <View style={calStyles.grid}>
        {cells.map((day, idx) => {
          if (!day) return <View key={`empty-${idx}`} style={calStyles.cell} />;
          const dayBookings = getBookingsForDate(day);
          const isSelected = selectedDay === day;
          const isToday = day === new Date().getDate() &&
            selectedMonth.getMonth() === new Date().getMonth() &&
            selectedMonth.getFullYear() === new Date().getFullYear();
          return (
            <TouchableOpacity
              key={day}
              style={[calStyles.cell, isSelected && calStyles.cellSelected, isToday && !isSelected && calStyles.cellToday]}
              onPress={() => setSelectedDay(isSelected ? null : day)}
            >
              <Text style={[calStyles.cellDay, isSelected && calStyles.cellDaySelected, isToday && !isSelected && calStyles.cellDayToday]}>
                {day}
              </Text>
              {dayBookings.length > 0 && (
                <View style={calStyles.dotContainer}>
                  {dayBookings.slice(0, 3).map((b: SpaceBooking, i: number) => {
                    const sub = space.subSpaces.find((s: SubSpace) => s.id === b.subSpaceId);
                    return <View key={i} style={[calStyles.dot, { backgroundColor: sub?.color || Colors.primary }]} />;
                  })}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected day bookings */}
      {selectedDay && (
        <View style={calStyles.dayDetail}>
          <Text style={calStyles.dayDetailTitle}>
            {WEEKDAYS[new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), selectedDay).getDay()]} {selectedDay} de {MONTHS[selectedMonth.getMonth()]}
          </Text>
          {selectedBookings.length === 0 ? (
            <Text style={calStyles.noBookings}>Sin reservas para este día</Text>
          ) : (
            selectedBookings.map((b: SpaceBooking) => {
              const sub = space.subSpaces.find((s: SubSpace) => s.id === b.subSpaceId);
              return (
                <View key={b.id} style={[calStyles.bookingItem, { borderLeftColor: sub?.color || Colors.primary }]}>
                  <View style={[calStyles.bookingColorBar, { backgroundColor: sub?.color || Colors.primary }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={calStyles.bookingSubTitle} numberOfLines={1}>{sub?.title || 'Sub-espacio'}</Text>
                    <Text style={calStyles.bookingTime}>{b.startTime} – {b.endTime}</Text>
                    <Text style={calStyles.bookingPrice}>${b.totalPrice.toLocaleString()} · {b.status}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}
    </View>
  );
}

// ─── Bookings Tab ──────────────────────────────────────────────────────────────

function BookingsTab({ bookings, space }: { bookings: SpaceBooking[]; space: CoWorkSpace }) {
  const sorted = [...bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <View style={{ padding: 16 }}>
      {sorted.length === 0 ? (
        <View style={tabStyles.empty}>
          <Calendar size={56} color={Colors.border} />
          <Text style={tabStyles.emptyTitle}>Sin reservas aún</Text>
          <Text style={tabStyles.emptySub}>Las reservas de tus sub-espacios aparecerán aquí.</Text>
        </View>
      ) : (
        sorted.map(b => {
          const sub = space.subSpaces.find(s => s.id === b.subSpaceId);
          return (
            <View key={b.id} style={bookingStyles.card}>
              <View style={[bookingStyles.colorBar, { backgroundColor: sub?.color || Colors.primary }]} />
              <View style={{ flex: 1, paddingLeft: 10 }}>
                <Text style={bookingStyles.subName} numberOfLines={1}>{sub?.title || 'Sub-espacio'}</Text>
                <Text style={bookingStyles.date}>{b.date} · {b.startTime} – {b.endTime}</Text>
                <View style={bookingStyles.row}>
                  <Text style={bookingStyles.price}>${b.totalPrice.toLocaleString()}</Text>
                  <View style={[bookingStyles.badge, { backgroundColor: b.status === 'confirmed' ? Colors.success + '20' : Colors.border }]}>
                    <Text style={[bookingStyles.badgeText, { color: b.status === 'confirmed' ? Colors.success : Colors.textLight }]}>
                      {b.status === 'confirmed' ? 'Confirmada' : b.status === 'pending' ? 'Pendiente' : 'Cancelada'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

// ─── Helper component ──────────────────────────────────────────────────────────
function StatChip({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.statChip}>
      <Text style={styles.statChipText}>{icon} {label}</Text>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { padding: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', marginRight: 2 },
  editBtn: { padding: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.white },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  locationText: { fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  headerStats: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 8 },
  statChip: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  statChipText: { fontSize: 12, color: Colors.white, fontWeight: '600' },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '60',
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 12, color: Colors.textLight, fontWeight: '600' },
  tabTextActive: { color: Colors.primary },
  content: { flex: 1, backgroundColor: Colors.background },
  notFoundText: { fontSize: 18, fontWeight: '700', color: Colors.text, marginTop: 16 },
  backLinkBtn: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: Colors.primary, borderRadius: 12 },
  backLinkText: { color: Colors.white, fontWeight: '600' },
});

const tabStyles = StyleSheet.create({
  container: { padding: 16 },
  addSubBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: Colors.primary + '15', borderRadius: 14,
    paddingVertical: 12, marginBottom: 20,
    borderWidth: 1.5, borderColor: Colors.primary + '40', borderStyle: 'dashed',
  },
  addSubBtnText: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, marginTop: 12 },
  emptySub: { fontSize: 13, color: Colors.textLight, textAlign: 'center', marginTop: 6, lineHeight: 18 },
  floorGroup: { marginBottom: 20 },
  floorHeader: { marginBottom: 8, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: Colors.border + '60' },
  floorLabel: { fontSize: 13, fontWeight: '700', color: Colors.textLight, textTransform: 'uppercase', letterSpacing: 0.5 },
});

const subItemStyles = StyleSheet.create({
  card: {
    flexDirection: 'row', backgroundColor: Colors.white, borderRadius: 16,
    marginBottom: 12, overflow: 'hidden',
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  colorBar: { width: 5 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, marginTop: 12 },
  typeEmoji: { fontSize: 16, marginRight: 6 },
  title: { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.text },
  activeBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 6, marginRight: 6, marginTop: 2 },
  activeBadgeText: { fontSize: 10, fontWeight: '700' },
  description: { fontSize: 12, color: Colors.textLight, lineHeight: 17, marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: Colors.textLight },
  billingUnits: { fontSize: 11, color: Colors.textSecondary },
  featureTag: { backgroundColor: Colors.primary + '15', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  featureText: { fontSize: 10, color: Colors.primary, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: Colors.background },
  actionBtnText: { fontSize: 11, fontWeight: '600' },
});

const calStyles = StyleSheet.create({
  container: { padding: 16 },
  filterScroll: { marginBottom: 16 },
  filterContent: { gap: 8, paddingBottom: 4 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.white, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { fontSize: 12, color: Colors.textLight, fontWeight: '600', maxWidth: 100 },
  filterChipTextActive: { color: Colors.white },
  filterDot: { width: 8, height: 8, borderRadius: 4 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  navArrow: { fontSize: 28, color: Colors.primary, fontWeight: '300', paddingHorizontal: 8 },
  monthTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  weekHeaders: { flexDirection: 'row', marginBottom: 6 },
  weekHeader: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: Colors.textLight },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: (width - 32) / 7, height: 50, alignItems: 'center', justifyContent: 'center' },
  cellSelected: { backgroundColor: Colors.primary, borderRadius: 12 },
  cellToday: { borderWidth: 2, borderColor: Colors.primary, borderRadius: 12 },
  cellDay: { fontSize: 14, color: Colors.text, fontWeight: '500' },
  cellDaySelected: { color: Colors.white, fontWeight: '800' },
  cellDayToday: { color: Colors.primary, fontWeight: '800' },
  dotContainer: { flexDirection: 'row', gap: 2, marginTop: 2 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  dayDetail: { marginTop: 16, backgroundColor: Colors.white, borderRadius: 16, padding: 16, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  dayDetailTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  noBookings: { fontSize: 13, color: Colors.textLight, textAlign: 'center', paddingVertical: 12 },
  bookingItem: { flexDirection: 'row', borderRadius: 10, overflow: 'hidden', marginBottom: 8, backgroundColor: Colors.background },
  bookingColorBar: { width: 4, borderRadius: 2 },
  bookingSubTitle: { fontSize: 13, fontWeight: '700', color: Colors.text, paddingLeft: 10, paddingTop: 8 },
  bookingTime: { fontSize: 12, color: Colors.textLight, paddingLeft: 10, marginTop: 2 },
  bookingPrice: { fontSize: 12, color: Colors.primary, paddingLeft: 10, paddingBottom: 8, fontWeight: '600' },
});

const bookingStyles = StyleSheet.create({
  card: {
    flexDirection: 'row', backgroundColor: Colors.white, borderRadius: 14,
    marginBottom: 10, overflow: 'hidden',
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 5, elevation: 2,
    paddingVertical: 12,
  },
  colorBar: { width: 4, marginLeft: 12, marginRight: 0, borderRadius: 2 },
  subName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  date: { fontSize: 12, color: Colors.textLight, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  price: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
});
