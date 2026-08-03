import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Switch
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useCoWork } from '@/hooks/cowork-store';
import { useUser } from '@/hooks/user-store';
import { Colors } from '@/constants/colors';
import { ConstellationBackground } from '@/components/ConstellationBackground';
import { TouchableScale } from '@/components/TouchableScale';
import { ArrowLeft, Building, MapPin, Check, Plus, X } from '@/components/SmartIcons';
import { CalendarMode } from '@/types/user';

const AMENITY_OPTIONS = ['WiFi', 'Aire Acondicionado', 'Calefacción', 'Baño privado', 'Cocina compartida', 'Estacionamiento', 'Acceso discapacitados', 'Seguridad 24hs', 'Recepción', 'Sala de espera', 'Proyector', 'Sonido', 'Iluminación profesional', 'Terraza', 'Jardín'];

const TAG_OPTIONS = ['Arte', 'Galería', 'Estudio', 'Streaming', 'Música', 'Podcast', 'Coworking', 'Educación', 'Fotografía', 'Danza', 'Yoga', 'Bienestar', 'Tecnología', 'Producción audiovisual'];

export default function AddSpaceScreen() {
  const insets = useSafeAreaInsets();
  const { spaceId, editMode } = useLocalSearchParams<{ spaceId?: string; editMode?: string }>();
  const isEditing = editMode === 'true';

  const { currentUser } = useUser();
  const { addSpace, updateSpace, getSpaceById, loadData } = useCoWork();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('unified');
  const [isPublished, setIsPublished] = useState(false);
  const [customAmenity, setCustomAmenity] = useState('');
  const [customTag, setCustomTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (isEditing && spaceId) {
      const space = getSpaceById(spaceId);
      if (space) {
        setTitle(space.title);
        setDescription(space.description);
        setLocation(space.location);
        setAmenities(space.amenities);
        setTags(space.tags);
        setCalendarMode(space.calendarMode);
        setIsPublished(space.isPublished);
      }
    }
  }, [isEditing, spaceId]);

  const toggleAmenity = (a: string) => {
    setAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  };

  const toggleTag = (t: string) => {
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const addCustomAmenity = () => {
    if (customAmenity.trim()) { setAmenities(prev => [...prev, customAmenity.trim()]); setCustomAmenity(''); }
  };
  const addCustomTag = () => {
    if (customTag.trim()) { setTags(prev => [...prev, customTag.trim()]); setCustomTag(''); }
  };

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert('Error', 'El nombre del espacio es requerido.'); return; }
    if (!location.trim()) { Alert.alert('Error', 'La ubicación es requerida.'); return; }
    if (!currentUser) { Alert.alert('Error', 'Debes estar logueado.'); return; }

    setIsSaving(true);
    try {
      const spaceData = {
        ownerId: String(currentUser.id),
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        images: [],
        amenities,
        tags,
        calendarMode,
        isPublished,
        subSpaces: [],
      };

      if (isEditing && spaceId) {
        await updateSpace(spaceId, spaceData);
        Alert.alert('Éxito', 'Espacio actualizado correctamente.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        const newId = await addSpace(spaceData);
        Alert.alert('¡Espacio creado!', 'Ahora puedes agregar sub-espacios para arrendar.', [
          {
            text: 'Agregar sub-espacio',
            onPress: () => router.replace({ pathname: '/manage-space', params: { spaceId: newId } }),
          },
          { text: 'Luego', onPress: () => router.replace('/mis-espacios') },
        ]);
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar el espacio.');
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
          colors={['#2c6d85', '#4f8497']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Building size={20} color={Colors.white} />
            <Text style={styles.headerTitle}>{isEditing ? 'Editar Espacio' : 'Nuevo Espacio'}</Text>
          </View>
        </LinearGradient>

        <View style={styles.form}>
          {/* Basic info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📝 Información básica</Text>

            <Text style={styles.label}>Nombre del espacio *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Ej: Galería de Arte Central, Loft Creativo..."
              placeholderTextColor={Colors.textLight}
            />

            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe tu espacio, qué lo hace especial, para qué actividades es ideal..."
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={4}
            />

            <Text style={styles.label}>Ubicación *</Text>
            <View style={styles.inputWithIcon}>
              <MapPin size={16} color={Colors.textLight} style={{ marginLeft: 12 }} />
              <TextInput
                style={[styles.input, { flex: 1, borderWidth: 0, paddingLeft: 8 }]}
                value={location}
                onChangeText={setLocation}
                placeholder="Dirección completa..."
                placeholderTextColor={Colors.textLight}
              />
            </View>
          </View>

          {/* Calendar Mode */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📅 Tipo de calendario</Text>
            <Text style={styles.cardSub}>¿Cómo quieres gestionar las reservas de tus sub-espacios?</Text>

            <TouchableOpacity
              style={[styles.radioOption, calendarMode === 'unified' && styles.radioOptionActive]}
              onPress={() => setCalendarMode('unified')}
            >
              <View style={[styles.radioCircle, calendarMode === 'unified' && styles.radioCircleActive]}>
                {calendarMode === 'unified' && <Check size={14} color={Colors.white} />}
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.radioTitle}>Calendario unificado</Text>
                <Text style={styles.radioSub}>Un solo calendario para todo el espacio. Los sub-espacios aparecen como filtros de color.</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.radioOption, calendarMode === 'separate' && styles.radioOptionActive]}
              onPress={() => setCalendarMode('separate')}
            >
              <View style={[styles.radioCircle, calendarMode === 'separate' && styles.radioCircleActive]}>
                {calendarMode === 'separate' && <Check size={14} color={Colors.white} />}
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.radioTitle}>Calendarios separados</Text>
                <Text style={styles.radioSub}>Cada sub-espacio puede tener su propio calendario independiente.</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Amenities */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🏢 Comodidades del espacio</Text>
            <View style={styles.chipGrid}>
              {AMENITY_OPTIONS.map(a => (
                <TouchableOpacity
                  key={a}
                  style={[styles.chip, amenities.includes(a) && styles.chipActive]}
                  onPress={() => toggleAmenity(a)}
                >
                  {amenities.includes(a) && <Check size={11} color={Colors.white} />}
                  <Text style={[styles.chipText, amenities.includes(a) && styles.chipTextActive]}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.customRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={customAmenity}
                onChangeText={setCustomAmenity}
                placeholder="Agregar comodidad personalizada..."
                placeholderTextColor={Colors.textLight}
                onSubmitEditing={addCustomAmenity}
              />
              <TouchableOpacity style={styles.addCustomBtn} onPress={addCustomAmenity}>
                <Plus size={18} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Tags */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🏷️ Etiquetas</Text>
            <Text style={styles.cardSub}>Ayudan a los usuarios a encontrar tu espacio</Text>
            <View style={styles.chipGrid}>
              {TAG_OPTIONS.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, styles.tagChip, tags.includes(t) && styles.tagChipActive]}
                  onPress={() => toggleTag(t)}
                >
                  {tags.includes(t) && <Check size={11} color={Colors.white} />}
                  <Text style={[styles.chipText, tags.includes(t) && styles.chipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.customRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={customTag}
                onChangeText={setCustomTag}
                placeholder="Agregar etiqueta personalizada..."
                placeholderTextColor={Colors.textLight}
                onSubmitEditing={addCustomTag}
              />
              <TouchableOpacity style={styles.addCustomBtn} onPress={addCustomTag}>
                <Plus size={18} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Publish toggle */}
          <View style={styles.card}>
            <View style={styles.publishRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>🌐 Publicar espacio</Text>
                <Text style={styles.cardSub}>Haz visible tu espacio para que otros usuarios puedan reservarlo</Text>
              </View>
              <Switch
                value={isPublished}
                onValueChange={setIsPublished}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </View>
          </View>

          {/* Save */}
          <TouchableScale style={styles.saveBtn} onPress={handleSave}>
            <LinearGradient
              colors={['#2c6d85', '#4f8497']}
              style={styles.saveBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Building size={20} color={Colors.white} />
              <Text style={styles.saveBtnText}>{isSaving ? 'Guardando...' : isEditing ? 'Actualizar Espacio' : 'Crear Espacio'}</Text>
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
  backBtn: {
    padding: 8, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginRight: 12,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.white,
  },
  form: { padding: 16 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  cardSub: { fontSize: 12, color: Colors.textLight, marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.textLight, marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.background,
    marginBottom: 4,
  },
  textArea: { minHeight: 88, textAlignVertical: 'top' },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.background,
    overflow: 'hidden',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  radioOptionActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  radioCircle: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 1,
  },
  radioCircleActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  radioTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 3 },
  radioSub: { fontSize: 12, color: Colors.textLight, lineHeight: 17 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tagChip: { borderColor: Colors.goldDark + '60', backgroundColor: Colors.gold + '20' },
  tagChipActive: { backgroundColor: Colors.goldDark, borderColor: Colors.goldDark },
  chipText: { fontSize: 12, fontWeight: '600', color: Colors.textLight },
  chipTextActive: { color: Colors.white },
  customRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 },
  addCustomBtn: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  publishRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  saveBtn: {
    borderRadius: 18, overflow: 'hidden',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 6,
    marginTop: 8,
  },
  saveBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 18,
  },
  saveBtnText: { fontSize: 17, fontWeight: '800', color: Colors.white },
});
