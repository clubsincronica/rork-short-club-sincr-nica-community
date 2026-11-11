import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, Users, MapPin, TrendingUp, CalendarDays } from 'lucide-react-native';
import { Colors, Gradients } from '@/constants/colors';
import { formatPrice } from '@/constants/currency';
import { CalendarEvent } from '@/types/user';
import { FloatingCard } from '@/components/FloatingCard';

type BoardEvent = CalendarEvent & {
  occupationRatio: number;
  availableSpots: number;
};

const MONTHS_SHORT = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
const DAYS_SHORT = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

function toLocalISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function withOccupation(event: CalendarEvent): BoardEvent {
  const max = event.maxParticipants || 1;
  return {
    ...event,
    occupationRatio: Math.min(1, event.currentParticipants / max),
    availableSpots: Math.max(0, event.maxParticipants - event.currentParticipants),
  };
}

function formatEventDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(year, (month ?? 1) - 1, day ?? 1);
  if (Number.isNaN(parsed.getTime())) return date;
  return `${DAYS_SHORT[parsed.getDay()]} ${parsed.getDate()} ${MONTHS_SHORT[parsed.getMonth()]}`;
}

interface OnTodayBoardProps {
  events: CalendarEvent[];
  onEventPress?: (event: CalendarEvent) => void;
}

export function OnTodayBoard({ events, onEventPress }: OnTodayBoardProps) {
  const todayEvents = useMemo(() => {
    const now = new Date();
    const todayStr = toLocalISODate(now);

    return events
      .filter((event) => event.date === todayStr && event.status === 'upcoming')
      .filter((event) => {
        const [hours, minutes] = event.startTime.split(':').map(Number);
        if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return true;
        const startsAt = new Date(now);
        startsAt.setHours(hours, minutes, 0, 0);
        // Tolerancia de 30 min: se puede entrar a una sesión ya empezada.
        return startsAt.getTime() >= now.getTime() - 30 * 60 * 1000;
      })
      .map(withOccupation)
      .sort((a, b) => a.occupationRatio - b.occupationRatio)
      .slice(0, 5);
  }, [events]);

  // Si hoy no hay nada, el tablero muestra los próximos encuentros de la
  // temporada en vez de un cartel vacío.
  const nextEvents = useMemo(() => {
    const todayStr = toLocalISODate(new Date());

    return events
      .filter((event) => event.date > todayStr && event.status === 'upcoming')
      .map(withOccupation)
      .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`))
      .slice(0, 5);
  }, [events]);

  const isTodayMode = todayEvents.length > 0;
  const boardEvents = isTodayMode ? todayEvents : nextEvents;

  if (boardEvents.length === 0) {
    return (
      <View style={styles.container}>
        <FloatingCard style={styles.headerContainer} intensity="subtle">
          <LinearGradient colors={Gradients.galaxy} style={styles.header}>
            <View style={styles.titleContainer}>
              <View style={styles.titleRow}>
                <TrendingUp size={20} color={Colors.gold} />
                <Text style={styles.title}>PRÓXIMOS ENCUENTROS</Text>
              </View>
              <Text style={styles.subtitle}>
                Todavía no hay fechas cargadas para esta temporada
              </Text>
            </View>
          </LinearGradient>
        </FloatingCard>
      </View>
    );
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = Number.parseInt(hours, 10);
    if (!Number.isFinite(hour)) return time;
    return `${String(hour).padStart(2, '0')}:${minutes}`;
  };

  return (
    <View style={styles.container}>
      <FloatingCard style={styles.headerContainer} intensity="subtle">
        <LinearGradient colors={Gradients.galaxy} style={styles.header}>

        
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <TrendingUp size={20} color={Colors.gold} />
            <Text style={styles.title}>{isTodayMode ? 'HOY EN VIVO' : 'PRÓXIMOS ENCUENTROS'}</Text>
          </View>
          <Text style={styles.subtitle}>
            {isTodayMode ? 'Eventos con espacios disponibles' : 'microCósmos · Verano 26/27'}
          </Text>
        </View>
        </LinearGradient>
      </FloatingCard>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {boardEvents.map((event, index) => (
          <TouchableOpacity
            key={event.id}
            style={[
              styles.eventCard,
              index === 0 && styles.firstCard,
              index === boardEvents.length - 1 && styles.lastCard,
            ]}
            onPress={() => onEventPress?.(event)}
            activeOpacity={0.8}
          >
            <LinearGradient 
              colors={event.availableSpots <= 2 ? Gradients.accent : Gradients.purpleGreen}
              style={styles.cardGradient}
            >
              {/* Urgency indicator: quedan 2 lugares o menos */}
              {event.availableSpots <= 2 && (
                <View style={styles.urgencyBadge}>
                  <Text style={styles.urgencyText}>¡Últimos lugares!</Text>
                </View>
              )}



              <View style={styles.cardContent}>
                <Text style={styles.eventTitle} numberOfLines={2}>
                  {event.title}
                </Text>
                
                <View style={styles.eventDetails}>
                  {!isTodayMode && (
                    <View style={styles.detailRow}>
                      <CalendarDays size={12} color={Colors.white} />
                      <Text style={styles.detailText}>
                        {formatEventDate(event.date)}
                      </Text>
                    </View>
                  )}

                  <View style={styles.detailRow}>
                    <Clock size={12} color={Colors.white} />
                    <Text style={styles.detailText}>
                      {formatTime(event.startTime)}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Users size={12} color={Colors.white} />
                    <Text style={styles.detailText}>
                      {event.availableSpots} espacios
                    </Text>
                  </View>
                  
                  {isTodayMode && event.location && (
                    <View style={styles.detailRow}>
                      <MapPin size={12} color={Colors.white} />
                      <Text style={styles.detailText} numberOfLines={1}>
                        {event.location}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Occupation indicator */}
                <View style={styles.occupationContainer}>
                  <View style={styles.occupationBar}>
                    <View 
                      style={[
                        styles.occupationFill,
                        { width: `${event.occupationRatio * 100}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.occupationText}>
                    {Math.round(event.occupationRatio * 100)}% ocupado
                  </Text>
                </View>

                <View style={styles.priceContainer}>
                  <Text style={styles.priceLabel}>Desde</Text>
                  <Text style={styles.price}>{formatPrice(event.price)}</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  headerContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  header: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
  },

  titleContainer: {
    zIndex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.95,
    marginTop: 2,
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  eventCard: {
    width: 200,
    height: 240,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  firstCard: {
    marginLeft: 0,
  },
  lastCard: {
    marginRight: 0,
  },
  cardGradient: {
    flex: 1,
    padding: 16,
    position: 'relative',
  },
  urgencyBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: Colors.gold,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 2,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },

  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
    marginTop: 0,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 12,
    lineHeight: 20,
  },
  eventDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: Colors.white,
    opacity: 0.95,
    fontWeight: '500',
  },
  occupationContainer: {
    marginTop: 12,
  },
  occupationBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  occupationFill: {
    height: '100%',
    backgroundColor: Colors.white,
    borderRadius: 2,
  },
  occupationText: {
    fontSize: 12,
    color: Colors.white,
    opacity: 0.9,
    marginTop: 4,
    fontWeight: '500',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 8,
  },
  priceLabel: {
    fontSize: 12,
    color: Colors.white,
    opacity: 0.9,
    fontWeight: '500',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
});