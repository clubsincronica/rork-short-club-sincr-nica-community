import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, RefreshControl, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useCoWork } from '@/hooks/cowork-store';
import { useUser } from '@/hooks/user-store';
import { Colors } from '@/constants/colors';
import { ConstellationBackground } from '@/components/ConstellationBackground';
import { TouchableScale } from '@/components/TouchableScale';
import {
  ArrowLeft, Building, Plus, Layers, DollarSign, Calendar,
  ChevronRight, Users, MapPin, Eye2, Key, PlusCircle, Star
} from '@/components/SmartIcons';
import { CoWorkSpace } from '@/types/user';

const { width } = Dimensions.get('window');

const BILLING_LABELS = { hour: 'hora', day: 'día', week: 'semana', month: 'mes' };
const TYPE_COLORS: Record<string, string> = {
  'streaming-set': '#fbac94',
  'recording-booth': '#9bdbbf',
  'office': '#6aaaca',
  'studio': '#ac8cb3',
  'meeting-room': '#fbeb5c',
  'event-space': '#f5ccc4',
  'coworking-desk': '#acac74',
  'other': '#c4d8e7',
};
const TYPE_LABELS: Record<string, string> = {
  'streaming-set': '🎬 Streaming',
  'recording-booth': '🎧 Cabina / DJ',
  'office': '💼 Oficina',
  'studio': '🎨 Estudio',
  'meeting-room': '📋 Sala de reuniones',
  'event-space': '🎉 Sala de eventos',
  'coworking-desk': '💻 Coworking',
  'other': '🏠 Otro',
};

