import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Plus, Edit2, Trash2, Eye, DollarSign, Package, TrendingUp, Clock, Star } from 'lucide-react-native';
import { Colors, Gradients } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { ConstellationBackground } from '@/components/ConstellationBackground';
import { useVendorStore } from '@/hooks/vendor-store';

export default function VendorDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { vendorData, stats, activeOrders } = useVendorStore();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'menu' | 'orders' | 'analytics'>('overview');

  const handleBack = () => {
    router.back();
  };

  const renderOverview = () => (
    <View style={styles.overviewContainer}>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <DollarSign size={24} color={Colors.gold} />
          <Text style={styles.statValue}>€{stats.todayRevenue.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Ingresos Hoy</Text>
        </View>
        <View style={styles.statCard}>
          <Package size={24} color={Colors.primary} />
          <Text style={styles.statValue}>{stats.todayOrders}</Text>
          <Text style={styles.statLabel}>Pedidos Hoy</Text>
        </View>
        <View style={styles.statCard}>
          <TrendingUp size={24} color={Colors.success} />
          <Text style={styles.statValue}>+{stats.growthPercentage}%</Text>
          <Text style={styles.statLabel}>Crecimiento</Text>
        </View>
        <View style={styles.statCard}>
          <Star size={24} color={Colors.gold} />
          <Text style={styles.statValue}>{stats.averageRating}</Text>
          <Text style={styles.statLabel}>Calificación</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pedidos Activos</Text>
        {activeOrders.map((order) => (
          <TouchableOpacity 
            key={order.id} 
            style={styles.orderCard}
            onPress={() => router.push(`/vendor-order/${order.id}`)}
          >
            <View style={styles.orderHeader}>
              <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                <Text style={styles.statusText}>{getStatusLabel(order.status)}</Text>
              </View>
            </View>
            <Text style={styles.orderCustomer}>{order.user.name}</Text>
            <Text style={styles.orderTotal}>€{order.total.toFixed(2)}</Text>
            <View style={styles.orderTime}>
              <Clock size={14} color={Colors.textLight} />
              <Text style={styles.orderTimeText}>
                {new Date(order.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderMenu = () => (
    <View style={styles.menuContainer}>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => router.push('/vendor-add-item')}
      >
        <Plus size={20} color={Colors.white} />
        <Text style={styles.addButtonText}>Agregar Plato</Text>
      </TouchableOpacity>

      <ScrollView style={styles.menuList}>
        {vendorData?.menuItems.map((item) => (
          <View key={item.id} style={styles.menuItem}>
            <View style={styles.menuItemInfo}>
              <Text style={styles.menuItemName}>{item.name}</Text>
              <Text style={styles.menuItemDescription}>{item.description}</Text>
              <Text style={styles.menuItemPrice}>€{item.price.toFixed(2)}</Text>
            </View>
            <View style={styles.menuItemActions}>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => router.push(`/vendor-edit-item/${item.id}`)}
              >
                <Edit2 size={18} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => {
                  Alert.alert(
                    'Eliminar Plato',
                    '¿Estás seguro de que quieres eliminar este plato?',
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Eliminar', style: 'destructive', onPress: () => {} }
                    ]
                  );
                }}
              >
                <Trash2 size={18} color={Colors.error} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Eye size={18} color={item.isAvailable ? Colors.success : Colors.textLight} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderOrders = () => (
    <View style={styles.ordersContainer}>
      <View style={styles.orderFilters}>
        <TouchableOpacity style={[styles.filterButton, styles.activeFilter]}>
          <Text style={styles.activeFilterText}>Activos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterText}>Completados</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterText}>Cancelados</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.ordersList}>
        {activeOrders.map((order) => (
          <TouchableOpacity 
            key={order.id} 
            style={styles.orderDetailCard}
            onPress={() => router.push(`/vendor-order/${order.id}`)}
          >
            <View style={styles.orderDetailHeader}>
              <View>
                <Text style={styles.orderNumber}>Pedido #{order.orderNumber}</Text>
                <Text style={styles.orderCustomer}>{order.user.name}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                <Text style={styles.statusText}>{getStatusLabel(order.status)}</Text>
              </View>
            </View>
            
            <View style={styles.orderItems}>
              {order.items.slice(0, 2).map((item, index) => (
                <Text key={index} style={styles.orderItemText}>
                  {item.quantity}x {item.menuItem.name}
                </Text>
              ))}
              {order.items.length > 2 && (
                <Text style={styles.orderItemMore}>+{order.items.length - 2} más</Text>
              )}
            </View>

            <View style={styles.orderFooter}>
              <Text style={styles.orderTotal}>€{order.total.toFixed(2)}</Text>
              <Text style={styles.orderTime}>
                {new Date(order.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderAnalytics = () => (
    <View style={styles.analyticsContainer}>
      <View style={styles.periodSelector}>
        <TouchableOpacity style={[styles.periodButton, styles.activePeriod]}>
          <Text style={styles.activePeriodText}>Hoy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.periodButton}>
          <Text style={styles.periodText}>Semana</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.periodButton}>
          <Text style={styles.periodText}>Mes</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.analyticsStats}>
        <View style={styles.analyticCard}>
          <Text style={styles.analyticLabel}>Ingresos Totales</Text>
          <Text style={styles.analyticValue}>€{stats.monthRevenue.toFixed(2)}</Text>
          <Text style={styles.analyticChange}>+12% vs mes anterior</Text>
        </View>
        <View style={styles.analyticCard}>
          <Text style={styles.analyticLabel}>Pedidos Totales</Text>
          <Text style={styles.analyticValue}>{stats.monthOrders}</Text>
          <Text style={styles.analyticChange}>+8% vs mes anterior</Text>
        </View>
        <View style={styles.analyticCard}>
          <Text style={styles.analyticLabel}>Ticket Promedio</Text>
          <Text style={styles.analyticValue}>€{(stats.monthRevenue / stats.monthOrders).toFixed(2)}</Text>
          <Text style={styles.analyticChange}>+5% vs mes anterior</Text>
        </View>
      </View>

      <View style={styles.topItems}>
        <Text style={styles.sectionTitle}>Platos Más Vendidos</Text>
        {stats.topItems.map((item, index) => (
          <View key={item.id} style={styles.topItem}>
            <Text style={styles.topItemRank}>#{index + 1}</Text>
            <View style={styles.topItemInfo}>
              <Text style={styles.topItemName}>{item.name}</Text>
              <Text style={styles.topItemSales}>{item.sales} vendidos</Text>
            </View>
            <Text style={styles.topItemRevenue}>€{item.revenue.toFixed(2)}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <ConstellationBackground intensity="light">
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTransparent: true,
            headerTitle: 'Panel de Vendedor',
            headerLeft: () => (
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <ArrowLeft size={24} color={Colors.text} />
              </TouchableOpacity>
            ),
          }}
        />
        
        <LinearGradient colors={Gradients.darkToLight} style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.businessName}>{vendorData?.businessName}</Text>
            <Text style={styles.businessCategory}>{vendorData?.category}</Text>
          </View>

          <View style={styles.tabs}>
            <TouchableOpacity 
              style={[styles.tab, selectedTab === 'overview' && styles.activeTab]}
              onPress={() => setSelectedTab('overview')}
            >
              <Text style={[styles.tabText, selectedTab === 'overview' && styles.activeTabText]}>General</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, selectedTab === 'menu' && styles.activeTab]}
              onPress={() => setSelectedTab('menu')}
            >
              <Text style={[styles.tabText, selectedTab === 'menu' && styles.activeTabText]}>Menú</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, selectedTab === 'orders' && styles.activeTab]}
              onPress={() => setSelectedTab('orders')}
            >
              <Text style={[styles.tabText, selectedTab === 'orders' && styles.activeTabText]}>Pedidos</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, selectedTab === 'analytics' && styles.activeTab]}
              onPress={() => setSelectedTab('analytics')}
            >
              <Text style={[styles.tabText, selectedTab === 'analytics' && styles.activeTabText]}>Análisis</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            {selectedTab === 'overview' && renderOverview()}
            {selectedTab === 'menu' && renderMenu()}
            {selectedTab === 'orders' && renderOrders()}
            {selectedTab === 'analytics' && renderAnalytics()}
          </ScrollView>
        </LinearGradient>
      </View>
    </ConstellationBackground>
  );
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'pending': Colors.warning,
    'confirmed': Colors.primary,
    'preparing': Colors.primary,
    'ready': Colors.success,
    'delivered': Colors.success,
    'cancelled': Colors.error
  };
  return colors[status] || Colors.textLight;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'pending': 'Pendiente',
    'confirmed': 'Confirmado',
    'preparing': 'Preparando',
    'ready': 'Listo',
    'delivered': 'Entregado',
    'cancelled': 'Cancelado'
  };
  return labels[status] || status;
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
    paddingTop: 100,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  businessName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  businessCategory: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.8,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.gold,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    opacity: 0.7,
  },
  activeTabText: {
    opacity: 1,
    color: Colors.gold,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  overviewContainer: {
    paddingBottom: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 12,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  orderCustomer: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 4,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  orderTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderTimeText: {
    fontSize: 12,
    color: Colors.textLight,
  },
  menuContainer: {
    paddingBottom: 40,
  },
  addButton: {
    backgroundColor: Colors.gold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  menuList: {
    flex: 1,
  },
  menuItem: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 8,
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  menuItemActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
  },
  ordersContainer: {
    paddingBottom: 40,
  },
  orderFilters: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeFilter: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  activeFilterText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  ordersList: {
    flex: 1,
  },
  orderDetailCard: {
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
  orderDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderItems: {
    marginBottom: 12,
  },
  orderItemText: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 4,
  },
  orderItemMore: {
    fontSize: 14,
    color: Colors.primary,
    fontStyle: 'italic',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  analyticsContainer: {
    paddingBottom: 40,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activePeriod: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  activePeriodText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  analyticsStats: {
    gap: 12,
    marginBottom: 24,
  },
  analyticCard: {
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
  analyticLabel: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 8,
  },
  analyticValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  analyticChange: {
    fontSize: 12,
    color: Colors.success,
  },
  topItems: {
    marginTop: 24,
  },
  topItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  topItemRank: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.gold,
    marginRight: 16,
  },
  topItemInfo: {
    flex: 1,
  },
  topItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  topItemSales: {
    fontSize: 14,
    color: Colors.textLight,
  },
  topItemRevenue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
});
