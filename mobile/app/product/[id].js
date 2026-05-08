import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, Platform, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Heart, Check, AlertCircle, Coffee, Snowflake } from 'lucide-react-native';
import ProductImageFallback from '../../src/components/ui/ProductImageFallback';
import { useCartStore } from '../../src/store/useCartStore';
import { menuApi } from '../../src/api/menuApi';

const { height } = Dimensions.get('window');

// ============================================
// WARM CREAM PALETTE (Synced with Home)
// ============================================
const C = {
  bg: '#FAF3EB',       // cream warm
  imgBg: '#F0E4D6',    // sand
  border: '#EAD9C9',   // borders/separators
  primary: '#5C3221',  // espresso
  secondaryText: '#7A5C4D', // mocha
  mainText: '#3D1C0C', // dark brown
  cardBg: '#FFFFFF',   // white
  rosewood: '#C09891',
};

const FONT = {
  playfair: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  poppins: Platform.OS === 'ios' ? 'System' : 'sans-serif'
};

const SIZES = [
  { id: 'S', label: 'S', mult: 1 },
  { id: 'M', label: 'M', mult: 1.25 },
  { id: 'L', label: 'L', mult: 1.5 }
];

const TOPPINGS_LIST = [
  { id: 'vanille', name: 'Sirop de Vanille', price: 1.5 },
  { id: 'caramel', name: 'Caramel beurre salé', price: 1.5 },
  { id: 'shot', name: 'Shot d\'espresso', price: 2.0 },
  { id: 'chantilly', name: 'Crème Chantilly', price: 1.0 },
];

