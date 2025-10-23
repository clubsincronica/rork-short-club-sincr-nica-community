import { useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { FoodProvider, MenuItem, FoodOrder } from '@/types/user';

interface VendorStats {
  todayRevenue: number;
  todayOrders: number;
  monthRevenue: number;
  monthOrders: number;
  growthPercentage: number;
  averageRating: number;
  topItems: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
  }>;
}

interface VendorData extends Omit<FoodProvider, 'location'> {
  menuItems: MenuItem[];
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  priceRange: string;
  deliveryTime: string;
  minimumOrder: number;
  deliveryFee: number;
  acceptsOrders: boolean;
  schedule: {
    monday: { open: string; close: string };
    tuesday: { open: string; close: string };
    wednesday: { open: string; close: string };
    thursday: { open: string; close: string };
    friday: { open: string; close: string };
    saturday: { open: string; close: string };
    sunday: { open: string; close: string };
  };
}

const VENDOR_STORAGE_KEY = 'vendor-data';
const VENDOR_ORDERS_STORAGE_KEY = 'vendor-orders';

export const [VendorProvider, useVendorStore] = createContextHook(() => {
  const [vendorData, setVendorData] = useState<VendorData | null>(null);
  const [vendorOrders, setVendorOrders] = useState<FoodOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load vendor data from storage
  useEffect(() => {
    const loadData = async () => {
      try {
        const [storedVendor, storedOrders] = await Promise.all([
          AsyncStorage.getItem(VENDOR_STORAGE_KEY),
          AsyncStorage.getItem(VENDOR_ORDERS_STORAGE_KEY)
        ]);
        
        if (storedVendor) {
          setVendorData(JSON.parse(storedVendor));
        } else {
          // Initialize with mock vendor data
          const mockVendor: VendorData = {
            id: 'vendor-1',
            providerId: 'provider-1',
            businessName: 'Cocina Consciente',
            category: 'organic',
            provider: {
              id: 'provider-1',
              name: 'María González',
              email: 'maria@cocinaconciente.com',
              isServiceProvider: true,
              rating: 4.8,
              reviewCount: 156,
              joinedDate: '2023-01-15',
              verified: true,
              specialties: ['Comida Orgánica', 'Vegano', 'Sin Gluten']
            },
            description: 'Comida orgánica y saludable preparada con amor',
            tags: ['orgánico', 'vegano', 'sin gluten'],
            cuisine: ['Mediterránea', 'Internacional'],
            specialties: ['Ensaladas', 'Bowls', 'Smoothies'],
            rating: 4.8,
            reviewCount: 156,
            priceRange: '€€',
            deliveryTime: '30-45 min',
            minimumOrder: 15,
            deliveryFee: 3.50,
            acceptsOrders: true,
            schedule: {
              monday: { open: '09:00', close: '21:00' },
              tuesday: { open: '09:00', close: '21:00' },
              wednesday: { open: '09:00', close: '21:00' },
              thursday: { open: '09:00', close: '21:00' },
              friday: { open: '09:00', close: '22:00' },
              saturday: { open: '10:00', close: '22:00' },
              sunday: { open: '10:00', close: '20:00' }
            },
            location: {
              address: 'Calle Consciente 123, Madrid',
              latitude: 40.4168,
              longitude: -3.7038
            },
            deliveryRadius: 5,
            isDeliveryAvailable: true,
            isPickupAvailable: true,
            openingHours: {
              monday: '09:00 - 21:00',
              tuesday: '09:00 - 21:00',
              wednesday: '09:00 - 21:00',
              thursday: '09:00 - 21:00',
              friday: '09:00 - 22:00',
              saturday: '10:00 - 22:00',
              sunday: '10:00 - 20:00'
            },
            certifications: ['Orgánico', 'Vegano', 'Sin Gluten'],
            images: [],
            menuItems: [
              {
                id: 'item-1',
                name: 'Buddha Bowl',
                description: 'Bowl nutritivo con quinoa, vegetales asados y tahini',
                price: 12.50,
                category: 'main-courses' as const,
                images: ['https://images.unsplash.com/photo-1540914124281-342587941389'],
                ingredients: ['quinoa', 'vegetales asados', 'tahini'],
                isAvailable: true,
                isVegan: true,
                isVegetarian: true,
                isGlutenFree: true,
                isOrganic: true,
                preparationTime: 15,
                nutritionalInfo: {
                  calories: 450,
                  protein: 15,
                  carbs: 60,
                  fat: 18
                },
                allergens: ['frutos secos', 'sésamo'],
                customizations: [
                  {
                    id: 'protein',
                    name: 'Proteína Extra',
                    type: 'single' as const,
                    options: [
                      { id: 'tofu', name: 'Tofu', price: 2.50 },
                      { id: 'tempeh', name: 'Tempeh', price: 3.00 },
                      { id: 'chickpeas', name: 'Garbanzos', price: 2.00 }
                    ],
                    required: false
                  }
                ],
                tags: ['vegano', 'sin gluten'],
                providerId: 'vendor-1'
              },
              {
                id: 'item-2',
                name: 'Green Smoothie',
                description: 'Batido verde con espinaca, manzana, jengibre y limón',
                price: 6.50,
                category: 'beverages' as const,
                images: ['https://images.unsplash.com/photo-1506484381205-f7945653044d'],
                ingredients: ['espinaca', 'manzana', 'jengibre', 'limón'],
                isAvailable: true,
                isVegan: true,
                isVegetarian: true,
                isGlutenFree: true,
                isOrganic: true,
                preparationTime: 5,
                nutritionalInfo: {
                  calories: 180,
                  protein: 2,
                  carbs: 42,
                  fat: 1
                },
                allergens: [],
                customizations: [
                  {
                    id: 'size',
                    name: 'Tamaño',
                    type: 'single' as const,
                    options: [
                      { id: 'regular', name: 'Regular (350ml)', price: 0 },
                      { id: 'large', name: 'Grande (500ml)', price: 2.00 }
                    ],
                    required: true
                  }
                ],
                tags: ['vegano', 'sin gluten', 'detox'],
                providerId: 'vendor-1'
              }
            ]
          };
          setVendorData(mockVendor);
          await AsyncStorage.setItem(VENDOR_STORAGE_KEY, JSON.stringify(mockVendor));
        }
        
        if (storedOrders) {
          setVendorOrders(JSON.parse(storedOrders));
        }
      } catch (error) {
        console.error('Error loading vendor data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Save vendor data to storage
  useEffect(() => {
    if (!isLoading && vendorData) {
      AsyncStorage.setItem(VENDOR_STORAGE_KEY, JSON.stringify(vendorData));
    }
  }, [vendorData, isLoading]);

  // Save orders to storage
  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem(VENDOR_ORDERS_STORAGE_KEY, JSON.stringify(vendorOrders));
    }
  }, [vendorOrders, isLoading]);

  const addMenuItem = useCallback((item: MenuItem) => {
    setVendorData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        menuItems: [...prev.menuItems, item]
      };
    });
  }, []);

  const updateMenuItem = useCallback((itemId: string, updates: Partial<MenuItem>) => {
    setVendorData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        menuItems: prev.menuItems.map(item =>
          item.id === itemId ? { ...item, ...updates } : item
        )
      };
    });
  }, []);

  const deleteMenuItem = useCallback((itemId: string) => {
    setVendorData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        menuItems: prev.menuItems.filter(item => item.id !== itemId)
      };
    });
  }, []);

  const toggleItemAvailability = useCallback((itemId: string) => {
    setVendorData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        menuItems: prev.menuItems.map(item =>
          item.id === itemId ? { ...item, isAvailable: !item.isAvailable } : item
        )
      };
    });
  }, []);

  const updateOrderStatus = useCallback((orderId: string, status: FoodOrder['status']) => {
    setVendorOrders(prev => prev.map(order =>
      order.id === orderId
        ? { ...order, status, updatedAt: new Date().toISOString() }
        : order
    ));
  }, []);

  const stats = useMemo<VendorStats>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = vendorOrders.filter(order => 
      new Date(order.createdAt) >= today
    );
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const monthOrders = vendorOrders.filter(order =>
      new Date(order.createdAt) >= thisMonth
    );

    const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
    const monthRevenue = monthOrders.reduce((sum, order) => sum + order.total, 0);

    // Calculate top items
    const itemSales: Record<string, { name: string; sales: number; revenue: number }> = {};
    
    vendorOrders.forEach(order => {
      order.items.forEach(item => {
        if (!itemSales[item.menuItem.id]) {
          itemSales[item.menuItem.id] = {
            name: item.menuItem.name,
            sales: 0,
            revenue: 0
          };
        }
        itemSales[item.menuItem.id].sales += item.quantity;
        itemSales[item.menuItem.id].revenue += item.totalPrice;
      });
    });

    const topItems = Object.entries(itemSales)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      todayRevenue,
      todayOrders: todayOrders.length,
      monthRevenue,
      monthOrders: monthOrders.length,
      growthPercentage: 15, // Mock growth
      averageRating: vendorData?.rating || 0,
      topItems
    };
  }, [vendorOrders, vendorData]);

  const activeOrders = useMemo(() => {
    return vendorOrders.filter(order =>
      ['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery'].includes(order.status)
    );
  }, [vendorOrders]);

  const completedOrders = useMemo(() => {
    return vendorOrders.filter(order => order.status === 'delivered');
  }, [vendorOrders]);

  const cancelledOrders = useMemo(() => {
    return vendorOrders.filter(order => order.status === 'cancelled');
  }, [vendorOrders]);

  return useMemo(() => ({
    vendorData,
    vendorOrders,
    stats,
    activeOrders,
    completedOrders,
    cancelledOrders,
    isLoading,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleItemAvailability,
    updateOrderStatus
  }), [
    vendorData,
    vendorOrders,
    stats,
    activeOrders,
    completedOrders,
    cancelledOrders,
    isLoading,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleItemAvailability,
    updateOrderStatus
  ]);
});
