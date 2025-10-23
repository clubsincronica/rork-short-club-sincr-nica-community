import { MenuItem, VendorMenu, FoodOrder, OrderNotification } from '@/types/user';
import { mockFoodProviders } from './data';

export const mockMenuItems: MenuItem[] = [
  // Organic Restaurant Items
  {
    id: 'menu-1',
    providerId: 'food-1',
    name: 'Ensalada Arcoíris',
    description: 'Mezcla fresca de vegetales orgánicos con aderezo de tahini',
    category: 'salads',
    price: 12.50,
    images: ['https://images.unsplash.com/photo-1512621776951-a57141f2eefd'],
    ingredients: ['Lechuga', 'Tomate', 'Zanahoria', 'Pepino', 'Aguacate', 'Semillas'],
    allergens: ['Sésamo'],
    nutritionalInfo: {
      calories: 320,
      protein: 8,
      carbs: 24,
      fat: 22,
      fiber: 12,
      sugar: 8,
      sodium: 180
    },
    isAvailable: true,
    preparationTime: 10,
    isVegan: true,
    isVegetarian: true,
    isGlutenFree: true,
    isOrganic: true,
    customizations: [
      {
        id: 'protein',
        name: 'Agregar Proteína',
        type: 'single',
        required: false,
        options: [
          { id: 'tofu', name: 'Tofu Orgánico', price: 3.00 },
          { id: 'tempeh', name: 'Tempeh', price: 3.50 },
          { id: 'quinoa', name: 'Quinoa', price: 2.50 }
        ]
      },
      {
        id: 'dressing',
        name: 'Aderezo',
        type: 'single',
        required: true,
        options: [
          { id: 'tahini', name: 'Tahini', price: 0, isDefault: true },
          { id: 'vinagreta', name: 'Vinagreta Balsámica', price: 0 },
          { id: 'limon', name: 'Limón y Aceite', price: 0 }
        ]
      }
    ],
    tags: ['Popular', 'Sin Gluten', 'Vegano']
  },
  {
    id: 'menu-2',
    providerId: 'food-1',
    name: 'Bowl de Quinoa Power',
    description: 'Quinoa orgánica con vegetales asados y salsa de aguacate',
    category: 'main-courses',
    price: 15.00,
    images: ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c'],
    ingredients: ['Quinoa', 'Brócoli', 'Calabaza', 'Garbanzos', 'Aguacate', 'Espinaca'],
    allergens: [],
    nutritionalInfo: {
      calories: 450,
      protein: 18,
      carbs: 52,
      fat: 20,
      fiber: 14,
      sugar: 6,
      sodium: 220
    },
    isAvailable: true,
    preparationTime: 20,
    isVegan: true,
    isVegetarian: true,
    isGlutenFree: true,
    isOrganic: true,
    spicyLevel: 0,
    customizations: [
      {
        id: 'extras',
        name: 'Extras',
        type: 'multiple',
        required: false,
        options: [
          { id: 'hummus', name: 'Hummus', price: 2.00 },
          { id: 'falafel', name: 'Falafel (3 piezas)', price: 3.50 },
          { id: 'pan', name: 'Pan Integral', price: 1.50 }
        ]
      }
    ],
    tags: ['Bestseller', 'Alto en Proteína']
  },
  {
    id: 'menu-3',
    providerId: 'food-1',
    name: 'Smoothie Verde Detox',
    description: 'Espinaca, manzana verde, jengibre y limón',
    category: 'smoothies',
    price: 8.00,
    images: ['https://images.unsplash.com/photo-1610970881699-44a5587cabec'],
    ingredients: ['Espinaca', 'Manzana Verde', 'Jengibre', 'Limón', 'Agua de Coco'],
    allergens: [],
    nutritionalInfo: {
      calories: 120,
      protein: 3,
      carbs: 28,
      fat: 1,
      fiber: 5,
      sugar: 18,
      sodium: 45
    },
    isAvailable: true,
    preparationTime: 5,
    isVegan: true,
    isVegetarian: true,
    isGlutenFree: true,
    isOrganic: true,
    customizations: [
      {
        id: 'size',
        name: 'Tamaño',
        type: 'single',
        required: true,
        options: [
          { id: 'regular', name: 'Regular (350ml)', price: 0, isDefault: true },
          { id: 'grande', name: 'Grande (500ml)', price: 2.00 }
        ]
      },
      {
        id: 'boost',
        name: 'Superalimentos',
        type: 'multiple',
        required: false,
        options: [
          { id: 'spirulina', name: 'Spirulina', price: 1.50 },
          { id: 'maca', name: 'Maca', price: 1.50 },
          { id: 'chia', name: 'Semillas de Chía', price: 1.00 }
        ]
      }
    ],
    tags: ['Detox', 'Energizante']
  },
  // Vegan Items
  {
    id: 'menu-4',
    providerId: 'food-2',
    name: 'Burger Vegana Especial',
    description: 'Hamburguesa de lentejas y remolacha con papas al horno',
    category: 'main-courses',
    price: 14.00,
    images: ['https://images.unsplash.com/photo-1585238341267-1cfec2046a55'],
    ingredients: ['Lentejas', 'Remolacha', 'Avena', 'Pan Integral', 'Lechuga', 'Tomate'],
    allergens: ['Gluten'],
    nutritionalInfo: {
      calories: 420,
      protein: 22,
      carbs: 48,
      fat: 16,
      fiber: 12,
      sugar: 8,
      sodium: 380
    },
    isAvailable: true,
    preparationTime: 25,
    isVegan: true,
    isVegetarian: true,
    isGlutenFree: false,
    isOrganic: true,
    spicyLevel: 1,
    customizations: [
      {
        id: 'cheese',
        name: 'Queso Vegano',
        type: 'single',
        required: false,
        options: [
          { id: 'cashew', name: 'Queso de Cajú', price: 2.00 },
          { id: 'almond', name: 'Queso de Almendra', price: 2.00 }
        ]
      },
      {
        id: 'sides',
        name: 'Acompañamiento',
        type: 'single',
        required: true,
        options: [
          { id: 'fries', name: 'Papas al Horno', price: 0, isDefault: true },
          { id: 'salad', name: 'Ensalada Mixta', price: 0 },
          { id: 'sweet', name: 'Camote Asado', price: 1.00 }
        ]
      }
    ],
    tags: ['Popular', 'Comfort Food']
  },
  {
    id: 'menu-5',
    providerId: 'food-2',
    name: 'Tacos de Jackfruit',
    description: 'Tres tacos con jackfruit marinado estilo carnitas',
    category: 'main-courses',
    price: 12.00,
    images: ['https://images.unsplash.com/photo-1565299585323-38d6b0865b47'],
    ingredients: ['Jackfruit', 'Tortillas de Maíz', 'Cilantro', 'Cebolla', 'Limón'],
    allergens: [],
    nutritionalInfo: {
      calories: 340,
      protein: 8,
      carbs: 52,
      fat: 12,
      fiber: 8,
      sugar: 12,
      sodium: 320
    },
    isAvailable: true,
    preparationTime: 15,
    isVegan: true,
    isVegetarian: true,
    isGlutenFree: true,
    isOrganic: false,
    spicyLevel: 2,
    tags: ['Mexicano', 'Street Food']
  },
  // Juice Bar Items
  {
    id: 'menu-6',
    providerId: 'food-9',
    name: 'Jugo Tropical Sunrise',
    description: 'Piña, mango, maracuyá y naranja recién exprimidos',
    category: 'juices',
    price: 7.00,
    images: ['https://images.unsplash.com/photo-1613478223719-2ab802602423'],
    ingredients: ['Piña', 'Mango', 'Maracuyá', 'Naranja'],
    allergens: [],
    nutritionalInfo: {
      calories: 180,
      protein: 2,
      carbs: 44,
      fat: 0.5,
      fiber: 3,
      sugar: 38,
      sodium: 10
    },
    isAvailable: true,
    preparationTime: 5,
    isVegan: true,
    isVegetarian: true,
    isGlutenFree: true,
    isOrganic: true,
    customizations: [
      {
        id: 'ice',
        name: 'Hielo',
        type: 'single',
        required: false,
        options: [
          { id: 'with', name: 'Con Hielo', price: 0, isDefault: true },
          { id: 'without', name: 'Sin Hielo', price: 0 }
        ]
      }
    ],
    tags: ['Refrescante', 'Vitamina C']
  },
  {
    id: 'menu-7',
    providerId: 'food-9',
    name: 'Açaí Bowl Premium',
    description: 'Açaí con granola, frutas frescas y miel',
    category: 'breakfast',
    price: 11.00,
    images: ['https://images.unsplash.com/photo-1590301157890-4810ed352733'],
    ingredients: ['Açaí', 'Plátano', 'Fresas', 'Arándanos', 'Granola', 'Miel'],
    allergens: ['Nueces', 'Miel'],
    nutritionalInfo: {
      calories: 380,
      protein: 6,
      carbs: 68,
      fat: 12,
      fiber: 8,
      sugar: 42,
      sodium: 15
    },
    isAvailable: true,
    preparationTime: 10,
    isVegan: false,
    isVegetarian: true,
    isGlutenFree: false,
    isOrganic: true,
    customizations: [
      {
        id: 'toppings',
        name: 'Toppings Extra',
        type: 'multiple',
        required: false,
        options: [
          { id: 'coconut', name: 'Coco Rallado', price: 1.00 },
          { id: 'almond', name: 'Almendras', price: 1.50 },
          { id: 'cacao', name: 'Nibs de Cacao', price: 1.50 },
          { id: 'peanut', name: 'Mantequilla de Maní', price: 2.00 }
        ]
      }
    ],
    tags: ['Energético', 'Antioxidante']
  },
  // Raw Food Items
  {
    id: 'menu-8',
    providerId: 'food-4',
    name: 'Zoodles con Pesto Raw',
    description: 'Fideos de calabacín con pesto de albahaca crudo',
    category: 'main-courses',
    price: 13.00,
    images: ['https://images.unsplash.com/photo-1609501676725-7186f017a4b7'],
    ingredients: ['Calabacín', 'Albahaca', 'Piñones', 'Aceite de Oliva', 'Ajo'],
    allergens: ['Nueces'],
    nutritionalInfo: {
      calories: 280,
      protein: 8,
      carbs: 18,
      fat: 22,
      fiber: 6,
      sugar: 8,
      sodium: 120
    },
    isAvailable: true,
    preparationTime: 15,
    isVegan: true,
    isVegetarian: true,
    isGlutenFree: true,
    isOrganic: true,
    tags: ['Raw', 'Keto-Friendly']
  },
  {
    id: 'menu-9',
    providerId: 'food-4',
    name: 'Cheesecake Raw de Frutos Rojos',
    description: 'Tarta cruda con base de dátiles y nueces',
    category: 'desserts',
    price: 9.00,
    images: ['https://images.unsplash.com/photo-1565958011703-44f9829ba187'],
    ingredients: ['Cajú', 'Dátiles', 'Nueces', 'Frutos Rojos', 'Coco', 'Limón'],
    allergens: ['Nueces'],
    nutritionalInfo: {
      calories: 320,
      protein: 6,
      carbs: 28,
      fat: 22,
      fiber: 4,
      sugar: 20,
      sodium: 45
    },
    isAvailable: true,
    preparationTime: 5,
    isVegan: true,
    isVegetarian: true,
    isGlutenFree: true,
    isOrganic: true,
    tags: ['Sin Azúcar Añadida', 'Raw']
  },
  // Superfood Items
  {
    id: 'menu-10',
    providerId: 'food-8',
    name: 'Buddha Bowl Superfoods',
    description: 'Bowl con quinoa, kale, aguacate y semillas de chía',
    category: 'main-courses',
    price: 16.00,
    images: ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c'],
    ingredients: ['Quinoa', 'Kale', 'Aguacate', 'Chía', 'Goji', 'Almendras'],
    allergens: ['Nueces'],
    nutritionalInfo: {
      calories: 480,
      protein: 18,
      carbs: 42,
      fat: 28,
      fiber: 14,
      sugar: 6,
      sodium: 180
    },
    isAvailable: true,
    preparationTime: 20,
    isVegan: true,
    isVegetarian: true,
    isGlutenFree: true,
    isOrganic: true,
    customizations: [
      {
        id: 'protein-boost',
        name: 'Proteína Extra',
        type: 'single',
        required: false,
        options: [
          { id: 'hemp', name: 'Proteína de Cáñamo', price: 3.00 },
          { id: 'pea', name: 'Proteína de Guisante', price: 2.50 }
        ]
      }
    ],
    tags: ['Superfoods', 'Alto en Omega-3']
  }
];

