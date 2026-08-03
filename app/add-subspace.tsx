import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Switch
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useCoWork } from '@/hooks/cowork-store';
import { Colors } from '@/constants/colors';
import { ConstellationBackground } from '@/components/ConstellationBackground';
import { TouchableScale } from '@/components/TouchableScale';
import { ArrowLeft, Layers, Check, Plus, DollarSign } from '@/components/SmartIcons';
import { SubSpaceType, BillingUnit, CalendarMode } from '@/types/user';

const SPACE_TYPES: { value: SubSpaceType; label: string; emoji: string; desc: string }[] = [
  { value: 'streaming-set', label: 'Set de Streaming', emoji: '🎬', desc: 'Ideal para video streaming, podcasts, lives' },
  { value: 'recording-booth', label: 'Cabina / DJ / Sonido', emoji: '🎧', desc: 'Con absorción de sonido, ideal para grabaciones' },
  { value: 'studio', label: 'Estudio Creativo', emoji: '🎨', desc: 'Para artistas, diseñadores, fotógrafos' },
  { value: 'office', label: 'Oficina Privada', emoji: '💼', desc: 'Escritorio, privacidad, reuniones pequeñas' },
  { value: 'meeting-room', label: 'Sala de Reuniones', emoji: '📋', desc: 'Proyector, sillas, mesa, para grupos' },
  { value: 'event-space', label: 'Sala de Eventos', emoji: '🎉', desc: 'Para talleres, clases, presentaciones' },
  { value: 'coworking-desk', label: 'Puesto Coworking', emoji: '💻', desc: 'Escritorio individual en espacio compartido' },
  { value: 'other', label: 'Otro', emoji: '🏠', desc: 'Tipo personalizado' },
];

const FEATURES = ['WiFi de alta velocidad', 'Absorción de sonido', 'Insonorizado', 'Luz natural', 'Luz artificial ajustable', 'Espejo', 'Pizarrón', 'Proyector', 'Sistema de audio', 'Cámara', 'Micrófono', 'Fondo artístico', 'Vista al exterior', 'Privacidad', 'Escritorio', 'Sillas ergonómicas', 'AC', 'Heladera', 'Cafetera'];

const COLORS = ['#9bdbbf', '#fbac94', '#fbeb5c', '#ac8cb3', '#6aaaca', '#f5ccc4', '#acac74', '#c4d8e7'];

const FLOOR_LABELS = ['Subsuelo', 'Planta Baja', 'Primer Piso', 'Mezzanine', 'Segundo Piso', 'Azotea / Terraza'];

