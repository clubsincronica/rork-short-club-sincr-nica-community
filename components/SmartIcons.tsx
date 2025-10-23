// Smart icon system that works with both Expo Go and Development Builds
import React from 'react';

// Try to import lucide-react-native, fallback to Expo Vector Icons
let LucideIcons: any = null;
let useExpoIcons = false;

try {
  LucideIcons = require('lucide-react-native');
} catch (error) {
  console.log('Lucide icons not available, using Expo Vector Icons fallback');
  useExpoIcons = true;
}

// Expo Vector Icons as fallback
import { Ionicons, Feather } from '@expo/vector-icons';

// Smart icon component that switches between Lucide and Expo icons
const createSmartIcon = (lucideName: string, expoName: string, expoFamily: any = Ionicons) => {
  return (props: any) => {
    if (!useExpoIcons && LucideIcons && LucideIcons[lucideName]) {
      const LucideIcon = LucideIcons[lucideName];
      return <LucideIcon {...props} />;
    }
    const ExpoIcon = expoFamily;
    return <ExpoIcon name={expoName} {...props} />;
  };
};

// Export smart icons
export const Star = createSmartIcon('Star', 'star');
export const MapPin = createSmartIcon('MapPin', 'location');
export const Clock = createSmartIcon('Clock', 'time');
export const Users = createSmartIcon('Users', 'people');
export const User = createSmartIcon('User', 'person');
export const X = createSmartIcon('X', 'close');
export const Plus = createSmartIcon('Plus', 'add');
export const Minus = createSmartIcon('Minus', 'remove');
export const ArrowLeft = createSmartIcon('ArrowLeft', 'arrow-back');
export const ChevronRight = createSmartIcon('ChevronRight', 'chevron-forward');
export const Mail = createSmartIcon('Mail', 'mail');
export const Lock = createSmartIcon('Lock', 'lock-closed');
export const Eye = createSmartIcon('Eye', 'eye');
export const EyeOff = createSmartIcon('EyeOff', 'eye-off');
export const Globe = createSmartIcon('Globe', 'globe');
export const DollarSign = createSmartIcon('DollarSign', 'logo-usd');
export const Check = createSmartIcon('Check', 'checkmark');
export const CheckCircle = createSmartIcon('CheckCircle', 'checkmark-circle');
export const Package = createSmartIcon('Package', 'cube');
export const Bell = createSmartIcon('Bell', 'notifications');
export const Phone = createSmartIcon('Phone', 'call');
export const MessageCircle = createSmartIcon('MessageCircle', 'chatbubble');
export const CreditCard = createSmartIcon('CreditCard', 'card');
export const Smartphone = createSmartIcon('Smartphone', 'phone-portrait');
export const ShoppingCart = createSmartIcon('ShoppingCart', 'cart');
export const ShoppingBag = createSmartIcon('ShoppingBag', 'bag');
export const Truck = createSmartIcon('Truck', 'car');
export const Wifi = createSmartIcon('Wifi', 'wifi');
export const WifiOff = createSmartIcon('WifiOff', 'wifi-off', Feather);
export const Edit2 = createSmartIcon('Edit2', 'create');
export const Trash2 = createSmartIcon('Trash2', 'trash');
export const TrendingUp = createSmartIcon('TrendingUp', 'trending-up');
export const AlertCircle = createSmartIcon('AlertCircle', 'alert-circle');
export const Info = createSmartIcon('Info', 'information-circle');
export const Leaf = createSmartIcon('Leaf', 'leaf');
export const Flame = createSmartIcon('Flame', 'flame');
export const Tag = createSmartIcon('Tag', 'pricetag');
export const Flashlight = createSmartIcon('Flashlight', 'flashlight');
export const FlashlightOff = createSmartIcon('FlashlightOff', 'flashlight-off', Feather);
export const RefreshCw = createSmartIcon('RefreshCw', 'refresh');
export const Settings = createSmartIcon('Settings', 'settings');
export const HelpCircle = createSmartIcon('HelpCircle', 'help-circle');
export const Shield = createSmartIcon('Shield', 'shield');
export const LogOut = createSmartIcon('LogOut', 'log-out');
export const Moon = createSmartIcon('Moon', 'moon');
export const Sun = createSmartIcon('Sun', 'sunny');
export const Volume2 = createSmartIcon('Volume2', 'volume-high');
export const VolumeX = createSmartIcon('VolumeX', 'volume-mute');
export const Zap = createSmartIcon('Zap', 'flash');
export const Navigation = createSmartIcon('Navigation', 'navigate');
export const Languages = createSmartIcon('Languages', 'language');
export const FileText = createSmartIcon('FileText', 'document-text');
export const BookOpen = createSmartIcon('BookOpen', 'book');
export const Database = createSmartIcon('Database', 'server');

// Additional icons for compatibility
export const Heart = createSmartIcon('Heart', 'heart');
export const Brain = createSmartIcon('Brain', 'bulb');
export const Focus = createSmartIcon('Focus', 'eye');
export const Dumbbell = createSmartIcon('Dumbbell', 'fitness');
export const Apple = createSmartIcon('Apple', 'nutrition');
export const Sparkles = createSmartIcon('Sparkles', 'sparkles');
export const AlertTriangle = createSmartIcon('AlertTriangle', 'warning');
