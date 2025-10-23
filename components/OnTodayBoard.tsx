import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, Users, MapPin, TrendingUp } from '@/components/SmartIcons';
import { Colors, Gradients } from '@/constants/colors';
import { CalendarEvent } from '@/types/user';
import { FloatingCard } from '@/components/FloatingCard';


interface OnTodayBoardProps {
  events: CalendarEvent[];
  onEventPress?: (event: CalendarEvent) => void;
}

export function OnTodayBoard({ events, onEventPress }: OnTodayBoardProps) {
  // Filter and sort events that are happening today or soon with low occupation
  const featuredEvents = useMemo(() => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    if (__DEV__) {
      console.log('OnTodayBoard: Filtering events');
      console.log('OnTodayBoard: Total events:', events.length);
      console.log('OnTodayBoard: Today string:', todayStr);
      console.log('OnTodayBoard: Current time:', now.toISOString());
    }
    
    // Get events happening today
    const upcomingEvents = events.filter(event => {
      if (__DEV__) {
        console.log('OnTodayBoard: Checking event:', event.title);
        console.log('OnTodayBoard: Event date:', event.date);
        console.log('OnTodayBoard: Event time:', event.startTime);
        console.log('OnTodayBoard: Event status:', event.status);
      }
      
      // Check if event is today and upcoming
      const isToday = event.date === todayStr;
      const isUpcoming = event.status === 'upcoming';
      
      // For demo purposes, show all today's upcoming events regardless of time
      // This ensures events are visible in testing
      if (isToday && isUpcoming) {
        return true;
      }
      
      // Also check if event time is in the future (more strict check)
      try {
        const [hours, minutes] = event.startTime.split(':').map(Number);
        const eventDate = new Date(event.date);
        eventDate.setHours(hours, minutes, 0, 0);
        
        const isInFuture = eventDate > now;
        if (__DEV__) {
          console.log('OnTodayBoard: Event datetime:', eventDate.toISOString(), 'isInFuture:', isInFuture);
        }
        
        return isToday && isUpcoming && isInFuture;
      } catch (error) {
        if (__DEV__) {
          console.log('OnTodayBoard: Error parsing date for event:', event.title, error);
        }
        // If we can't parse the date, show the event anyway for demo purposes
        return isToday && isUpcoming;
      }
    });
    
    if (__DEV__) {
      console.log('OnTodayBoard: Filtered upcoming events:', upcomingEvents.length);
    }

    // Calculate occupation ratio and sort by lowest occupation first
    const eventsWithOccupation = upcomingEvents.map(event => ({
      ...event,
      occupationRatio: event.currentParticipants / event.maxParticipants,
      availableSpots: event.maxParticipants - event.currentParticipants,
    }));

    // Sort by occupation ratio (lowest first) and then by time
    return eventsWithOccupation
      .sort((a, b) => {
        // Prioritize events with lower occupation
        if (a.occupationRatio !== b.occupationRatio) {
          return a.occupationRatio - b.occupationRatio;
        }
        // Then sort by time
        const timeA = new Date(a.date + ' ' + a.startTime).getTime();
        const timeB = new Date(b.date + ' ' + b.startTime).getTime();
        return timeA - timeB;
      })
      .slice(0, 5); // Show top 5 events
  }, [events]);

  if (__DEV__) {
    console.log('OnTodayBoard: Final featured events count:', featuredEvents.length);
  }
  
  if (featuredEvents.length === 0) {
    // Show a debug message when no events are found
    if (__DEV__) {
      console.log('OnTodayBoard: No featured events to display');
      console.log('OnTodayBoard: Total events received:', events.length);
      console.log('OnTodayBoard: Events data:', events);
    }
    return (
      <View style={styles.container}>
        <FloatingCard style={styles.headerContainer} intensity="subtle">
          <LinearGradient colors={Gradients.galaxy} style={styles.header}>
            <View style={styles.titleContainer}>
              <View style={styles.titleRow}>
                <TrendingUp size={20} color={Colors.gold} />
                <Text style={styles.title}>HOY EN VIVO</Text>
              </View>
              <Text style={styles.subtitle}>No hay eventos disponibles hoy</Text>
              {__DEV__ && (
                <Text style={[styles.subtitle, { fontSize: 12, marginTop: 4 }]}>
                  Debug: {events.length} eventos totales
                </Text>
              )}
            </View>
          </LinearGradient>
        </FloatingCard>
      </View>
    );
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <View style={styles.container}>
      <FloatingCard style={styles.headerContainer} intensity="subtle">
        <LinearGradient colors={Gradients.galaxy} style={styles.header}>

        
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <TrendingUp size={20} color={Colors.gold} />
            <Text style={styles.title}>HOY EN VIVO</Text>
          </View>
          <Text style={styles.subtitle}>Eventos con espacios disponibles</Text>
        </View>
        </LinearGradient>
      </FloatingCard>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {featuredEvents.map((event, index) => (
          <TouchableOpacity
            key={event.id}
            style={[
              styles.eventCard,
              index === 0 && styles.firstCard,
              index === featuredEvents.length - 1 && styles.lastCard,
            ]}
            onPress={() => onEventPress?.(event)}
            activeOpacity={0.8}
          >
            <LinearGradient 
              colors={event.occupationRatio < 0.3 ? Gradients.accent : Gradients.purpleGreen}
              style={styles.cardGradient}
            >
              {/* Urgency indicator for very low occupation */}
              {event.occupationRatio < 0.3 && (
                <View style={styles.urgencyBadge}>
                  <Text style={styles.urgencyText}>¡Últimos lugares!</Text>
                </View>
              )}



              <View style={styles.cardContent}>
                <Text style={styles.eventTitle} numberOfLines={2}>
                  {event.title}
                </Text>
                
                <View style={styles.eventDetails}>
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
                  
                  {event.location && (
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
                  <Text style={styles.price}>${event.price}</Text>
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
