import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Dimensions,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { 
  ArrowLeft, 
  MapPin, 
  Star, 
  MessageCircle, 
  Phone, 
  Mail,
  ShoppingCart,
  Heart,
  Share,
  Award,
  CheckCircle,
  Truck,
  CreditCard,
  Shield,
  Info,
  Plus,
  Minus
} from '@/components/SmartIcons';
import { Colors } from '@/constants/colors';
import { TouchableScale } from '@/components/TouchableScale';

const { width: screenWidth } = Dimensions.get('window');

// Mock product data
const mockProduct = {
  id: '1',
  title: 'Artesanía Local Hecha a Mano',
  description: 'Hermosa pieza de artesanía elaborada por artesanos locales de Madrid. Cada pieza es única y refleja la tradición cultural de nuestra región.',
  price: 45.99,
  originalPrice: 65.99,
  images: [
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop'
  ],
  seller: {
    name: 'María Artesana',
    avatar: 'https://via.placeholder.com/60',
    rating: 4.8,
    reviewCount: 127,
    location: 'Madrid, España'
  },
  category: 'Artesanías',
  tags: ['Hecho a mano', 'Sostenible', 'Local'],
  specifications: [
    { label: 'Material', value: 'Cerámica y madera' },
    { label: 'Dimensiones', value: '15cm x 10cm x 8cm' },
    { label: 'Peso', value: '300g' },
    { label: 'Origen', value: 'Madrid, España' }
  ],
  features: [
    'Diseño único y original',
    'Materiales sostenibles',
    'Hecho por artesanos locales',
    'Perfecto para decoración',
    'Empaque eco-friendly'
  ],
  inStock: true,
  stockCount: 8,
  shipping: {
    free: true,
    estimatedDays: '2-3 días'
  }
};

