import { useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { FoodCart, CartFoodItem, MenuItem, SelectedCustomization, FoodProvider, FoodOrder, OrderNotification } from '@/types/user';

const CART_STORAGE_KEY = 'food-cart';
const ORDERS_STORAGE_KEY = 'food-orders';
const NOTIFICATIONS_STORAGE_KEY = 'food-notifications';

export const [FoodCartProvider, useFoodCart] = createContextHook(() => {
  const [cart, setCart] = useState<FoodCart | null>(null);
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load cart and orders from storage
  useEffect(() => {
    const loadData = async () => {
      try {
        const [cartData, ordersData, notificationsData] = await Promise.all([
          AsyncStorage.getItem(CART_STORAGE_KEY),
          AsyncStorage.getItem(ORDERS_STORAGE_KEY),
          AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY)
        ]);
        
        if (cartData) {
          setCart(JSON.parse(cartData));
        }
        if (ordersData) {
          setOrders(JSON.parse(ordersData));
        }
        if (notificationsData) {
          setNotifications(JSON.parse(notificationsData));
        }
      } catch (error) {
        if (__DEV__) {
          console.error('Error loading cart data:', error);
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Save cart to storage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }
  }, [cart, isLoading]);

  // Save orders to storage whenever they change
  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    }
  }, [orders, isLoading]);

  // Save notifications to storage whenever they change
  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
    }
  }, [notifications, isLoading]);

  const addToCart = useCallback((
    menuItem: MenuItem,
    provider: FoodProvider,
    quantity: number,
    customizations: SelectedCustomization[],
    specialInstructions?: string
  ) => {
    // Calculate total price including customizations
    let itemPrice = menuItem.price;
    customizations.forEach(custom => {
      itemPrice += custom.additionalPrice;
    });

    const newItem: CartFoodItem = {
      menuItem,
      quantity,
      customizations,
      specialInstructions,
      price: itemPrice * quantity
    };

    setCart(prevCart => {
      if (!prevCart || prevCart.providerId !== provider.id) {
        // New cart or different provider
        if (prevCart && prevCart.providerId !== provider.id) {
          // For now, just clear the cart and add the new item
          // In production, you'd want to show a modal confirmation
          return {
            providerId: provider.id,
            provider,
            items: [newItem],
            orderType: 'delivery'
          };
        }
        return {
          providerId: provider.id,
          provider,
          items: [newItem],
          orderType: 'delivery'
        };
      }

      // Check if item already exists with same customizations
      const existingItemIndex = prevCart.items.findIndex(item => 
        item.menuItem.id === menuItem.id &&
        JSON.stringify(item.customizations) === JSON.stringify(customizations)
      );

      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        const updatedItems = [...prevCart.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity,
          price: itemPrice * (updatedItems[existingItemIndex].quantity + quantity)
        };
        return { ...prevCart, items: updatedItems };
      }

      // Add new item
      return {
        ...prevCart,
        items: [...prevCart.items, newItem]
      };
    });
  }, []);

  const removeFromCart = useCallback((index: number) => {
    setCart(prevCart => {
      if (!prevCart) return null;
      const updatedItems = prevCart.items.filter((_, i) => i !== index);
      if (updatedItems.length === 0) return null;
      return { ...prevCart, items: updatedItems };
    });
  }, []);

  const updateQuantity = useCallback((index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(index);
      return;
    }

    setCart(prevCart => {
      if (!prevCart) return null;
      const updatedItems = [...prevCart.items];
      const item = updatedItems[index];
      const unitPrice = item.price / item.quantity;
      updatedItems[index] = {
        ...item,
        quantity,
        price: unitPrice * quantity
      };
      return { ...prevCart, items: updatedItems };
    });
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart(null);
  }, []);

  const setOrderType = useCallback((type: 'delivery' | 'pickup') => {
    setCart(prevCart => {
      if (!prevCart) return null;
      return { ...prevCart, orderType: type };
    });
  }, []);

  const setDeliveryInfo = useCallback((address: string, instructions?: string) => {
    setCart(prevCart => {
      if (!prevCart) return null;
      return {
        ...prevCart,
        deliveryAddress: address,
        deliveryInstructions: instructions
      };
    });
  }, []);

  const cartTotal = useMemo(() => {
    if (!cart) return 0;
    return cart.items.reduce((total, item) => total + item.price, 0);
  }, [cart]);

  const cartItemsCount = useMemo(() => {
    if (!cart) return 0;
    return cart.items.reduce((count, item) => count + item.quantity, 0);
  }, [cart]);

  const addNotification = useCallback((notification: OrderNotification) => {
    setNotifications(prev => [notification, ...prev]);
  }, []);

  const createOrder = useCallback((paymentMethod?: 'card' | 'cash' | 'mobile' | 'mercadopago'): FoodOrder | null => {
    if (!cart || cart.items.length === 0) return null;

    const subtotal = cartTotal;
    const deliveryFee = cart.orderType === 'delivery' ? 3.50 : 0;
    const tax = subtotal * 0.10; // 10% tax
    const total = subtotal + deliveryFee + tax;

    const newOrder: FoodOrder = {
      id: `order-${Date.now()}`,
      userId: 'current-user', // This would come from auth context
      user: {
        id: 'current-user',
        name: 'Usuario Actual',
        email: 'user@example.com',
        isServiceProvider: false,
        rating: 0,
        reviewCount: 0,
        joinedDate: new Date().toISOString(),
        verified: true,
        specialties: []
      },
      providerId: cart.providerId,
      provider: cart.provider,
      items: cart.items.map((item, index) => ({
        id: `item-${index}`,
        menuItem: item.menuItem,
        quantity: item.quantity,
        customizations: item.customizations,
        specialInstructions: item.specialInstructions,
        price: item.menuItem.price,
        totalPrice: item.price
      })),
      subtotal,
      deliveryFee,
      tax,
      total,
      status: 'pending',
      paymentStatus: 'pending',
      orderType: cart.orderType,
      deliveryAddress: cart.deliveryAddress,
      deliveryInstructions: cart.deliveryInstructions,
      orderNumber: `ORD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setOrders(prev => [newOrder, ...prev]);
    
    // Create initial notification
    const notification: OrderNotification = {
      id: `notif-${Date.now()}`,
      orderId: newOrder.id,
      userId: newOrder.userId,
      type: 'order-confirmed',
      title: 'Pedido Confirmado',
      message: `Tu pedido #${newOrder.orderNumber} ha sido confirmado`,
      read: false,
      createdAt: new Date().toISOString()
    };
    
    addNotification(notification);
    clearCart();
    
    return newOrder;
  }, [cart, cartTotal, clearCart, addNotification]);

  const updateOrderStatus = useCallback((orderId: string, status: FoodOrder['status']) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, status, updatedAt: new Date().toISOString() }
        : order
    ));

    // Create notification for status change
    const notificationTypes: Record<FoodOrder['status'], OrderNotification['type'] | null> = {
      'pending': null,
      'confirmed': 'order-confirmed',
      'preparing': 'order-preparing',
      'ready': 'order-ready',
      'out-for-delivery': 'order-out-for-delivery',
      'delivered': 'order-delivered',
      'cancelled': 'order-cancelled',
      'refunded': null
    };

    const notificationType = notificationTypes[status];
    if (notificationType) {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        const notification: OrderNotification = {
          id: `notif-${Date.now()}`,
          orderId,
          userId: order.userId,
          type: notificationType,
          title: getNotificationTitle(notificationType),
          message: getNotificationMessage(notificationType, order.orderNumber),
          read: false,
          createdAt: new Date().toISOString()
        };
        addNotification(notification);
      }
    }
  }, [orders, addNotification]);

  const markNotificationAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => prev.map(notif =>
      notif.id === notificationId ? { ...notif, read: true } : notif
    ));
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  }, []);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  return useMemo(() => ({
    cart,
    orders,
    notifications,
    isLoading,
    cartTotal,
    cartItemsCount,
    unreadNotificationsCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    setOrderType,
    setDeliveryInfo,
    createOrder,
    updateOrderStatus,
    markNotificationAsRead,
    markAllNotificationsAsRead
  }), [
    cart,
    orders,
    notifications,
    isLoading,
    cartTotal,
    cartItemsCount,
    unreadNotificationsCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    setOrderType,
    setDeliveryInfo,
    createOrder,
    updateOrderStatus,
    markNotificationAsRead,
    markAllNotificationsAsRead
  ]);
});

