export interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  coordinates?: { latitude: number; longitude: number };
  phone?: string;
  specialties: string[];
  interests?: string[];
  isServiceProvider: boolean;
  rating: number;
  reviewCount: number;
  joinedDate: string;
  verified: boolean;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  twitter?: string;
  linkedin?: string;
  bankAccounts?: BankAccount[];
  priorityBoard?: ProfilePriorityItem[];
}

export interface ProfilePriorityItem {
  id: string;
  type: 'service' | 'event' | 'product' | 'other';
  title: string;
  description: string;
  price: number | string;
  image?: string;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  metadata?: any;
}

export interface Service {
  id: string;
  providerId: string;
  provider: User;
  title: string;
  description: string;
  category: ServiceCategory;
  price: number;
  duration: number; // in minutes
  images: string[];
  location?: string;
  isOnline: boolean;
  rating: number;
  reviewCount: number;
  tags: string[];
}

export interface Lodging {
  id: string;
  hostId: string;
  host: User;
  title: string;
  description: string;
  type: LodgingType;
  pricePerNight: number;
  images: string[];
  location: string;
  amenities: string[];
  maxGuests: number;
  rating: number;
  reviewCount: number;
  availableDates: string[];
}

export type ServiceCategory =
  | 'healing'
  | 'coaching'
  | 'meditation'
  | 'yoga'
  | 'energy-work'
  | 'nutrition'
  | 'therapy'
  | 'spiritual-guidance';

export type LodgingType =
  | 'retreat-center'
  | 'healing-space'
  | 'eco-lodge'
  | 'spiritual-sanctuary'
  | 'wellness-resort';

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage: ChatMessage;
  unreadCount: number;
}

export interface FoodProvider {
  id: string;
  providerId: string;
  provider: User;
  businessName: string;
  description: string;
  category: FoodCategory;
  cuisine: string[];
  images: string[];
  location: string;
  deliveryRadius: number; // in km
  isDeliveryAvailable: boolean;
  isPickupAvailable: boolean;
  rating: number;
  reviewCount: number;
  tags: string[];
  openingHours: OpeningHours;
  specialties: string[];
  certifications: string[]; // e.g., 'Orgánico', 'Vegano', 'Sin Gluten'
}

export interface OpeningHours {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

export type FoodCategory =
  | 'organic'
  | 'vegan'
  | 'vegetarian'
  | 'raw'
  | 'gluten-free'
  | 'ayurvedic'
  | 'macrobiotic'
  | 'superfood'
  | 'juice-bar'
  | 'healthy-meals';

export interface CalendarEvent {
  id: string;
  providerId: string;
  provider: User;
  title: string;
  description: string;
  category: ServiceCategory;
  startTime: string;
  endTime: string;
  date: string;
  location?: string;
  isOnline: boolean;
  maxParticipants: number;
  currentParticipants: number;
  price: number;
  image?: string;
  tags: string[];
  recurring?: RecurringPattern;
  status: EventStatus;
}

export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  endDate?: string;
  daysOfWeek?: number[]; // 0-6 for Sunday-Saturday
}

export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export interface Reservation {
  id: string;
  eventId: string;
  event: CalendarEvent;
  userId: string;
  user: User;
  status: ReservationStatus;
  numberOfSpots: number;
  totalPrice: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  createdAt: string;
  notes?: string;
  isCheckedIn?: boolean;
  checkInTime?: string;
  ticketQRCode?: string;
}

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'waitlist';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface CartItem {
  eventId: string;
  event: CalendarEvent;
  numberOfSpots: number;
  price: number;
}

export interface UserCalendarSettings {
  isPublic: boolean;
  allowReservations: boolean;
  autoConfirmReservations: boolean;
  cancellationPolicy?: string;
  advanceBookingDays: number;
  reminderHours: number;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'bank' | 'mercadopago' | 'bizum';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  holderName?: string;
  nickname?: string;
  email?: string;
  phone?: string;
}

export interface MenuItem {
  id: string;
  providerId: string;
  name: string;
  description: string;
  category: MenuCategory;
  price: number;
  images: string[];
  ingredients: string[];
  allergens: string[];
  nutritionalInfo?: NutritionalInfo;
  isAvailable: boolean;
  preparationTime: number; // in minutes
  isVegan: boolean;
  isVegetarian: boolean;
  isGlutenFree: boolean;
  isOrganic: boolean;
  spicyLevel?: 0 | 1 | 2 | 3;
  customizations?: MenuCustomization[];
  tags: string[];
}

export interface MenuCustomization {
  id: string;
  name: string;
  type: 'single' | 'multiple';
  required: boolean;
  options: CustomizationOption[];
}

export interface CustomizationOption {
  id: string;
  name: string;
  price: number;
  isDefault?: boolean;
}

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export type MenuCategory =
  | 'appetizers'
  | 'salads'
  | 'soups'
  | 'main-courses'
  | 'desserts'
  | 'beverages'
  | 'smoothies'
  | 'juices'
  | 'breakfast'
  | 'snacks';

export interface FoodOrder {
  id: string;
  userId: string;
  user: User;
  providerId: string;
  provider: FoodProvider;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  orderType: 'delivery' | 'pickup';
  deliveryAddress?: string;
  deliveryInstructions?: string;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  orderNumber: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  rating?: number;
  review?: string;
}

export interface OrderItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  customizations: SelectedCustomization[];
  specialInstructions?: string;
  price: number;
  totalPrice: number;
}

export interface SelectedCustomization {
  customizationId: string;
  selectedOptions: string[];
  additionalPrice: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out-for-delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface FoodCart {
  providerId: string;
  provider: FoodProvider;
  items: CartFoodItem[];
  orderType: 'delivery' | 'pickup';
  deliveryAddress?: string;
  deliveryInstructions?: string;
  scheduledTime?: string;
}

export interface CartFoodItem {
  menuItem: MenuItem;
  quantity: number;
  customizations: SelectedCustomization[];
  specialInstructions?: string;
  price: number;
}

export interface VendorMenu {
  providerId: string;
  categories: MenuCategory[];
  items: MenuItem[];
  featuredItems: string[];
  dailySpecials?: MenuItem[];
  isActive: boolean;
  lastUpdated: string;
}

export interface OrderNotification {
  id: string;
  orderId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: any;
}

export type NotificationType =
  | 'order-confirmed'
  | 'order-preparing'
  | 'order-ready'
  | 'order-out-for-delivery'
  | 'order-delivered'
  | 'order-cancelled'
  | 'payment-successful'
  | 'payment-failed'
  | 'new-review'
  | 'special-offer';

export interface UserPreferences {
  notifications: boolean;
  newsletter: boolean;
  language: 'es' | 'en' | 'pt';
  theme: 'light' | 'dark' | 'auto';
  autoBooking: boolean;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  smsNotifications?: boolean;
}

export interface EventTicket {
  id: string;
  reservation: Reservation;
  qrData: string;
  validationStatus: 'valid' | 'used' | 'expired' | 'invalid';
  generatedAt: string;
  usedAt?: string;
}

export interface BankAccount {
  id: number;
  accountNumber: string;
  bankName: string;
  accountType: 'checking' | 'savings';
  accountHolderName: string;
  percentage: number;
  nickname?: string;
  isDefault: boolean;
  isVerified: boolean;
  createdAt: string;
}
