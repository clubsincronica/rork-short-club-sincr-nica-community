// Smart icon system using only @expo/vector-icons for compatibility
import React from 'react';
import { Ionicons, Feather, MaterialIcons, AntDesign, FontAwesome } from '@expo/vector-icons';

// Smart icon component using only Expo Vector Icons
const createIcon = (expoName: string, expoFamily: any = Ionicons) => {
  return (props: any) => {
    const ExpoIcon = expoFamily;
    return <ExpoIcon name={expoName} {...props} />;
  };
};

// Export all icons using Expo Vector Icons
export const Star = createIcon('star');
export const MapPin = createIcon('location');
export const Clock = createIcon('time');
export const Users = createIcon('people');
export const User = createIcon('person');
export const X = createIcon('close');
export const Plus = createIcon('add');
export const Minus = createIcon('remove');
export const ArrowLeft = createIcon('arrow-back');
export const ChevronRight = createIcon('chevron-forward');
export const Mail = createIcon('mail');
export const Lock = createIcon('lock-closed');
export const Eye = createIcon('eye');
export const EyeOff = createIcon('eye-off');
export const Globe = createIcon('globe');
export const DollarSign = createIcon('logo-usd');
export const Euro = createIcon('logo-euro');
export const Check = createIcon('checkmark');
export const CheckCircle = createIcon('checkmark-circle');
export const Package = createIcon('cube');
export const Bell = createIcon('notifications');
export const Phone = createIcon('call');
export const MessageCircle = createIcon('chatbubble');
export const CreditCard = createIcon('card');
export const Smartphone = createIcon('phone-portrait');
export const ShoppingCart = createIcon('cart');
export const ShoppingBag = createIcon('bag');
export const Truck = createIcon('car');
export const Wifi = createIcon('wifi');
export const WifiOff = createIcon('wifi-off', Feather);
export const Edit2 = createIcon('create');
export const Trash2 = createIcon('trash');
export const TrendingUp = createIcon('trending-up');
export const AlertCircle = createIcon('alert-circle');
export const Info = createIcon('information-circle');
export const Leaf = createIcon('leaf');
export const Flame = createIcon('flame');
export const Tag = createIcon('pricetag');
export const Flashlight = createIcon('flashlight');
export const FlashlightOff = createIcon('flashlight-outline');
export const RefreshCw = createIcon('refresh');
export const Settings = createIcon('settings');
export const HelpCircle = createIcon('help-circle');
export const Shield = createIcon('shield');
export const LogOut = createIcon('log-out');
export const Moon = createIcon('moon');
export const Sun = createIcon('sunny');
export const Volume2 = createIcon('volume-high');
export const VolumeX = createIcon('volume-mute');
export const Zap = createIcon('flash');
export const Navigation = createIcon('navigate');
export const Languages = createIcon('language');
export const FileText = createIcon('document-text');
export const BookOpen = createIcon('book');
export const Database = createIcon('server');

// Additional icons for compatibility
export const Heart = createIcon('heart');
export const Brain = createIcon('bulb');
export const Focus = createIcon('eye');
export const Dumbbell = createIcon('fitness');
export const Apple = createIcon('nutrition');
export const Sparkles = createIcon('sparkles');
export const AlertTriangle = createIcon('warning');

// Additional missing icons
export const Home = createIcon('home');
export const Briefcase = createIcon('briefcase');
export const MessageSquare = createIcon('chatbox', Ionicons);
export const Calendar = createIcon('calendar');
export const QrCode = createIcon('qr-code');
export const Search = createIcon('search');
export const Filter = createIcon('filter');
export const Sort = createIcon('swap-vertical');
export const Download = createIcon('download');
export const Upload = createIcon('cloud-upload');
export const Share = createIcon('share');
export const Copy = createIcon('copy');
export const Delete = createIcon('trash');
export const Edit = createIcon('pencil');
export const Save = createIcon('save');
export const Cancel = createIcon('close');
export const Confirm = createIcon('checkmark');
export const Warning = createIcon('warning');
export const Error = createIcon('alert-circle');
export const Success = createIcon('checkmark-circle');
export const Loading = createIcon('refresh');
export const Edit3 = createIcon('create');
export const Award = createIcon('trophy');
export const Camera = createIcon('camera');
export const Trophy = createIcon('trophy');
export const Activity = createIcon('pulse');
export const Utensils = createIcon('restaurant');

// New missing icons
export const ChevronLeft = createIcon('chevron-back');
export const ChevronDown = createIcon('chevron-down');
export const ChevronUp = createIcon('chevron-up');
export const Video = createIcon('videocam');
export const Send = createIcon('send');
export const ExternalLink = createIcon('open');
export const MoreHorizontal = createIcon('ellipsis-horizontal');
export const Book = createIcon('book');

// Additional needed icons
export const UserX = createIcon('person-remove');
export const ImageIcon = createIcon('image');
export const Type = createIcon('text');

// Social Media Icons
export const Instagram = createIcon('logo-instagram');
export const Facebook = createIcon('logo-facebook');
export const Tiktok = createIcon('logo-tiktok');
export const Twitter = createIcon('logo-twitter');
export const Linkedin = createIcon('logo-linkedin');
export const Youtube = createIcon('logo-youtube');
export const Share2 = createIcon('share-social');
