import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CheckCircle, Zap, Shield, Smartphone, Globe, Heart } from 'lucide-react-native';
import { AccessibleText, Heading } from './AccessibleText';
import { TouchableScale } from './TouchableScale';
import { FadeInView, SlideInView } from './AnimatedViews';
import { Colors } from '@/constants/colors';

interface ReadinessIndicatorProps {
  title: string;
  description: string;
  icon: any;
  status: 'complete' | 'optimized' | 'enhanced';
  delay?: number;
}

function ReadinessIndicator({ title, description, icon: Icon, status, delay = 0 }: ReadinessIndicatorProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'complete': return Colors.success;
      case 'optimized': return Colors.primary;
      case 'enhanced': return Colors.gold;
      default: return Colors.textLight;
    }
  };

  return (
    <SlideInView delay={delay} style={styles.indicatorContainer}>
      <TouchableScale style={styles.indicator}>
        <View style={[styles.iconContainer, { backgroundColor: getStatusColor() + '20' }]}>
          <Icon size={24} color={getStatusColor()} />
        </View>
        <View style={styles.indicatorContent}>
          <Heading level={3} style={styles.indicatorTitle}>{title}</Heading>
          <AccessibleText style={styles.indicatorDescription}>{description}</AccessibleText>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <CheckCircle size={16} color={Colors.white} />
        </View>
      </TouchableScale>
    </SlideInView>
  );
}

export function AppReadinessShowcase() {
  const readinessItems = [
    {
      title: 'Rendimiento Optimizado',
      description: 'Animaciones fluidas, carga rápida y experiencia sin interrupciones',
      icon: Zap,
      status: 'optimized' as const,
    },
    {
      title: 'Accesibilidad Completa',
      description: 'Soporte para lectores de pantalla y navegación por teclado',
      icon: Shield,
      status: 'complete' as const,
    },
    {
      title: 'Diseño Responsivo',
      description: 'Experiencia perfecta en móviles, tablets y web',
      icon: Smartphone,
      status: 'enhanced' as const,
    },
    {
      title: 'Compatibilidad Web',
      description: 'Funciona perfectamente en React Native Web',
      icon: Globe,
      status: 'complete' as const,
    },
    {
      title: 'UX Profesional',
      description: 'Micro-interacciones, feedback háptico y transiciones suaves',
      icon: Heart,
      status: 'enhanced' as const,
    },
  ];

  return (
    <View style={styles.container}>
      <FadeInView style={styles.header}>
        <Heading level={1} style={styles.title}>
          🚀 App Lista para Producción
        </Heading>
        <AccessibleText style={styles.subtitle}>
          Tu aplicación Club Sincrónica está completamente optimizada y lista para ser publicada
        </AccessibleText>
      </FadeInView>

      <View style={styles.indicatorsList}>
        {readinessItems.map((item, index) => (
          <ReadinessIndicator
            key={item.title}
            {...item}
            delay={index * 100}
          />
        ))}
      </View>

      <FadeInView delay={600} style={styles.footer}>
        <AccessibleText style={styles.footerText}>
          ✨ Todas las funcionalidades han sido pulidas con atención al detalle
        </AccessibleText>
      </FadeInView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
  },
  indicatorsList: {
    flex: 1,
    gap: 16,
  },
  indicatorContainer: {
    marginBottom: 8,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  indicatorContent: {
    flex: 1,
  },
  indicatorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  indicatorDescription: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});