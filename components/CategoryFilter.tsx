import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Heart, Brain, Focus, Dumbbell, Zap, Apple, MessageCircle, Sparkles } from './TempIcons';
import { ServiceCategory } from '@/types/user';
import { Colors } from '@/constants/colors';

interface CategoryFilterProps {
  selectedCategory: ServiceCategory | 'all';
  onCategoryChange: (category: ServiceCategory | 'all') => void;
}

const categories = [
  { key: 'all' as const, label: 'Todos', icon: Sparkles },
  { key: 'healing' as ServiceCategory, label: 'Sanación', icon: Heart },
  { key: 'coaching' as ServiceCategory, label: 'Coaching', icon: Brain },
  { key: 'meditation' as ServiceCategory, label: 'Meditación', icon: Focus },
  { key: 'yoga' as ServiceCategory, label: 'Yoga', icon: Dumbbell },
  { key: 'energy-work' as ServiceCategory, label: 'Trabajo Energético', icon: Zap },
  { key: 'nutrition' as ServiceCategory, label: 'Nutrición', icon: Apple },
  { key: 'therapy' as ServiceCategory, label: 'Terapia', icon: MessageCircle },
  { key: 'spiritual-guidance' as ServiceCategory, label: 'Espiritual', icon: Sparkles },
];

export function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((category) => {
          const isSelected = selectedCategory === category.key;
          const IconComponent = category.icon;
          
          return (
            <TouchableOpacity
              key={category.key}
              style={[styles.categoryButton, isSelected && styles.selectedCategory]}
              onPress={() => onCategoryChange(category.key)}
              testID={`category-${category.key}`}
            >
              <IconComponent 
                size={20} 
                color={isSelected ? Colors.textOnGold : Colors.text} 
              />
              <Text style={[styles.categoryText, isSelected && styles.selectedText]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    gap: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedCategory: {
    backgroundColor: Colors.gold,
    borderColor: Colors.goldDark,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  selectedText: {
    color: Colors.textOnGold,
    fontWeight: '700',
  },
});
