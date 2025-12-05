import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { FloatingCard } from './FloatingCard';
import { Colors } from '@/constants/colors';
import { ProfilePriorityItem, ProfileCustomization } from '@/types/user';

interface ProfilePriorityBoardProps {
  items: ProfilePriorityItem[];
  customization: ProfileCustomization;
  isEditing?: boolean;
  isOwnProfile?: boolean;
  onEditItem?: (item: ProfilePriorityItem) => void;
  onDeleteItem?: (itemId: string) => void;
  onItemPress?: (item: ProfilePriorityItem) => void;
  onAddItem?: () => void;
}

export function ProfilePriorityBoard({ 
  items, 
  customization, 
  isEditing = false, 
  isOwnProfile = false, 
  onEditItem, 
  onDeleteItem, 
  onItemPress 
}: ProfilePriorityBoardProps) {
  console.log('ProfilePriorityBoard: Received items:', items.length);
  console.log('ProfilePriorityBoard: Edit mode:', isEditing, 'Own profile:', isOwnProfile);
  console.log('ProfilePriorityBoard: onEditItem function provided:', !!onEditItem);
  console.log('🔍 ProfilePriorityBoard: Item details:', items.map(item => ({
    id: item.id,
    type: item.type,
    title: item.title,
    providerId: 'N/A' // Remove the metadata access that's causing compile error
  })));
  
  // Sort items chronologically - events by upcoming dates first
  const sortedItems = [...items].sort((a, b) => {
    if (a.type === 'event' && b.type !== 'event') return -1;
    if (b.type === 'event' && a.type !== 'event') return 1;
    
    if (a.type === 'event' && b.type === 'event') {
      const aDate = new Date(a.metadata?.date || '9999-12-31');
      const bDate = new Date(b.metadata?.date || '9999-12-31');
      return aDate.getTime() - bDate.getTime();
    }
    
    return 0;
  });
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mi Tablero</Text>
        <Text style={styles.subtitle}>{String(sortedItems.length)} elementos</Text>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.itemsContainer}
        contentContainerStyle={styles.itemsContent}
      >
        {sortedItems.map((item) => {
          // Ensure all values are safe for rendering
          const safeTitle = item.title ? String(item.title) : 'Sin título';
          const safeDescription = item.description ? String(item.description) : 'Sin descripción';
          const safeType = item.type ? String(item.type) : 'tipo desconocido';
          const safePrice = item.price ? String(item.price) : null;
          const safeDate = item.metadata?.date ? String(item.metadata.date) : null;
          
          const handlePress = () => {
            if (isEditing && isOwnProfile && onEditItem) {
              console.log('ProfilePriorityBoard: Edit mode - navigating to edit for:', safeTitle);
              onEditItem(item);
            } else if (onItemPress) {
              console.log('ProfilePriorityBoard: Regular mode - handling press for:', safeTitle);
              onItemPress(item);
            }
          };

          return (
            <TouchableOpacity 
              key={item.id} 
              style={styles.item}
              onPress={handlePress}
              activeOpacity={0.9}
            >
              <View style={styles.cardContent}>
                <Text style={styles.itemTitle}>{safeTitle}</Text>
                <Text style={styles.itemDescription}>{safeDescription}</Text>
                {safeDate && (
                  <Text style={styles.itemDate}>📅 {safeDate}</Text>
                )}
                <Text style={styles.itemType}>{safeType}</Text>
                {safePrice && (
                  <Text style={styles.itemPrice}>${safePrice}</Text>
                )}
                {isEditing && isOwnProfile && (
                  <Text style={styles.editHint}>✏️ Toca para editar</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  header: { paddingHorizontal: 20, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: Colors.textLight },
  itemsContainer: { 
    paddingLeft: 20, 
    paddingVertical: 24, 
    minHeight: 480,
    height: 500
  },
  itemsContent: { paddingRight: 20 },
  item: { 
    width: 300, 
    height: 450, 
    marginRight: 16,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5
  },
  cardContent: { 
    padding: 20, 
    flex: 1, 
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    minHeight: 400,
    backgroundColor: 'transparent'
  },
  itemTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: Colors.text, 
    marginBottom: 12,
    lineHeight: 24
  },
  itemDescription: { 
    fontSize: 14, 
    color: Colors.textLight, 
    marginBottom: 12,
    lineHeight: 20,
    flexWrap: 'wrap'
  },
  itemType: { 
    fontSize: 12, 
    color: Colors.primary, 
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'capitalize'
  },
  itemDate: { 
    fontSize: 12, 
    color: Colors.success, 
    marginBottom: 8, 
    fontWeight: '500' 
  },
  itemPrice: { 
    fontSize: 16, 
    color: Colors.primary, 
    fontWeight: '700', 
    marginTop: 'auto'
  },
  editHint: {
    fontSize: 12,
    color: Colors.goldDark,
    fontWeight: '500',
    marginTop: 8,
    fontStyle: 'italic',
    textAlign: 'center'
  },
});
