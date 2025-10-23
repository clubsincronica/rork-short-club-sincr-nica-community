import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Clock, MapPin, ChevronRight, Package, CheckCircle } from '../components/SmartIcons';
import { Colors, Gradients } from '@/constants/colors';
import { useFoodCart } from '@/hooks/food-cart-store';
import { LinearGradient } from 'expo-linear-gradient';
import { ConstellationBackground } from '@/components/ConstellationBackground';
import { FoodOrder } from '@/types/user';

export default function OrderHistoryScreen() {
  const router = useRouter();
  const { orders } = useFoodCart();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'completed'>('all');

  const filteredOrders = orders.filter(order => {
    if (selectedFilter === 'active') {
      return order.status !== 'delivered' && order.status !== 'cancelled';
    }
    if (selectedFilter === 'completed') {
      return order.status === 'delivered' || order.status === 'cancelled';
    }
    return true;
  });

  const getStatusColor = (status: FoodOrder['status']) => {
    switch (status) {
      case 'confirmed':
      case 'preparing':
        return Colors.warning;
      case 'ready':
      case 'out-for-delivery':
        return Colors.info;
      case 'delivered':
        return Colors.success;
      case 'cancelled':
        return Colors.error;
      default:
        return Colors.textLight;
    }
  };

  const getStatusText = (status: FoodOrder['status']) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmado';
      case 'preparing':
        return 'Preparando';
      case 'ready':
        return 'Listo';
      case 'out-for-delivery':
        return 'En camino';
      case 'delivered':
        return 'Entregado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  return (
    <ConstellationBackground intensity="light">
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: 'Historial de Pedidos',
            headerStyle: {
              backgroundColor: Colors.white,
            },
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <ArrowLeft size={24} color={Colors.text} />
              </TouchableOpacity>
            ),
          }}
        />

        <LinearGradient colors={Gradients.darkToLight} style={styles.content}>
          {/* Filter Tabs */}
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[styles.filterTab, selectedFilter === 'all' && styles.filterTabActive]}
              onPress={() => setSelectedFilter('all')}
            >
              <Text style={[styles.filterTabText, selectedFilter === 'all' && styles.filterTabTextActive]}>
                Todos ({orders.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterTab, selectedFilter === 'active' && styles.filterTabActive]}
              onPress={() => setSelectedFilter('active')}
            >
              <Text style={[styles.filterTabText, selectedFilter === 'active' && styles.filterTabTextActive]}>
                Activos ({orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterTab, selectedFilter === 'completed' && styles.filterTabActive]}
              onPress={() => setSelectedFilter('completed')}
            >
              <Text style={[styles.filterTabText, selectedFilter === 'completed' && styles.filterTabTextActive]}>
                Completados ({orders.filter(o => o.status === 'delivered' || o.status === 'cancelled').length})
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {filteredOrders.length === 0 ? (
              <View style={styles.emptyState}>
                <Package size={64} color={Colors.textLight} />
                <Text style={styles.emptyTitle}>No hay pedidos</Text>
                <Text style={styles.emptyDescription}>
                  {selectedFilter === 'active' 
                    ? 'No tienes pedidos activos en este momento'
                    : selectedFilter === 'completed'
                    ? 'No tienes pedidos completados aún'
                    : 'Aún no has realizado ningún pedido'}
                </Text>
                <TouchableOpacity
                  style={styles.browseButton}
                  onPress={() => router.push('/(tabs)/food')}
                >
                  <Text style={styles.browseButtonText}>Explorar Restaurantes</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.ordersList}>
                {filteredOrders.map((order) => (
                  <TouchableOpacity
                    key={order.id}
                    style={styles.orderCard}
                    onPress={() => router.push(`/order-tracking/${order.id}`)}
                  >
                    <View style={styles.orderHeader}>
                      {order.provider.images && order.provider.images.length > 0 && (
                        <Image 
                          source={{ uri: order.provider.images[0] }} 
                          style={styles.providerImage}
                        />
                      )}
                      <View style={styles.orderInfo}>
                        <Text style={styles.providerName}>{order.provider.businessName}</Text>
                        <Text style={styles.orderNumber}>Pedido #{order.orderNumber}</Text>
                        <View style={styles.orderMeta}>
                          <Clock size={12} color={Colors.textLight} />
                          <Text style={styles.orderDate}>
                            {new Date(order.createdAt).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Text>
                        </View>
                      </View>
                      <ChevronRight size={20} color={Colors.textLight} />
                    </View>

                    <View style={styles.orderStatus}>
                      <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(order.status)}20` }]}>
                        {order.status === 'delivered' ? (
                          <CheckCircle size={14} color={getStatusColor(order.status)} />
                        ) : (
                          <Clock size={14} color={getStatusColor(order.status)} />
                        )}
                        <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                          {getStatusText(order.status)}
                        </Text>
                      </View>
                      {order.orderType === 'delivery' && (
                        <View style={styles.deliveryBadge}>
                          <MapPin size={12} color={Colors.textLight} />
                          <Text style={styles.deliveryText}>Delivery</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.orderSummary}>
                      <Text style={styles.itemsCount}>
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      </Text>
                      <Text style={styles.orderTotal}>€{order.total.toFixed(2)}</Text>
                    </View>

                    {order.status === 'delivered' && (
                      <TouchableOpacity style={styles.reorderButton}>
                        <Text style={styles.reorderButtonText}>Pedir de nuevo</Text>
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </LinearGradient>
      </View>
    </ConstellationBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: Colors.gold,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textLight,
  },
  filterTabTextActive: {
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
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
  ordersList: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  providerImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  orderInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  orderNumber: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 4,
  },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderDate: {
    fontSize: 12,
    color: Colors.textLight,
  },
  orderStatus: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.background,
    borderRadius: 12,
  },
  deliveryText: {
    fontSize: 12,
    color: Colors.textLight,
  },
  orderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  itemsCount: {
    fontSize: 14,
    color: Colors.textLight,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  reorderButton: {
    marginTop: 12,
    backgroundColor: Colors.gold,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  reorderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
});
