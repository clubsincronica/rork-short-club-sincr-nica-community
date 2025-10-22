import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Trash2, Plus, Minus, ShoppingBag, Truck, MapPin, Clock } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useFoodCart } from '@/hooks/food-cart-store';

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { 
    cart, 
    cartTotal, 
    removeFromCart, 
    updateQuantity, 
    clearCart,
    setOrderType,
    setDeliveryInfo
  } = useFoodCart();

  if (!cart || cart.items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ShoppingBag size={64} color={Colors.textLight} />
        <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
        <Text style={styles.emptyDescription}>
          Agrega deliciosos platillos de nuestros restaurantes
        </Text>
        <TouchableOpacity
          style={styles.browseButton}
          onPress={() => router.back()}
        >
          <Text style={styles.browseButtonText}>Explorar Restaurantes</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const deliveryFee = cart.orderType === 'delivery' ? 3.50 : 0;
  const tax = cartTotal * 0.10;
  const total = cartTotal + deliveryFee + tax;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Restaurant Info */}
        <View style={styles.restaurantSection}>
          {cart.provider.images && cart.provider.images.length > 0 && (
            <Image 
              source={{ uri: cart.provider.images[0] }} 
              style={styles.restaurantImage}
            />
          )}
          <View style={styles.restaurantInfo}>
            <Text style={styles.restaurantName}>{cart.provider.businessName}</Text>
            <View style={styles.restaurantMeta}>
              <MapPin size={12} color={Colors.textLight} />
              <Text style={styles.restaurantLocation}>{cart.provider.location || 'Ubicación no especificada'}</Text>
            </View>
            <View style={styles.restaurantMeta}>
              <Clock size={12} color={Colors.textLight} />
              <Text style={styles.deliveryTime}>20-30 min</Text>
            </View>
          </View>
        </View>

        {/* Order Type Selection */}
        <View style={styles.orderTypeSection}>
          <Text style={styles.sectionTitle}>Tipo de pedido</Text>
          <View style={styles.orderTypeButtons}>
            <TouchableOpacity
              style={[
                styles.orderTypeButton,
                cart.orderType === 'delivery' && styles.selectedOrderType
              ]}
              onPress={() => setOrderType('delivery')}
            >
              <Truck size={20} color={cart.orderType === 'delivery' ? Colors.gold : Colors.textLight} />
              <Text style={[
                styles.orderTypeText,
                cart.orderType === 'delivery' && styles.selectedOrderTypeText
              ]}>
                Delivery
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.orderTypeButton,
                cart.orderType === 'pickup' && styles.selectedOrderType
              ]}
              onPress={() => setOrderType('pickup')}
            >
              <ShoppingBag size={20} color={cart.orderType === 'pickup' ? Colors.gold : Colors.textLight} />
              <Text style={[
                styles.orderTypeText,
                cart.orderType === 'pickup' && styles.selectedOrderTypeText
              ]}>
                Pickup
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Delivery Address */}
        {cart.orderType === 'delivery' && (
          <View style={styles.addressSection}>
            <Text style={styles.sectionTitle}>Dirección de entrega</Text>
            <TouchableOpacity
              style={styles.addressInput}
              onPress={() => {
                // Open address input modal
                setDeliveryInfo('Calle Principal 123, Ciudad', 'Apartamento 4B');
              }}
            >
              <MapPin size={16} color={Colors.textLight} />
              <Text style={styles.addressText}>
                {cart.deliveryAddress || 'Agregar dirección de entrega'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Cart Items */}
        <View style={styles.itemsSection}>
          <View style={styles.itemsHeader}>
            <Text style={styles.sectionTitle}>Tu pedido</Text>
            <TouchableOpacity onPress={clearCart}>
              <Text style={styles.clearText}>Limpiar</Text>
            </TouchableOpacity>
          </View>

          {cart.items.map((item, index) => (
            <View key={index} style={styles.cartItem}>
              <Image 
                source={{ uri: item.menuItem.images[0] }} 
                style={styles.itemImage}
              />
              
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.menuItem.name}
                </Text>
                
                {item.customizations.length > 0 && (
                  <Text style={styles.itemCustomizations} numberOfLines={2}>
                    {item.customizations.map(c => {
                      const customization = item.menuItem.customizations?.find(mc => mc.id === c.customizationId);
                      const options = c.selectedOptions.map(optId => {
                        const option = customization?.options.find(o => o.id === optId);
                        return option?.name;
                      }).filter(Boolean);
                      return options.join(', ');
                    }).join(' • ')}
                  </Text>
                )}
                
                {item.specialInstructions && (
                  <Text style={styles.itemInstructions} numberOfLines={1}>
                    Nota: {item.specialInstructions}
                  </Text>
                )}
                
                <View style={styles.itemFooter}>
                  <Text style={styles.itemPrice}>
                    ${item.price.toFixed(2)}
                  </Text>
                  
                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(index, item.quantity - 1)}
                    >
                      <Minus size={16} color={Colors.text} />
                    </TouchableOpacity>
                    
                    <Text style={styles.quantity}>{item.quantity}</Text>
                    
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(index, item.quantity + 1)}
                    >
                      <Plus size={16} color={Colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeFromCart(index)}
              >
                <Trash2 size={18} color={Colors.error} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Order Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Resumen</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${cartTotal.toFixed(2)}</Text>
          </View>
          
          {cart.orderType === 'delivery' && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Envío</Text>
              <Text style={styles.summaryValue}>${deliveryFee.toFixed(2)}</Text>
            </View>
          )}
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Impuestos (10%)</Text>
            <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
          </View>
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Checkout Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={() => router.push('/checkout')}
        >
          <Text style={styles.checkoutButtonText}>
            Proceder al pago • ${total.toFixed(2)}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  restaurantSection: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    padding: 16,
    marginBottom: 8,
  },
  restaurantImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  restaurantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  restaurantLocation: {
    fontSize: 12,
    color: Colors.textLight,
  },
  deliveryTime: {
    fontSize: 12,
    color: Colors.textLight,
  },
  orderTypeSection: {
    backgroundColor: Colors.white,
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  orderTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  orderTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  selectedOrderType: {
    borderColor: Colors.gold,
    backgroundColor: '#FFF8E1',
  },
  orderTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textLight,
  },
  selectedOrderTypeText: {
    color: Colors.text,
  },
  addressSection: {
    backgroundColor: Colors.white,
    padding: 16,
    marginBottom: 8,
  },
  addressInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  itemsSection: {
    backgroundColor: Colors.white,
    padding: 16,
    marginBottom: 8,
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearText: {
    fontSize: 14,
    color: Colors.error,
    fontWeight: '600',
  },
  cartItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  itemCustomizations: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 2,
  },
  itemInstructions: {
    fontSize: 12,
    color: Colors.textLight,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: Colors.background,
  },
  quantity: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    minWidth: 20,
    textAlign: 'center',
  },
  removeButton: {
    padding: 8,
  },
  summarySection: {
    backgroundColor: Colors.white,
    padding: 16,
    marginBottom: 100,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textLight,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  checkoutButton: {
    backgroundColor: Colors.gold,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
});