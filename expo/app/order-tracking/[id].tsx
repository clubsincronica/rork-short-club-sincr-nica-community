import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Package, Clock, MapPin, Phone, MessageCircle, CheckCircle } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useFoodCart } from '@/hooks/food-cart-store';
import { FoodOrder } from '@/types/user';

export default function OrderTrackingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { orders } = useFoodCart();
  const [order, setOrder] = useState<FoodOrder | null>(null);

  useEffect(() => {
    const foundOrder = orders.find(o => o.id === id);
    if (foundOrder) {
      setOrder(foundOrder);
    }
  }, [id, orders]);

  const handleBack = () => {
    router.back();
  };

  if (!order) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: 'Seguimiento de Pedido',
            headerLeft: () => (
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <ArrowLeft size={24} color={Colors.text} />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Pedido no encontrado</Text>
        </View>
      </View>
    );
  }

  const getStatusStep = () => {
    const statuses = ['confirmed', 'preparing', 'ready', 'out-for-delivery', 'delivered'];
    const currentIndex = statuses.indexOf(order.status);
    return currentIndex >= 0 ? currentIndex + 1 : 0;
  };

  const statusStep = getStatusStep();

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: `Pedido #${order.orderNumber}`,
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ArrowLeft size={24} color={Colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.scrollView}>
        {/* Status Timeline */}
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>Estado del Pedido</Text>
          
          <View style={styles.timeline}>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, statusStep >= 1 && styles.timelineDotActive]}>
                {statusStep >= 1 && <CheckCircle size={16} color={Colors.white} />}
              </View>
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, statusStep >= 1 && styles.timelineTitleActive]}>
                  Pedido Confirmado
                </Text>
                <Text style={styles.timelineTime}>
                  {order.status === 'confirmed' && 'Ahora'}
                </Text>
              </View>
            </View>

            <View style={[styles.timelineLine, statusStep >= 2 && styles.timelineLineActive]} />

            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, statusStep >= 2 && styles.timelineDotActive]}>
                {statusStep >= 2 && <CheckCircle size={16} color={Colors.white} />}
              </View>
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, statusStep >= 2 && styles.timelineTitleActive]}>
                  Preparando
                </Text>
                <Text style={styles.timelineTime}>
                  {order.status === 'preparing' && 'En proceso'}
                </Text>
              </View>
            </View>

            <View style={[styles.timelineLine, statusStep >= 3 && styles.timelineLineActive]} />

            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, statusStep >= 3 && styles.timelineDotActive]}>
                {statusStep >= 3 && <CheckCircle size={16} color={Colors.white} />}
              </View>
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, statusStep >= 3 && styles.timelineTitleActive]}>
                  Listo para Entrega
                </Text>
                <Text style={styles.timelineTime}>
                  {order.status === 'ready' && 'Listo'}
                </Text>
              </View>
            </View>

            {order.orderType === 'delivery' && (
              <>
                <View style={[styles.timelineLine, statusStep >= 4 && styles.timelineLineActive]} />
                
                <View style={styles.timelineItem}>
                  <View style={[styles.timelineDot, statusStep >= 4 && styles.timelineDotActive]}>
                    {statusStep >= 4 && <CheckCircle size={16} color={Colors.white} />}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={[styles.timelineTitle, statusStep >= 4 && styles.timelineTitleActive]}>
                      En Camino
                    </Text>
                    <Text style={styles.timelineTime}>
                      {order.status === 'out-for-delivery' && 'En camino'}
                    </Text>
                  </View>
                </View>
              </>
            )}

            <View style={[styles.timelineLine, statusStep >= 5 && styles.timelineLineActive]} />

            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, statusStep >= 5 && styles.timelineDotActive]}>
                {statusStep >= 5 && <CheckCircle size={16} color={Colors.white} />}
              </View>
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, statusStep >= 5 && styles.timelineTitleActive]}>
                  Entregado
                </Text>
                <Text style={styles.timelineTime}>
                  {order.status === 'delivered' && 'Completado'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Estimated Time */}
        {order.status !== 'delivered' && order.status !== 'cancelled' && (
          <View style={styles.estimatedTimeCard}>
            <Clock size={24} color={Colors.primary} />
            <View style={styles.estimatedTimeContent}>
              <Text style={styles.estimatedTimeLabel}>Tiempo estimado</Text>
              <Text style={styles.estimatedTimeValue}>30-45 min</Text>
            </View>
          </View>
        )}

        {/* Delivery Info */}
        {order.orderType === 'delivery' && order.deliveryAddress && (
          <View style={styles.deliveryCard}>
            <View style={styles.deliveryHeader}>
              <MapPin size={20} color={Colors.primary} />
              <Text style={styles.deliveryTitle}>Dirección de Entrega</Text>
            </View>
            <Text style={styles.deliveryAddress}>{order.deliveryAddress}</Text>
            {order.deliveryInstructions && (
              <Text style={styles.deliveryInstructions}>
                Instrucciones: {order.deliveryInstructions}
              </Text>
            )}
          </View>
        )}

        {/* Order Details */}
        <View style={styles.orderDetailsCard}>
          <Text style={styles.cardTitle}>Detalles del Pedido</Text>
          
          {order.items.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <View style={styles.orderItemInfo}>
                <Text style={styles.orderItemQuantity}>{item.quantity}x</Text>
                <View style={styles.orderItemDetails}>
                  <Text style={styles.orderItemName}>{item.menuItem.name}</Text>
                  {item.customizations.length > 0 && (
                    <Text style={styles.orderItemCustomizations}>
                      {item.customizations.map(c => c.selectedOptions.join(', ')).join(' • ')}
                    </Text>
                  )}
                </View>
              </View>
              <Text style={styles.orderItemPrice}>€{item.totalPrice.toFixed(2)}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>€{order.subtotal.toFixed(2)}</Text>
          </View>
          {order.orderType === 'delivery' && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Envío</Text>
              <Text style={styles.totalValue}>€{order.deliveryFee.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Impuestos</Text>
            <Text style={styles.totalValue}>€{order.tax.toFixed(2)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>€{order.total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Contact Options */}
        <View style={styles.contactSection}>
          <TouchableOpacity style={styles.contactButton}>
            <Phone size={20} color={Colors.primary} />
            <Text style={styles.contactButtonText}>Llamar al Restaurante</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactButton}>
            <MessageCircle size={20} color={Colors.primary} />
            <Text style={styles.contactButtonText}>Enviar Mensaje</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textLight,
  },
  statusSection: {
    backgroundColor: Colors.white,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 20,
  },
  timeline: {
    paddingLeft: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  timelineDotActive: {
    backgroundColor: Colors.success,
  },
  timelineLine: {
    width: 2,
    height: 40,
    backgroundColor: Colors.border,
    marginLeft: 15,
    marginVertical: 4,
  },
  timelineLineActive: {
    backgroundColor: Colors.success,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textLight,
    marginBottom: 4,
  },
  timelineTitleActive: {
    color: Colors.text,
    fontWeight: '600',
  },
  timelineTime: {
    fontSize: 12,
    color: Colors.success,
  },
  estimatedTimeCard: {
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  estimatedTimeContent: {
    marginLeft: 12,
  },
  estimatedTimeLabel: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 4,
  },
  estimatedTimeValue: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  deliveryCard: {
    backgroundColor: Colors.white,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deliveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deliveryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 8,
  },
  deliveryAddress: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 8,
  },
  deliveryInstructions: {
    fontSize: 14,
    color: Colors.textLight,
    fontStyle: 'italic',
  },
  orderDetailsCard: {
    backgroundColor: Colors.white,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderItemInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  orderItemQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginRight: 8,
  },
  orderItemDetails: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 2,
  },
  orderItemCustomizations: {
    fontSize: 12,
    color: Colors.textLight,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: Colors.textLight,
  },
  totalValue: {
    fontSize: 14,
    color: Colors.text,
  },
  grandTotal: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  contactSection: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
});