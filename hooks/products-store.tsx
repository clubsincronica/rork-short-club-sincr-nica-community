import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Product {
  id: string;
  providerId: string;
  title: string;
  description: string;
  category: string;
  price: number;
  images?: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  
  // Product-specific fields
  inventory?: number;
  isDigital: boolean;
  isAvailable: boolean;
}

interface ProductsContextType {
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getUserProducts: (userId: string) => Product[];
  getProductsByCategory: (category: string) => Product[];
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

const PRODUCTS_STORAGE_KEY = '@rork_products';

export const ProductsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  // Load products from storage
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const storedProducts = await AsyncStorage.getItem(PRODUCTS_STORAGE_KEY);
      if (storedProducts) {
        const parsedProducts = JSON.parse(storedProducts);
        console.log('📦 Products Store: Loaded', parsedProducts.length, 'products');
        setProducts(parsedProducts);
      }
    } catch (error) {
      console.error('📦 Products Store: Error loading products:', error);
    }
  };

  const saveProducts = async (updatedProducts: Product[]) => {
    try {
      await AsyncStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(updatedProducts));
      console.log('📦 Products Store: Saved', updatedProducts.length, 'products');
    } catch (error) {
      console.error('📦 Products Store: Error saving products:', error);
    }
  };

  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newProduct: Product = {
        ...productData,
        id: `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedProducts = [...products, newProduct];
      setProducts(updatedProducts);
      await saveProducts(updatedProducts);
      
      console.log('✅ Products Store: Product created:', newProduct.title);
    } catch (error) {
      console.error('📦 Products Store: Error creating product:', error);
      throw error;
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const updatedProducts = products.map(product =>
        product.id === id
          ? { ...product, ...updates, updatedAt: new Date().toISOString() }
          : product
      );
      
      setProducts(updatedProducts);
      await saveProducts(updatedProducts);
      
      console.log('✅ Products Store: Product updated:', id);
    } catch (error) {
      console.error('📦 Products Store: Error updating product:', error);
      throw error;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const updatedProducts = products.filter(product => product.id !== id);
      setProducts(updatedProducts);
      await saveProducts(updatedProducts);
      
      console.log('✅ Products Store: Product deleted:', id);
    } catch (error) {
      console.error('📦 Products Store: Error deleting product:', error);
      throw error;
    }
  };

  const getUserProducts = (userId: string): Product[] => {
    return products.filter(product => product.providerId === userId);
  };

  const getProductsByCategory = (category: string): Product[] => {
    return products.filter(product => product.category === category);
  };

  return (
    <ProductsContext.Provider value={{
      products,
      addProduct,
      updateProduct,
      deleteProduct,
      getUserProducts,
      getProductsByCategory,
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