export const mockVendorMenus: VendorMenu[] = [
  {
    providerId: 'food-1',
    categories: ['salads', 'main-courses', 'smoothies', 'juices'],
    items: mockMenuItems.filter(item => item.providerId === 'food-1'),
    featuredItems: ['menu-1', 'menu-2'],
    dailySpecials: [mockMenuItems[0]],
    isActive: true,
    lastUpdated: new Date().toISOString()
  },
  {
    providerId: 'food-2',
    categories: ['main-courses', 'appetizers', 'desserts'],
    items: mockMenuItems.filter(item => item.providerId === 'food-2'),
    featuredItems: ['menu-4'],
    isActive: true,
    lastUpdated: new Date().toISOString()
  },
  {
    providerId: 'food-9',
    categories: ['juices', 'smoothies', 'breakfast'],
    items: mockMenuItems.filter(item => item.providerId === 'food-9'),
    featuredItems: ['menu-7'],
    isActive: true,
    lastUpdated: new Date().toISOString()
  }
];

export const mockOrders: FoodOrder[] = [
  {
    id: 'order-1',
    userId: 'user-1',
    user: {
      id: 'user-1',
      name: 'María García',
      email: 'maria@example.com',
      isServiceProvider: false,
      rating: 4.8,
      reviewCount: 12,
      joinedDate: '2023-01-15',
      verified: true,
      specialties: []
    },
    providerId: 'food-1',
    provider: mockFoodProviders[0],
    items: [
      {
        id: 'item-1',
        menuItem: mockMenuItems[0],
        quantity: 2,
        customizations: [],
        price: 12.50,
        totalPrice: 25.00
      },
      {
        id: 'item-2',
        menuItem: mockMenuItems[2],
        quantity: 1,
        customizations: [],
        price: 8.00,
        totalPrice: 8.00
      }
    ],
    subtotal: 33.00,
    deliveryFee: 3.50,
    tax: 3.65,
    total: 40.15,
    status: 'delivered',
    paymentStatus: 'completed',
    orderType: 'delivery',
    deliveryAddress: 'Calle Principal 123, Ciudad',
    orderNumber: 'ORD-2024-001',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 82800000).toISOString(),
    rating: 5,
    review: 'Excelente comida, muy fresca y saludable!'
  }
];

export const mockNotifications: OrderNotification[] = [
  {
    id: 'notif-1',
    orderId: 'order-1',
    userId: 'user-1',
    type: 'order-confirmed',
    title: 'Pedido Confirmado',
    message: 'Tu pedido #ORD-2024-001 ha sido confirmado',
    read: false,
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'notif-2',
    orderId: 'order-1',
    userId: 'user-1',
    type: 'order-preparing',
    title: 'Preparando tu pedido',
    message: 'El restaurante está preparando tu pedido',
    read: false,
    createdAt: new Date(Date.now() - 1800000).toISOString()
  }
];