export default function ProductDetailScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [product, setProduct] = useState(mockProduct);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleAddToCart = () => {
    Alert.alert(
      'Agregar al Carrito',
      `¿Agregar ${quantity} unidad${quantity > 1 ? 'es' : ''} de "${product.title}" al carrito?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Agregar', 
          onPress: () => {
            Alert.alert('¡Agregado!', `${quantity} producto${quantity > 1 ? 's' : ''} agregado${quantity > 1 ? 's' : ''} al carrito`);
          }
        }
      ]
    );
  };

  const handleBuyNow = () => {
    Alert.alert(
      'Comprar Ahora',
      `¿Proceder a comprar ${quantity} unidad${quantity > 1 ? 'es' : ''} por €${(product.price * quantity).toFixed(2)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Comprar', 
          onPress: () => {
            router.push('/payment');
          }
        }
      ]
    );
  };

  const handleContactSeller = () => {
    Alert.alert(
      'Contactar Vendedor',
      `¿Deseas contactar con ${product.seller.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Mensaje', onPress: () => router.push('/(tabs)/messages') },
        { 
          text: 'Ver Perfil', 
          onPress: () => router.push({
            pathname: '/user-profile',
            params: { userName: product.seller.name }
          })
        }
      ]
    );
  };

  const handleShare = () => {
    Alert.alert(
      'Compartir Producto',
      `Compartir "${product.title}"`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Compartir', onPress: () => console.log('Sharing product...') }
      ]
    );
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    Alert.alert(
      'Favoritos',
      isFavorite ? 
        'Producto eliminado de favoritos' : 
        'Producto agregado a favoritos'
    );
  };

  const incrementQuantity = () => {
    if (quantity < product.stockCount) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const renderImageItem = ({ item, index }: { item: string; index: number }) => (
    <TouchableScale
      style={styles.imageItem}
      onPress={() => setSelectedImageIndex(index)}
    >
      <Image source={{ uri: item }} style={styles.image} />
    </TouchableScale>
  );

  return (
    <ScrollView 
      style={[styles.container, { paddingTop: insets.top }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableScale 
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableScale>
        
        <View style={styles.headerActions}>
          <TouchableScale 
            style={styles.headerButton}
            onPress={handleFavorite}
          >
            <Heart size={24} color={isFavorite ? Colors.error : Colors.text} fill={isFavorite} />
          </TouchableScale>
          
          <TouchableScale 
            style={styles.headerButton}
            onPress={handleShare}
          >
            <Share size={24} color={Colors.text} />
          </TouchableScale>
        </View>
      </View>

      {/* Main Image */}
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: product.images[selectedImageIndex] }}
          style={styles.mainImage}
        />
        
        {/* Image Gallery */}
        <FlatList
          data={product.images}
          renderItem={renderImageItem}
          keyExtractor={(_, index) => index.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.imageGallery}
          contentContainerStyle={styles.imageGalleryContent}
        />
      </View>

      {/* Product Info */}
      <View style={styles.productInfo}>
        {/* Title and Price */}
        <View style={styles.titleSection}>
          <Text style={styles.productTitle}>{product.title}</Text>
          <View style={styles.priceSection}>
            <Text style={styles.currentPrice}>€{product.price.toFixed(2)}</Text>
            {product.originalPrice > product.price && (
              <Text style={styles.originalPrice}>€{product.originalPrice.toFixed(2)}</Text>
            )}
          </View>
        </View>

        {/* Tags */}
        <View style={styles.tagsContainer}>
          {product.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* Seller Info */}
        <TouchableScale 
          style={styles.sellerSection}
          onPress={handleContactSeller}
        >
          <Image 
            source={{ uri: product.seller.avatar }}
            style={styles.sellerAvatar}
          />
          <View style={styles.sellerInfo}>
            <Text style={styles.sellerName}>{product.seller.name}</Text>
            <View style={styles.sellerRating}>
              <Star size={16} color={Colors.gold} />
              <Text style={styles.ratingText}>{product.seller.rating}</Text>
              <Text style={styles.reviewCount}>({product.seller.reviewCount} reseñas)</Text>
            </View>
            <View style={styles.sellerLocation}>
              <MapPin size={14} color={Colors.textSecondary} />
              <Text style={styles.locationText}>{product.seller.location}</Text>
            </View>
          </View>
          <ArrowLeft size={16} color={Colors.textSecondary} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableScale>

        {/* Stock Status */}
        <View style={styles.stockSection}>
          <View style={styles.stockInfo}>
            <CheckCircle size={16} color={Colors.success} />
            <Text style={styles.stockText}>
              {product.inStock ? `En stock (${product.stockCount} disponibles)` : 'Agotado'}
            </Text>
          </View>
          
          {/* Quantity Selector */}
          <View style={styles.quantitySelector}>
            <Text style={styles.quantityLabel}>Cantidad:</Text>
            <View style={styles.quantityControls}>
              <TouchableScale 
                style={[styles.quantityButton, quantity <= 1 && styles.quantityButtonDisabled]}
                onPress={decrementQuantity}
                disabled={quantity <= 1}
              >
                <Minus size={16} color={quantity <= 1 ? Colors.textSecondary : Colors.text} />
              </TouchableScale>
              
              <Text style={styles.quantityText}>{quantity}</Text>
              
              <TouchableScale 
                style={[styles.quantityButton, quantity >= product.stockCount && styles.quantityButtonDisabled]}
                onPress={incrementQuantity}
                disabled={quantity >= product.stockCount}
              >
                <Plus size={16} color={quantity >= product.stockCount ? Colors.textSecondary : Colors.text} />
              </TouchableScale>
            </View>
          </View>
        </View>

        {/* Shipping Info */}
        <View style={styles.shippingSection}>
          <View style={styles.shippingItem}>
            <Truck size={18} color={Colors.primary} />
            <Text style={styles.shippingText}>
              {product.shipping.free ? 'Envío gratuito' : 'Envío con costo'} • {product.shipping.estimatedDays}
            </Text>
          </View>
          
          <View style={styles.shippingItem}>
            <Shield size={18} color={Colors.primary} />
            <Text style={styles.shippingText}>Compra protegida</Text>
          </View>
          
          <View style={styles.shippingItem}>
            <CreditCard size={18} color={Colors.primary} />
            <Text style={styles.shippingText}>Pago seguro</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.descriptionText}>{product.description}</Text>
        </View>

        {/* Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Características</Text>
          {product.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <CheckCircle size={16} color={Colors.success} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* Specifications */}
        <View style={styles.specificationsSection}>
          <Text style={styles.sectionTitle}>Especificaciones</Text>
          {product.specifications.map((spec, index) => (
            <View key={index} style={styles.specificationItem}>
              <Text style={styles.specLabel}>{spec.label}:</Text>
              <Text style={styles.specValue}>{spec.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableScale
          style={styles.addToCartButton}
          onPress={handleAddToCart}
        >
          <ShoppingCart size={20} color={Colors.primary} />
          <Text style={styles.addToCartText}>Agregar</Text>
        </TouchableScale>

        <TouchableScale
          style={styles.buyNowButton}
          onPress={handleBuyNow}
        >
          <Text style={styles.buyNowText}>Comprar €{(product.price * quantity).toFixed(2)}</Text>
        </TouchableScale>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  imageContainer: {
    backgroundColor: Colors.white,
  },
  mainImage: {
    width: screenWidth,
    height: screenWidth,
    backgroundColor: Colors.secondary,
  },
  imageGallery: {
    marginTop: 12,
  },
  imageGalleryContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  imageItem: {
    marginRight: 8,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: Colors.secondary,
  },
  productInfo: {
    backgroundColor: Colors.white,
    padding: 20,
    marginTop: 8,
  },
  titleSection: {
    marginBottom: 16,
  },
  productTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  originalPrice: {
    fontSize: 18,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 8,
  },
  tag: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '500',
  },
  sellerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    marginBottom: 20,
  },
  sellerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  sellerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  ratingText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  reviewCount: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  sellerLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  stockSection: {
    marginBottom: 20,
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  stockText: {
    fontSize: 16,
    color: Colors.success,
    fontWeight: '500',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityLabel: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    backgroundColor: Colors.background,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    minWidth: 24,
    textAlign: 'center',
  },
  shippingSection: {
    padding: 16,
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  shippingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shippingText: {
    fontSize: 14,
    color: Colors.text,
  },
  descriptionSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  featuresSection: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 16,
    color: Colors.text,
  },
  specificationsSection: {
    marginBottom: 20,
  },
  specificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  specLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  specValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  addToCartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: 8,
  },
  addToCartText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  buyNowButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  buyNowText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
});