export default function MisEspaciosScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser } = useUser();
  const { spaces, loadData, isLoading, publishSpace, deleteSpace } = useCoWork();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadData(); }, []);

  const mySpaces = useMemo(() =>
    spaces.filter(s => currentUser && String(s.ownerId) === String(currentUser.id)),
    [spaces, currentUser]
  );

  const totalStats = useMemo(() => ({
    totalSpaces: mySpaces.length,
    totalSubSpaces: mySpaces.reduce((s, sp) => s + sp.subSpaces.length, 0),
    publishedSpaces: mySpaces.filter(s => s.isPublished).length,
    activeSubSpaces: mySpaces.reduce((s, sp) => s + sp.subSpaces.filter(sub => sub.isActive).length, 0),
  }), [mySpaces]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handlePublishToggle = (space: CoWorkSpace) => {
    const msg = space.isPublished
      ? '¿Quieres desactivar este espacio para que no sea visible al público?'
      : '¿Quieres publicar este espacio para que otros usuarios puedan reservarlo?';
    Alert.alert(space.isPublished ? 'Desactivar espacio' : 'Publicar espacio', msg, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: space.isPublished ? 'Desactivar' : 'Publicar',
        onPress: () => publishSpace(space.id, !space.isPublished),
      },
    ]);
  };

  const handleDelete = (space: CoWorkSpace) => {
    Alert.alert('Eliminar Espacio', `¿Seguro que deseas eliminar "${space.title}"? Esta acción no se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteSpace(space.id) },
    ]);
  };

  if (!currentUser) {
    return (
      <ConstellationBackground intensity="light">
        <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
          <Building size={60} color={Colors.textLight} />
          <Text style={styles.emptyTitle}>Inicia sesión para gestionar tus espacios</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/login')}>
            <Text style={styles.primaryBtnText}>Iniciar Sesión</Text>
          </TouchableOpacity>
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
        {/* Header */}
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
              <Building size={20} color={Colors.white} />
              <Text style={styles.headerTitle}>Mis Espacios</Text>
            </View>
            <TouchableOpacity
              style={styles.addSpaceBtn}
              onPress={() => router.push('/add-space')}
            >
              <Plus size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerSub}>Modalidad Co-Work – gestiona y arrienda tus espacios</Text>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{totalStats.totalSpaces}</Text>
              <Text style={styles.statLabel}>Espacios</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{totalStats.totalSubSpaces}</Text>
              <Text style={styles.statLabel}>Sub-espacios</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{totalStats.publishedSpaces}</Text>
              <Text style={styles.statLabel}>Publicados</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{totalStats.activeSubSpaces}</Text>
              <Text style={styles.statLabel}>Activos</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Add Space CTA */}
        <TouchableScale
          style={styles.addCta}
          onPress={() => router.push('/add-space')}
        >
          <LinearGradient
            colors={['#4f8497', '#6aaaca']}
            style={styles.addCtaGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <PlusCircle size={22} color={Colors.white} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.addCtaTitle}>Agregar nuevo espacio</Text>
              <Text style={styles.addCtaSub}>Publica tu propiedad o local y comienza a arrendar</Text>
            </View>
            <ChevronRight size={20} color={Colors.white} />
          </LinearGradient>
        </TouchableScale>

        {/* Spaces List */}
        {mySpaces.length === 0 ? (
          <View style={styles.emptyBox}>
            <Building size={72} color={Colors.border} />
            <Text style={styles.emptyTitle}>Aún no tienes espacios registrados</Text>
            <Text style={styles.emptySub}>
              Crea tu primer espacio Co-Work y subdivídelo en ambientes que puedas arrendar por hora, día, semana o mes.
            </Text>
          </View>
        ) : (
          <View style={styles.spacesSection}>
            <Text style={styles.sectionTitle}>Mis propiedades</Text>
            {mySpaces.map(space => (
              <SpaceCard
                key={space.id}
                space={space}
                onManage={() => router.push({ pathname: '/manage-space', params: { spaceId: space.id } })}
                onPublishToggle={() => handlePublishToggle(space)}
                onDelete={() => handleDelete(space)}
              />
            ))}
          </View>
        )}

        {/* Quick Links */}
        <View style={styles.quickLinks}>
          <Text style={styles.sectionTitle}>Accesos rápidos</Text>
          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => router.push('/calendar')}
          >
            <View style={[styles.quickLinkIcon, { backgroundColor: '#6aaaca20' }]}>
              <Calendar size={20} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.quickLinkTitle}>Mi Calendario</Text>
              <Text style={styles.quickLinkSub}>Ver reservas y disponibilidad</Text>
            </View>
            <ChevronRight size={18} color={Colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => router.push('/mi-tablero')}
          >
            <View style={[styles.quickLinkIcon, { backgroundColor: '#fbeb5c30' }]}>
              <Layers size={20} color={Colors.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.quickLinkTitle}>Mi Tablero</Text>
              <Text style={styles.quickLinkSub}>Gestiona todos tus servicios</Text>
            </View>
            <ChevronRight size={18} color={Colors.textLight} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ConstellationBackground>
  );
}

function SpaceCard({ space, onManage, onPublishToggle, onDelete }: {
  space: CoWorkSpace;
  onManage: () => void;
  onPublishToggle: () => void;
  onDelete: () => void;
}) {
  const activeSubSpaces = space.subSpaces.filter(s => s.isActive);

  return (
    <View style={cardStyles.card}>
      {/* Space header */}
      <LinearGradient
        colors={space.isPublished ? ['#2c6d85', '#4f8497'] : ['#555', '#777']}
        style={cardStyles.cardHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={{ flex: 1 }}>
          <Text style={cardStyles.cardTitle} numberOfLines={1}>{space.title}</Text>
          <View style={cardStyles.locationRow}>
            <MapPin size={12} color="rgba(255,255,255,0.8)" />
            <Text style={cardStyles.locationText} numberOfLines={1}>{space.location}</Text>
          </View>
        </View>
        <View style={[cardStyles.publishBadge, { backgroundColor: space.isPublished ? '#9bdbbf50' : '#ffffff30' }]}>
          <Text style={cardStyles.publishBadgeText}>{space.isPublished ? '🟢 Publicado' : '⚪ Borrador'}</Text>
        </View>
      </LinearGradient>

      {/* Stats row */}
      <View style={cardStyles.statsRow}>
        <View style={cardStyles.statItem}>
          <Layers size={14} color={Colors.primary} />
          <Text style={cardStyles.statText}>{space.subSpaces.length} sub-espacios</Text>
        </View>
        <View style={cardStyles.statItem}>
          <Eye2 size={14} color={Colors.success} />
          <Text style={cardStyles.statText}>{activeSubSpaces.length} activos</Text>
        </View>
        {space.rating > 0 && (
          <View style={cardStyles.statItem}>
            <Star size={14} color={Colors.warning} />
            <Text style={cardStyles.statText}>{space.rating.toFixed(1)}</Text>
          </View>
        )}
        <View style={cardStyles.statItem}>
          <Key size={14} color={Colors.textLight} />
          <Text style={cardStyles.statText}>{space.calendarMode === 'unified' ? 'Cal. unificado' : 'Cal. separados'}</Text>
        </View>
      </View>

      {/* Sub-spaces preview */}
      {space.subSpaces.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={cardStyles.subSpacesScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {space.subSpaces.map(sub => (
            <View
              key={sub.id}
              style={[cardStyles.subTag, { backgroundColor: (sub.color || '#6aaaca') + '25', borderColor: (sub.color || '#6aaaca') + '60' }]}
            >
              <View style={[cardStyles.subTagDot, { backgroundColor: sub.color || '#6aaaca' }]} />
              <Text style={[cardStyles.subTagText, { color: Colors.text }]} numberOfLines={1}>{sub.title}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Actions */}
      <View style={cardStyles.actions}>
        <TouchableOpacity style={cardStyles.actionBtnSecondary} onPress={onPublishToggle}>
          <Text style={cardStyles.actionBtnSecondaryText}>
            {space.isPublished ? 'Desactivar' : 'Publicar'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={cardStyles.actionBtnDelete} onPress={onDelete}>
          <Text style={cardStyles.actionBtnDeleteText}>Eliminar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={cardStyles.actionBtnPrimary} onPress={onManage}>
          <Text style={cardStyles.actionBtnPrimaryText}>Gestionar →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  addSpaceBtn: {
    padding: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 20,
    marginLeft: 44,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '800', color: Colors.white },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginVertical: 4 },
  addCta: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  addCtaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  addCtaTitle: { fontSize: 16, fontWeight: '700', color: Colors.white },
  addCtaSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  spacesSection: { paddingHorizontal: 16, marginTop: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
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
  quickLinks: { paddingHorizontal: 16, marginTop: 24 },
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  quickLinkIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  quickLinkTitle: { fontSize: 15, fontWeight: '600', color: Colors.text },
  quickLinkSub: { fontSize: 12, color: Colors.textLight, marginTop: 2 },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardTitle: { fontSize: 17, fontWeight: '800', color: Colors.white, marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 12, color: 'rgba(255,255,255,0.8)', flex: 1 },
  publishBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  publishBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.white },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    flexWrap: 'wrap',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '50',
  },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statText: { fontSize: 12, color: Colors.textLight, fontWeight: '500' },
  subSpacesScroll: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border + '40' },
  subTag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    gap: 6,
  },
  subTagDot: { width: 6, height: 6, borderRadius: 3 },
  subTagText: { fontSize: 11, fontWeight: '600', maxWidth: 120 },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  actionBtnSecondary: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: Colors.border + '40',
    alignItems: 'center',
  },
  actionBtnSecondaryText: { fontSize: 12, fontWeight: '600', color: Colors.textLight },
  actionBtnDelete: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: Colors.error + '15',
    alignItems: 'center',
  },
  actionBtnDeleteText: { fontSize: 12, fontWeight: '600', color: Colors.error },
  actionBtnPrimary: {
    flex: 1.5,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  actionBtnPrimaryText: { fontSize: 13, fontWeight: '700', color: Colors.white },
});
