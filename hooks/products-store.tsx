import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiBaseUrl } from '@/utils/api-config';
import { useUser } from '@/hooks/user-store';

export interface Product {
  id: string;
  providerId: string;
  providerName?: string;
  providerAvatar?: string;
  title: string;
  description: string;
  category: string;
  price: number;
  images: string[];
  tags: string[];
  specifications?: string;
  features?: string;
  inStock: boolean;
  stockCount: number;
  shippingInfo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCartItem {
  id: string;
  product: Product;
  quantity: number;
  price: number;
}

interface ProductsContextType {
  products: Product[];
  isLoading: boolean;
  addProduct: (product: any) => Promise<any>;
  updateProduct: (id: string, updates: any) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getUserProducts: (userId: string) => Product[];

  // Cart
  cart: ProductCartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

const PRODUCT_CART_KEY = '@rork_product_cart';

export const ProductsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const { currentUser } = useUser();
  const [cart, setCart] = useState<ProductCartItem[]>([]);

  // Fetch products from API
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await fetch(`${getApiBaseUrl()}/api/products`);
      if (!response.ok) throw new Error('Failed to fetch products');
      return await response.json();
    }
  });

  // Load cart from storage
  useEffect(() => {
    const loadCart = async () => {
      try {
        const storedCart = await AsyncStorage.getItem(PRODUCT_CART_KEY);
        if (storedCart) {
          setCart(JSON.parse(storedCart));
        }
      } catch (error) {
        console.error('Error loading product cart:', error);
      }
    };
    loadCart();
  }, []);

  // Save cart to storage
  useEffect(() => {
    AsyncStorage.setItem(PRODUCT_CART_KEY, JSON.stringify(cart));
  }, [cart]);

  const addProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${getApiBaseUrl()}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...productData,
          providerId: currentUser?.id
        }),
      });
      if (!response.ok) throw new Error('Failed to create product');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: any }) => {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${getApiBaseUrl()}/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update product');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${getApiBaseUrl()}/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete product');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });

  const addProduct = async (productData: any) => {
    return await addProductMutation.mutateAsync(productData);
  };

  const updateProduct = async (id: string, updates: any) => {
    await updateProductMutation.mutateAsync({ id, updates });
  };

  const deleteProduct = async (id: string) => {
    await deleteProductMutation.mutateAsync(id);
  };

  const getUserProducts = (userId: string): Product[] => {
    return products.filter((p: Product) => p.providerId.toString() === userId);
  };

  // Cart Logic
  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity, price: product.price * (item.quantity + quantity) }
            : item
        );
      }
      return [...prev, { id: product.id, product, quantity, price: product.price * quantity }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item =>
      item.id === productId ? { ...item, quantity, price: item.product.price * quantity } : item
    ));
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartTotal = cart.reduce((total, item) => total + item.price, 0);

  return (
    <ProductsContext.Provider value={{
      products,
      isLoading,
      addProduct,
      updateProduct,
      deleteProduct,
      getUserProducts,
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
    }}>
      {children}
    </ProductsContext.Provider>
  );
};

export const useProducts = (): ProductsContextType => {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
};
