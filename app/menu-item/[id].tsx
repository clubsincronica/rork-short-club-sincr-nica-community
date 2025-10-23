import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Plus, Minus, Leaf, Flame, AlertCircle, Info } from '@/components/SmartIcons';
import { Colors } from '@/constants/colors';
import { mockMenuItems } from '@/mocks/menu-data';
import { mockFoodProviders } from '@/mocks/data';
import { useFoodCart } from '@/hooks/food-cart-store';
import { SelectedCustomization } from '@/types/user';

export default function MenuItemScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addToCart } = useFoodCart();
  
  const [quantity, setQuantity] = useState(1);
  const [selectedCustomizations, setSelectedCustomizations] = useState<Record<string, string[]>>({});
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [showNutritionalInfo, setShowNutritionalInfo] = useState(false);

  const menuItem = mockMenuItems.find(item => item.id === id);
  const provider = menuItem ? mockFoodProviders.find(p => p.id === menuItem.providerId) : null;

  const totalPrice = useMemo(() => {
    if (!menuItem) return 0;
    
    let price = menuItem.price;
    
    // Add customization prices
    if (menuItem.customizations) {
      menuItem.customizations.forEach(customization => {
        const selected = selectedCustomizations[customization.id] || [];
        selected.forEach(optionId => {
          const option = customization.options.find(o => o.id === optionId);
          if (option) {
            price += option.price;
          }
        });
      });
    }
    
    return price * quantity;
  }, [menuItem, selectedCustomizations, quantity]);

  const handleCustomizationChange = (customizationId: string, optionId: string, type: 'single' | 'multiple') => {
    setSelectedCustomizations(prev => {
      if (type === 'single') {
        return { ...prev, [customizationId]: [optionId] };
      } else {
        const current = prev[customizationId] || [];
        if (current.includes(optionId)) {
          return { ...prev, [customizationId]: current.filter(id => id !== optionId) };
        } else {
          return { ...prev, [customizationId]: [...current, optionId] };
        }
      }
    });
  };

  const handleAddToCart = () => {
    if (!menuItem || !provider) return;

    const customizations: SelectedCustomization[] = [];
    
    if (menuItem.customizations) {
      menuItem.customizations.forEach(customization => {
        const selected = selectedCustomizations[customization.id] || [];
        if (selected.length > 0) {
          let additionalPrice = 0;
          selected.forEach(optionId => {
            const option = customization.options.find(o => o.id === optionId);
            if (option) {
              additionalPrice += option.price;
            }
          });
          
          customizations.push({
            customizationId: customization.id,
            selectedOptions: selected,
            additionalPrice
          });
        }
      });
    }

    addToCart(menuItem, provider, quantity, customizations, specialInstructions);
    router.back();
  };

  if (!menuItem || !provider) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const getSpicyIndicator = () => {
    if (!menuItem.spicyLevel) return null;
    const flames = [];
    for (let i = 0; i < menuItem.spicyLevel; i++) {
      flames.push(
        <Flame key={i} size={16} color={Colors.error} fill={Colors.error} />
      );
    }
    return flames;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: menuItem.images[0] }} style={styles.image} />
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <X size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.name}>{menuItem.name}</Text>
          <Text style={styles.description}>{menuItem.description}</Text>

          {/* Badges */}
          <View style={styles.badges}>
            {menuItem.isVegan && (
              <View style={[styles.badge, styles.veganBadge]}>
                <Leaf size={12} color={Colors.white} />
                <Text style={styles.badgeText}>Vegano</Text>
              </View>
            )}
            {menuItem.isVegetarian && !menuItem.isVegan && (
              <View style={[styles.badge, styles.vegetarianBadge]}>
                <Leaf size={12} color={Colors.white} />
                <Text style={styles.badgeText}>Vegetariano</Text>
              </View>
            )}
            {menuItem.isGlutenFree && (
              <View style={[styles.badge, styles.glutenFreeBadge]}>
                <Text style={styles.badgeText}>Sin Gluten</Text>
              </View>
            )}
            {menuItem.isOrganic && (
              <View style={[styles.badge, styles.organicBadge]}>
                <Text style={styles.badgeText}>Orgánico</Text>
              </View>
            )}
            {menuItem.spicyLevel && (
              <View style={styles.spicyIndicator}>
                {getSpicyIndicator()}
              </View>
            )}
          </View>

          {/* Ingredients */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredientes</Text>
            <Text style={styles.ingredients}>
              {menuItem.ingredients.join(', ')}
            </Text>
          </View>

          {/* Allergens */}
          {menuItem.allergens.length > 0 && (
            <View style={styles.allergenSection}>
              <View style={styles.allergenHeader}>
                <AlertCircle size={16} color={Colors.warning} />
                <Text style={styles.allergenTitle}>Alérgenos</Text>
              </View>
              <Text style={styles.allergenText}>
                {menuItem.allergens.join(', ')}
              </Text>
            </View>
          )}

          {/* Nutritional Info */}
          {menuItem.nutritionalInfo && (
            <TouchableOpacity 
              style={styles.nutritionalToggle}
              onPress={() => setShowNutritionalInfo(!showNutritionalInfo)}
            >
              <Info size={16} color={Colors.primary} />
              <Text style={styles.nutritionalToggleText}>
                Información Nutricional
              </Text>
            </TouchableOpacity>
          )}

          {showNutritionalInfo && menuItem.nutritionalInfo && (
            <View style={styles.nutritionalInfo}>
              <View style={styles.nutritionalRow}>
                <Text style={styles.nutritionalLabel}>Calorías</Text>
                <Text style={styles.nutritionalValue}>{menuItem.nutritionalInfo.calories} kcal</Text>
              </View>
              <View style={styles.nutritionalRow}>
                <Text style={styles.nutritionalLabel}>Proteínas</Text>
                <Text style={styles.nutritionalValue}>{menuItem.nutritionalInfo.protein}g</Text>
              </View>
              <View style={styles.nutritionalRow}>
                <Text style={styles.nutritionalLabel}>Carbohidratos</Text>
                <Text style={styles.nutritionalValue}>{menuItem.nutritionalInfo.carbs}g</Text>
              </View>
              <View style={styles.nutritionalRow}>
                <Text style={styles.nutritionalLabel}>Grasas</Text>
                <Text style={styles.nutritionalValue}>{menuItem.nutritionalInfo.fat}g</Text>
              </View>
              {menuItem.nutritionalInfo.fiber && (
                <View style={styles.nutritionalRow}>
                  <Text style={styles.nutritionalLabel}>Fibra</Text>
                  <Text style={styles.nutritionalValue}>{menuItem.nutritionalInfo.fiber}g</Text>
                </View>
              )}
            </View>
          )}

          {/* Customizations */}
          {menuItem.customizations && menuItem.customizations.length > 0 && (
            <View style={styles.customizationsSection}>
              <Text style={styles.sectionTitle}>Personaliza tu pedido</Text>
              
              {menuItem.customizations.map(customization => (
                <View key={customization.id} style={styles.customization}>
                  <View style={styles.customizationHeader}>
                    <Text style={styles.customizationTitle}>
                      {customization.name}
                    </Text>
                    {customization.required && (
                      <Text style={styles.requiredText}>Requerido</Text>
                    )}
                  </View>
                  
                  {customization.options.map(option => {
                    const isSelected = (selectedCustomizations[customization.id] || []).includes(option.id);
                    
                    return (
                      <TouchableOpacity
                        key={option.id}
                        style={[
                          styles.option,
                          isSelected && styles.selectedOption
                        ]}
                        onPress={() => handleCustomizationChange(customization.id, option.id, customization.type)}
                      >
                        <View style={styles.optionContent}>
                          <View style={[
                            styles.optionRadio,
                            customization.type === 'multiple' && styles.optionCheckbox,
                            isSelected && styles.selectedRadio
                          ]}>
                            {isSelected && <View style={styles.radioInner} />}
                          </View>
                          <Text style={[
                            styles.optionName,
                            isSelected && styles.selectedOptionText
                          ]}>
                            {option.name}
                          </Text>
                        </View>
                        {option.price > 0 && (
                          <Text style={styles.optionPrice}>
                            +${option.price.toFixed(2)}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          )}

          {/* Special Instructions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instrucciones especiales</Text>
            <TouchableOpacity
              style={styles.instructionsInput}
              onPress={() => {/* Open text input modal */}}
            >
              <Text style={styles.instructionsPlaceholder}>
                {specialInstructions || 'Agregar nota (opcional)'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
          >
            <Minus size={20} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.quantity}>{quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => setQuantity(quantity + 1)}
          >
            <Plus size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={handleAddToCart}
        >
          <Text style={styles.addToCartText}>
            Agregar ${totalPrice.toFixed(2)}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    height: 250,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: Colors.textLight,
    lineHeight: 24,
    marginBottom: 16,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  veganBadge: {
    backgroundColor: '#4CAF50',
  },
  vegetarianBadge: {
    backgroundColor: '#8BC34A',
  },
  glutenFreeBadge: {
    backgroundColor: '#2196F3',
  },
  organicBadge: {
    backgroundColor: '#FF9800',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  spicyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  ingredients: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
  },
  allergenSection: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  allergenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  allergenTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.warning,
  },
  allergenText: {
    fontSize: 14,
    color: Colors.warning,
  },
  nutritionalToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    marginBottom: 8,
  },
  nutritionalToggleText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  nutritionalInfo: {
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  nutritionalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  nutritionalLabel: {
    fontSize: 14,
    color: Colors.textLight,
  },
  nutritionalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  customizationsSection: {
    marginBottom: 24,
  },
  customization: {
    marginBottom: 20,
  },
  customizationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customizationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  requiredText: {
    fontSize: 12,
    color: Colors.error,
    fontWeight: '500',
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedOption: {
    backgroundColor: '#FFF8E1',
    borderColor: Colors.gold,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionCheckbox: {
    borderRadius: 4,
  },
  selectedRadio: {
    borderColor: Colors.gold,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.gold,
  },
  optionName: {
    fontSize: 14,
    color: Colors.text,
  },
  selectedOptionText: {
    fontWeight: '600',
  },
  optionPrice: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  instructionsInput: {
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  instructionsPlaceholder: {
    fontSize: 14,
    color: Colors.textLight,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    minWidth: 20,
    textAlign: 'center',
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: Colors.gold,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  addToCartText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
});