export default function AddSubSpaceScreen() {
  const insets = useSafeAreaInsets();
  const { spaceId, subSpaceId, editMode } = useLocalSearchParams<{ spaceId: string; subSpaceId?: string; editMode?: string }>();
  const isEditing = editMode === 'true';

  const { getSpaceById, addSubSpace, updateSubSpace, loadData } = useCoWork();

  const [type, setType] = useState<SubSpaceType>('office');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState(4);
  const [features, setFeatures] = useState<string[]>([]);
  const [billingUnits, setBillingUnits] = useState<BillingUnit[]>(['hour']);
  const [pricePerHour, setPricePerHour] = useState('');
  const [pricePerDay, setPricePerDay] = useState('');
  const [pricePerWeek, setPricePerWeek] = useState('');
  const [pricePerMonth, setPricePerMonth] = useState('');
  const [floorLabel, setFloorLabel] = useState('');
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('unified');
  const [color, setColor] = useState(COLORS[0]);
  const [isActive, setIsActive] = useState(true);
  const [customFeature, setCustomFeature] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (isEditing && spaceId && subSpaceId) {
      const space = getSpaceById(spaceId);
      const sub = space?.subSpaces.find(s => s.id === subSpaceId);
      if (sub) {
        setType(sub.type);
        setTitle(sub.title);
        setDescription(sub.description);
        setCapacity(sub.capacity);
        setFeatures(sub.features);
        setBillingUnits(sub.billingUnits);
        setPricePerHour(sub.pricePerHour?.toString() || '');
        setPricePerDay(sub.pricePerDay?.toString() || '');
        setPricePerWeek(sub.pricePerWeek?.toString() || '');
        setPricePerMonth(sub.pricePerMonth?.toString() || '');
        setFloorLabel(sub.floorLabel || '');
        setCalendarMode(sub.calendarMode);
        setColor(sub.color || COLORS[0]);
        setIsActive(sub.isActive);
      }
    }
  }, [isEditing, spaceId, subSpaceId]);

  const toggleBillingUnit = (u: BillingUnit) => {
    setBillingUnits(prev =>
      prev.includes(u) ? (prev.length > 1 ? prev.filter(x => x !== u) : prev) : [...prev, u]
    );
  };

  const toggleFeature = (f: string) => {
    setFeatures(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert('Error', 'El nombre del sub-espacio es requerido.'); return; }
    if (billingUnits.includes('hour') && !pricePerHour) { Alert.alert('Error', 'Ingresa el precio por hora.'); return; }
    if (billingUnits.includes('day') && !pricePerDay) { Alert.alert('Error', 'Ingresa el precio por día.'); return; }

    setIsSaving(true);
    try {
      const subData = {
        type,
        title: title.trim(),
        description: description.trim(),
        capacity,
        features,
        images: [],
        billingUnits,
        pricePerHour: pricePerHour ? parseFloat(pricePerHour) : undefined,
        pricePerDay: pricePerDay ? parseFloat(pricePerDay) : undefined,
        pricePerWeek: pricePerWeek ? parseFloat(pricePerWeek) : undefined,
        pricePerMonth: pricePerMonth ? parseFloat(pricePerMonth) : undefined,
        floorLabel: floorLabel || undefined,
        calendarMode,
        color,
        isActive,
      };

      if (isEditing && subSpaceId) {
        await updateSubSpace(spaceId, subSpaceId, subData);
        Alert.alert('Éxito', 'Sub-espacio actualizado.', [{ text: 'OK', onPress: () => router.back() }]);
      } else {
        await addSubSpace(spaceId, subData);
        Alert.alert('¡Sub-espacio creado!', `"${title}" ya puede ser reservado.`, [
          { text: 'Agregar otro', onPress: () => { setTitle(''); setDescription(''); setBillingUnits(['hour']); } },
          { text: 'Ver espacio', onPress: () => router.replace({ pathname: '/manage-space', params: { spaceId } }) },
        ]);
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar el sub-espacio.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ConstellationBackground intensity="light">
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <LinearGradient
          colors={['#4f8497', '#6aaaca']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Layers size={20} color={Colors.white} />
            <Text style={styles.headerTitle}>{isEditing ? 'Editar Sub-espacio' : 'Nuevo Sub-espacio'}</Text>
          </View>
        </LinearGradient>

        <View style={styles.form}>
          {/* Type selector */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🏠 Tipo de espacio</Text>
            {SPACE_TYPES.map(t => (
              <TouchableOpacity
                key={t.value}
                style={[styles.typeOption, type === t.value && styles.typeOptionActive]}
                onPress={() => setType(t.value)}
              >
                <Text style={styles.typeEmoji}>{t.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.typeLabel, type === t.value && { color: Colors.primary }]}>{t.label}</Text>
                  <Text style={styles.typeDesc}>{t.desc}</Text>
                </View>
                {type === t.value && <Check size={16} color={Colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>

          {/* Basic info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📝 Detalles</Text>

            <Text style={styles.label}>Nombre del sub-espacio *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Ej: Estudio Underground A, Mezzanine Estudio 1..."
              placeholderTextColor={Colors.textLight}
            />

            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe este espacio específico, sus características únicas..."
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Piso / Nivel</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
              {FLOOR_LABELS.map(f => (
                <TouchableOpacity
                  key={f}
                  style={[styles.chip, floorLabel === f && styles.chipActive]}
                  onPress={() => setFloorLabel(floorLabel === f ? '' : f)}
                >
                  <Text style={[styles.chipText, floorLabel === f && styles.chipTextActive]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              value={floorLabel && !FLOOR_LABELS.includes(floorLabel) ? floorLabel : ''}
              onChangeText={setFloorLabel}
              placeholder="O escribe un nombre personalizado..."
              placeholderTextColor={Colors.textLight}
            />

            <Text style={styles.label}>Capacidad (personas)</Text>
            <View style={styles.capacityRow}>
              <TouchableOpacity style={styles.capacityBtn} onPress={() => setCapacity(Math.max(1, capacity - 1))}>
                <Text style={styles.capacityBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.capacityValue}>{capacity}</Text>
              <TouchableOpacity style={styles.capacityBtn} onPress={() => setCapacity(capacity + 1)}>
                <Text style={styles.capacityBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Pricing */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>💰 Precios y facturación</Text>
            <Text style={styles.cardSub}>Selecciona los tipos de cobro habilitados</Text>

            {[
              { unit: 'hour' as BillingUnit, label: 'Por hora', price: pricePerHour, setter: setPricePerHour },
              { unit: 'day' as BillingUnit, label: 'Por día', price: pricePerDay, setter: setPricePerDay },
              { unit: 'week' as BillingUnit, label: 'Por semana', price: pricePerWeek, setter: setPricePerWeek },
              { unit: 'month' as BillingUnit, label: 'Por mes', price: pricePerMonth, setter: setPricePerMonth },
            ].map(({ unit, label, price, setter }) => (
              <View key={unit} style={styles.pricingRow}>
                <TouchableOpacity
                  style={[styles.billingToggle, billingUnits.includes(unit) && styles.billingToggleActive]}
                  onPress={() => toggleBillingUnit(unit)}
                >
                  <Text style={[styles.billingToggleText, billingUnits.includes(unit) && { color: Colors.white }]}>{label}</Text>
                </TouchableOpacity>
                {billingUnits.includes(unit) && (
                  <View style={styles.priceInputContainer}>
                    <DollarSign size={15} color={Colors.textLight} />
                    <TextInput
                      style={styles.priceInput}
                      value={price}
                      onChangeText={setter}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={Colors.textLight}
                    />
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Calendar Mode */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📅 Calendario de este sub-espacio</Text>
            <TouchableOpacity
              style={[styles.radioOption, calendarMode === 'unified' && styles.radioOptionActive]}
              onPress={() => setCalendarMode('unified')}
            >
              <View style={[styles.radioCircle, calendarMode === 'unified' && styles.radioCircleActive]}>
                {calendarMode === 'unified' && <Check size={14} color={Colors.white} />}
              </View>
              <Text style={[styles.radioLabel, { marginLeft: 10 }]}>Usar calendario del espacio principal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.radioOption, calendarMode === 'separate' && styles.radioOptionActive]}
              onPress={() => setCalendarMode('separate')}
            >
              <View style={[styles.radioCircle, calendarMode === 'separate' && styles.radioCircleActive]}>
                {calendarMode === 'separate' && <Check size={14} color={Colors.white} />}
              </View>
              <Text style={[styles.radioLabel, { marginLeft: 10 }]}>Calendario propio e independiente</Text>
            </TouchableOpacity>
          </View>

          {/* Features */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>✨ Características</Text>
            <View style={styles.chipGrid}>
              {FEATURES.map(f => (
                <TouchableOpacity
                  key={f}
                  style={[styles.chip, features.includes(f) && styles.chipActive]}
                  onPress={() => toggleFeature(f)}
                >
                  {features.includes(f) && <Check size={11} color={Colors.white} />}
                  <Text style={[styles.chipText, features.includes(f) && styles.chipTextActive]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.customRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={customFeature}
                onChangeText={setCustomFeature}
                placeholder="Agregar característica..."
                placeholderTextColor={Colors.textLight}
                onSubmitEditing={() => { if (customFeature.trim()) { setFeatures(p => [...p, customFeature.trim()]); setCustomFeature(''); } }}
              />
              <TouchableOpacity
                style={styles.addCustomBtn}
                onPress={() => { if (customFeature.trim()) { setFeatures(p => [...p, customFeature.trim()]); setCustomFeature(''); } }}
              >
                <Plus size={18} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Color picker */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🎨 Color en el calendario</Text>
            <Text style={styles.cardSub}>Identifica este espacio visualmente</Text>
            <View style={styles.colorRow}>
              {COLORS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorSwatch, { backgroundColor: c }, color === c && styles.colorSwatchSelected]}
                  onPress={() => setColor(c)}
                >
                  {color === c && <Check size={16} color="#333" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Active toggle */}
          <View style={styles.card}>
            <View style={styles.publishRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>✅ Estado del espacio</Text>
                <Text style={styles.cardSub}>{isActive ? 'Disponible para reservas' : 'No disponible para reservas'}</Text>
              </View>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </View>
          </View>

          {/* Save */}
          <TouchableScale style={styles.saveBtn} onPress={handleSave}>
            <LinearGradient
              colors={['#4f8497', '#6aaaca']}
              style={styles.saveBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Layers size={20} color={Colors.white} />
              <Text style={styles.saveBtnText}>{isSaving ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Sub-espacio'}</Text>
            </LinearGradient>
          </TouchableScale>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ConstellationBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 80 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 20,
  },
  backBtn: { padding: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', marginRight: 12 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.white },
  form: { padding: 16 },
  card: {
    backgroundColor: Colors.white, borderRadius: 18, padding: 16, marginBottom: 16,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  cardSub: { fontSize: 12, color: Colors.textLight, marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.textLight, marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    padding: 12, fontSize: 14, color: Colors.text, backgroundColor: Colors.background, marginBottom: 4,
  },
  textArea: { minHeight: 70, textAlignVertical: 'top' },
  typeOption: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, marginBottom: 6,
    backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border,
  },
  typeOptionActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  typeEmoji: { fontSize: 22 },
  typeLabel: { fontSize: 13, fontWeight: '700', color: Colors.text },
  typeDesc: { fontSize: 11, color: Colors.textLight, marginTop: 1 },
  capacityRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 6, marginBottom: 4 },
  capacityBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary + '20', alignItems: 'center', justifyContent: 'center' },
  capacityBtnText: { fontSize: 22, color: Colors.primary, fontWeight: '700', lineHeight: 24 },
  capacityValue: { fontSize: 22, fontWeight: '800', color: Colors.text, minWidth: 30, textAlign: 'center' },
  pricingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  billingToggle: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border, minWidth: 100,
  },
  billingToggleActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  billingToggleText: { fontSize: 13, fontWeight: '700', color: Colors.textLight, textAlign: 'center' },
  priceInputContainer: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    paddingHorizontal: 10, backgroundColor: Colors.background, height: 44,
  },
  priceInput: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.text },
  radioOption: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, padding: 12, marginBottom: 8,
  },
  radioOptionActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  radioCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  radioCircleActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  radioLabel: { fontSize: 13, fontWeight: '600', color: Colors.text },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 11, fontWeight: '600', color: Colors.textLight },
  chipTextActive: { color: Colors.white },
  customRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 },
  addCustomBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  colorSwatch: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  colorSwatchSelected: { borderWidth: 3, borderColor: Colors.text },
  publishRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  saveBtn: {
    borderRadius: 18, overflow: 'hidden',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 6,
    marginTop: 8,
  },
  saveBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
  saveBtnText: { fontSize: 17, fontWeight: '800', color: Colors.white },
});