function getNotificationTitle(type: OrderNotification['type']): string {
  const titles: Record<OrderNotification['type'], string> = {
    'order-confirmed': 'Pedido Confirmado',
    'order-preparing': 'Preparando tu pedido',
    'order-ready': 'Pedido Listo',
    'order-out-for-delivery': 'En camino',
    'order-delivered': 'Entregado',
    'order-cancelled': 'Pedido Cancelado',
    'payment-successful': 'Pago Exitoso',
    'payment-failed': 'Error en el Pago',
    'new-review': 'Nueva Reseña',
    'special-offer': 'Oferta Especial'
  };
  return titles[type];
}

function getNotificationMessage(type: OrderNotification['type'], orderNumber: string): string {
  const messages: Record<OrderNotification['type'], string> = {
    'order-confirmed': `Tu pedido #${orderNumber} ha sido confirmado`,
    'order-preparing': `El restaurante está preparando tu pedido #${orderNumber}`,
    'order-ready': `Tu pedido #${orderNumber} está listo`,
    'order-out-for-delivery': `Tu pedido #${orderNumber} está en camino`,
    'order-delivered': `Tu pedido #${orderNumber} ha sido entregado`,
    'order-cancelled': `Tu pedido #${orderNumber} ha sido cancelado`,
    'payment-successful': `El pago para el pedido #${orderNumber} fue exitoso`,
    'payment-failed': `Hubo un error procesando el pago del pedido #${orderNumber}`,
    'new-review': `Tienes una nueva reseña`,
    'special-offer': `Tienes una nueva oferta especial`
  };
  return messages[type];
}