export default function ProductDetailScreen() {
  const { id, coffeeString } = useLocalSearchParams();
  const router = useRouter();
  const { addItem } = useCartStore();

  const [product, setProduct] = useState(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [sizeObj, setSizeObj] = useState(SIZES[1]); // Default 'M'
  const [selectedToppings, setSelectedToppings] = useState({});
  const [isFavorite, setIsFavorite] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  // Toast animation
  const [toastMessage, setToastMessage] = useState(null);
  const toastTranslateY = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      try {
        if (coffeeString) {
          setProduct(JSON.parse(coffeeString));
          setLoading(false);
          return;
        }
        const res = await menuApi.getProductById(id);
        if (res.success) setProduct(res.data);
        else setError('Produit introuvable.');
      } catch (err) {
        setError('Erreur réseau.');
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [id, coffeeString]);

  const showToast = (msg) => {
    setToastMessage(msg);
    Animated.sequence([
      Animated.spring(toastTranslateY, { toValue: 0, useNativeDriver: true, friction: 6 }),
      Animated.delay(1500),
      Animated.timing(toastTranslateY, { toValue: 100, duration: 300, useNativeDriver: true })
    ]).start(() => setToastMessage(null));
  };

  const toggleTopping = (topping) => {
    Haptics.selectionAsync();
    setSelectedToppings(prev => {
      const isChecked = !!prev[topping.id];
      const newToppings = { ...prev };
      if (isChecked) delete newToppings[topping.id];
      else newToppings[topping.id] = topping;
      return newToppings;
    });
  };

  const handleAddToCart = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Formatting the options string
    const toppingsArr = Object.values(selectedToppings).map(t => t.name);
    const finalOptions = [sizeObj.label, ...toppingsArr];

    addItem({ 
      ...product, 
      price: computedPrice, 
      options: finalOptions
    }, 1);

    showToast('Ajouté au panier');
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={[styles.container, styles.center]}>
        <AlertCircle size={48} color={C.rosewood} style={{ marginBottom: 16 }} />
        <Text style={{ fontSize: 16, fontFamily: FONT.poppins, color: C.mainText, marginBottom: 16 }}>{error || 'Coffee not found'}</Text>
        <TouchableOpacity style={styles.backBtnFallback} onPress={() => router.back()}>
          <Text style={{ color: C.bg, fontFamily: FONT.poppins, fontWeight: 'bold' }}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Dynamic Computation
  const basePrice = Number(product.price);
  const toppingsPrice = Object.values(selectedToppings).reduce((sum, t) => sum + t.price, 0);
  const computedPrice = (basePrice * sizeObj.mult) + toppingsPrice;

  // Mock pseudo tags for realism
  const isCold = product.category_id === 4;
  const volumeStr = sizeObj.id === 'S' ? '250ml' : sizeObj.id === 'M' ? '350ml' : '450ml';

  return (
    <View style={styles.container}>
      {/* Top Half: Image */}
      <View style={styles.imgWrapper}>
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} style={styles.headerImage} />
        ) : (
          <View style={styles.emojiFallback}>
            <ProductImageFallback size={72} color={C.rosewood} />
          </View>
        )}
      </View>
      
      {/* Absolute Header Icons */}
      <View style={styles.appBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={C.mainText} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.iconBtn} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsFavorite(!isFavorite);
          }}
        >
          <Heart size={20} color={isFavorite ? C.rosewood : C.mainText} fill={isFavorite ? C.rosewood : 'transparent'} />
        </TouchableOpacity>
      </View>

      {/* Bottom Half: Sliding Card */}
      <ScrollView 
        contentContainerStyle={styles.bottomSheet}
        style={styles.sheetScroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.title}>{product.name}</Text>

        {/* Tags Row */}
        <View style={styles.tagsRow}>
          <View style={styles.tagPill}>
            {isCold ? (
              <Snowflake size={12} color="#FFF8F0" strokeWidth={2} style={{ marginRight: 6 }} />
            ) : (
              <Coffee size={12} color="#FFF8F0" strokeWidth={2} style={{ marginRight: 6 }} />
            )}
            <Text style={styles.tagText}>{isCold ? 'Froid' : 'Chaud'}</Text>
          </View>
          <View style={styles.tagPill}><Text style={styles.tagText}>{volumeStr}</Text></View>
          <View style={styles.tagPill}><Text style={styles.tagText}>Caféine moyenne</Text></View>
        </View>

        {/* Description */}
        <TouchableOpacity onPress={() => setDescExpanded(!descExpanded)} activeOpacity={0.8}>
          <Text style={styles.description} numberOfLines={descExpanded ? undefined : 2}>
            {product.description || "Une création signature exquise finement préparée. Ce délicieux breuvage allie la perfection de nos grains artisanaux à une touche veloutée, assurant une expérience inoubliable pour tout amateur de café."}
          </Text>
          {!descExpanded && <Text style={styles.voirPlus}>voir plus</Text>}
        </TouchableOpacity>

        {/* Personnalisation */}
        <Text style={styles.sectionTitle}>Personnaliser</Text>
        <View style={styles.sizeRow}>
          {SIZES.map(s => {
            const isSelected = sizeObj.id === s.id;
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.sizePill, isSelected && styles.sizePillActive]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSizeObj(s);
                }}
              >
                <Text style={[styles.sizeTxt, isSelected && styles.sizeTxtActive]}>{s.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Toppings (Checkboxes) */}
        <Text style={styles.sectionTitle}>Suppléments</Text>
        <View style={styles.toppingsWrapper}>
          {TOPPINGS_LIST.map(topping => {
            const isChecked = !!selectedToppings[topping.id];
            return (
              <TouchableOpacity 
                key={topping.id} 
                style={styles.checkboxRow} 
                onPress={() => toggleTopping(topping)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkboxSquare, isChecked && styles.checkboxSquareActive]}>
                  {isChecked && <Check size={12} color={C.bg} strokeWidth={3} />}
                </View>
                <Text style={styles.checkboxLabel}>{topping.name}</Text>
                <Text style={styles.checkboxPrice}>+{topping.price.toFixed(2)} DT</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating Checkout Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerPrice}>{computedPrice.toFixed(2)} DT</Text>
        <TouchableOpacity style={styles.addToCartBtn} onPress={handleAddToCart}>
          <Text style={styles.addText}>Ajouter au panier</Text>
        </TouchableOpacity>
      </View>

      {/* TOAST SYSTEM */}
      <Animated.View style={[styles.toastContainer, { transform: [{ translateY: toastTranslateY }] }]}>
        <Text style={styles.toastText}>{toastMessage}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.imgBg },
  center: { justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  
  imgWrapper: { position: 'absolute', top: 0, width: '100%', height: height * 0.55 },
  headerImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  emojiFallback: { width: '100%', height: '100%', backgroundColor: C.imgBg, justifyContent: 'center', alignItems: 'center' },
  
  appBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 60 : 40, position: 'absolute', width: '100%', zIndex: 10 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6 },
  
  sheetScroll: { marginTop: height * 0.45, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: C.bg, overflow: 'hidden' },
  bottomSheet: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 28 },
  
  title: { fontSize: 22, fontFamily: FONT.playfair, color: C.mainText, marginBottom: 12 },
  
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.primary,
    borderWidth: 1,
    borderColor: C.secondaryText,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  tagText: { fontFamily: FONT.poppins, fontSize: 10, color: '#FFF8F0' },
  
  description: { fontFamily: FONT.poppins, fontSize: 12, color: C.secondaryText, lineHeight: 18 },
  voirPlus: { fontFamily: FONT.poppins, fontSize: 12, color: C.primary, fontWeight: '700', marginTop: 4, marginBottom: 24 },
  
  sectionTitle: { fontSize: 16, fontFamily: FONT.playfair, color: C.mainText, marginBottom: 12, marginTop: 12 },
  
  sizeRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  sizePill: { flex: 1, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: C.rosewood, backgroundColor: 'transparent', alignItems: 'center' },
  sizePillActive: { backgroundColor: C.secondaryText, borderColor: C.secondaryText },
  sizeTxt: { fontFamily: FONT.poppins, fontSize: 13, color: C.rosewood },
  sizeTxtActive: { color: C.bg, fontWeight: 'bold' },
  
  toppingsWrapper: { gap: 12, marginBottom: 16 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center' },
  checkboxSquare: { width: 16, height: 16, borderRadius: 4, borderWidth: 1.5, borderColor: C.rosewood, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  checkboxSquareActive: { backgroundColor: C.secondaryText, borderColor: C.secondaryText },
  checkboxLabel: { flex: 1, fontFamily: FONT.poppins, fontSize: 13, color: C.mainText },
  checkboxPrice: { fontFamily: FONT.poppins, fontSize: 12, color: C.secondaryText, fontWeight: '600' },
  
  footer: { position: 'absolute', bottom: 0, width: '100%', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 40 : 20, backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.border },
  footerPrice: { fontFamily: FONT.playfair, fontSize: 20, color: C.mainText, width: 100 },
  addToCartBtn: { flex: 1, backgroundColor: C.primary, paddingVertical: 14, borderRadius: 24, alignItems: 'center' },
  addText: { color: C.bg, fontSize: 13, fontFamily: FONT.poppins, fontWeight: 'bold' },
  
  backBtnFallback: { backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16 },

  toastContainer: { position: 'absolute', bottom: 100, alignSelf: 'center', backgroundColor: C.mainText, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24, zIndex: 60, elevation: 5 },
  toastText: { color: C.bg, fontFamily: FONT.poppins, fontSize: 12, fontWeight: 'bold' }
});
