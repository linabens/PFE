import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, TextInput, Animated, Easing, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Search, Heart, Plus, Armchair, Sun, Moon, Flame,
  Bell, Star,
} from 'lucide-react-native';
import ProductImageFallback from '../../src/components/ui/ProductImageFallback';

import { useMenuStore } from '../../src/store/useMenuStore';
import { useCartStore } from '../../src/store/useCartStore';
import { useSessionStore } from '../../src/store/useSessionStore';
import { menuApi } from '../../src/api/menuApi';
import { assistanceApi } from '../../src/api/assistanceApi';
import { promotionApi } from '../../src/api/promotionApi';
import { API_BASE_URL } from '../../src/utils/constants';
import CallServerModal from '../../src/components/CallServerModal';

const { width } = Dimensions.get('window');

// ============================================
// WARM CREAM PALETTE
// ============================================
const C = {
  bg: '#FAF3EB',
  imgBg: '#F0E4D6',
  border: '#EAD9C9',
  primary: '#5C3221',
  secondaryText: '#7A5C4D',
  mainText: '#3D1C0C',
  cardBg: '#FFFFFF',
  tagline: '#BEA8A7',
  rosewood: '#C09891',
  searchIcon: '#B89A87'
};

const FONT = {
  playfair: 'PlayfairDisplay_700Bold',
  poppins: 'Poppins_400Regular',
  poppinsSemi: 'Poppins_600SemiBold',
};

export default function HomeScreen() {
  const router = useRouter();
  const { products, setProducts, categories, setCategories, isLoading, setLoading } = useMenuStore();
  const { addItem } = useCartStore();
  const { tableId, tableNumber } = useSessionStore();

  const [promotions, setPromotions] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [favorites, setFavorites] = useState({});
  const [toastMessage, setToastMessage] = useState(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callingStaff, setCallingStaff] = useState(false);

  // Animations
  const searchScale = useRef(new Animated.Value(1)).current;
  const skeletonOpacity = useRef(new Animated.Value(1)).current;
  const toastTranslateY = useRef(new Animated.Value(100)).current;

  // Blinking Dot
  const blinkAnim = useRef(new Animated.Value(0.3)).current;

  // Carousel Pagination
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchData();
    Animated.loop(
      Animated.sequence([
        Animated.timing(skeletonOpacity, { toValue: 0.4, duration: 600, useNativeDriver: true }),
        Animated.timing(skeletonOpacity, { toValue: 1, duration: 600, useNativeDriver: true })
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 0.3, duration: 800, useNativeDriver: true })
      ])
    ).start();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catsRes, prodsRes, promoRes] = await Promise.all([
        menuApi.getCategories(),
        menuApi.getProducts(),
        promotionApi.getPromotions()
      ]);
      
      if (catsRes.success && prodsRes.success) {
        setCategories([{ id: 'all', name: 'Tous' }, ...catsRes.data]);
        setProducts(prodsRes.data);
      }
      
      if (promoRes.success) {
        setPromotions(promoRes.data);
      }
    } catch (e) {
      console.error("Fetch data error details:", e);
      showToast('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    Animated.sequence([
      Animated.spring(toastTranslateY, { toValue: 0, useNativeDriver: true, friction: 6 }),
      Animated.delay(1800),
      Animated.timing(toastTranslateY, { toValue: 100, duration: 300, useNativeDriver: true })
    ]).start(() => setToastMessage(null));
  };

  const handleCallStaff = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowCallModal(true);
  };

  const confirmCallStaff = async () => {
    setCallingStaff(true);
    try {
      const res = await assistanceApi.requestAssistance(tableId || 1); 
      if (res.success) {
        setShowCallModal(false);
        showToast('Un serveur arrive à votre table');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        showToast(res.error || "Erreur de connexion");
      }
    } catch (e) {
      showToast("Erreur lors de l'appel");
    } finally {
      setCallingStaff(false);
    }
  };

  const handleAddToCart = (product) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addItem(product, 1);
    showToast(`${product.name} ajouté au panier`);
  };

  const toggleFavorite = (e, id) => {
    e.stopPropagation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredProducts = products.filter(p => {
    const matchCat = activeCategory === 'all' || p.category_id === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  // Dynamic lists from DB
  const tendancesList = products.filter(p => p.is_trending).slice(0, 4);
  const specialsList = products.filter(p => p.is_seasonal).slice(0, 3);

  // --- RENDERERS --- //

  const renderSkeleton = () => (
    <Animated.View style={[styles.card, { opacity: skeletonOpacity }]}>
      <View style={styles.cardImgZone} />
      <View style={{ padding: 10 }}>
        <View style={{ height: 10, backgroundColor: C.border, borderRadius: 6, marginBottom: 8, width: '80%' }} />
        <View style={{ height: 8, backgroundColor: C.border, borderRadius: 6, width: '40%' }} />
      </View>
    </Animated.View>
  );

  const renderProduct = ({ item }) => {
    const isFav = favorites[item.id];
    const badgeText = item.is_trending ? "Populaire" : null;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => router.push({ pathname: `/product/${item.id}`, params: { coffeeString: JSON.stringify(item) } })}
      >
        <View style={styles.cardImgZone}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.cardImg} resizeMode="cover" />
          ) : (
            <ProductImageFallback size={36} color={C.searchIcon} />
          )}

          <View style={styles.cardOverlayTop}>
            {badgeText ? (
              <View style={styles.pBadge}><Text style={styles.pBadgeText}>{badgeText}</Text></View>
            ) : <View />}
            <TouchableOpacity style={styles.favBtn} onPress={(e) => toggleFavorite(e, item.id)}>
              <Heart size={14} color={isFav ? '#C05C3A' : C.searchIcon} fill={isFav ? '#C05C3A' : 'transparent'} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.priceRow}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', paddingBottom: 2 }}>
              <Text style={styles.priceSymbol}>DT </Text>
              <Text style={styles.priceValue}>{Number(item.price).toFixed(2).replace('.', ',')}</Text>
            </View>
            <TouchableOpacity style={styles.cardAddBtn} onPress={(e) => { e.stopPropagation(); handleAddToCart(item); }}>
              <Plus size={16} color={C.bg} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* SECTION 1: HEADER */}
      <View style={styles.header}>
        <View style={styles.hBadge}>
          <Armchair size={12} color={C.primary} strokeWidth={2.25} style={{ marginRight: 4 }} />
          <Text style={styles.hBadgeText}>Table {tableNumber || 1}</Text>
        </View>
        <View style={styles.logoBlock}>
          <View style={{ flexDirection: 'row' }}>
            <Text style={[styles.logoFont, { color: C.mainText }]}>Brew</Text>
            <Text style={[styles.logoFont, { color: C.rosewood }]}>Luna</Text>
          </View>
          <Text style={styles.logoTagline}>COFFEE SHOP</Text>
        </View>
        <TouchableOpacity style={[styles.hBadge, styles.hBadgeLoyalty]} onPress={() => router.push('/loyalty')}>
          <Star size={12} color={C.bg} fill={C.bg} strokeWidth={2} style={{ marginRight: 4 }} />
          <Text style={[styles.hBadgeText, { color: C.bg }]}>Fidélité</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ListHeaderComponent={
          <View style={styles.contentPadding}>
            {/* SECTION 2: GREETING */}
            <View style={styles.greetingRow}>
              <View style={styles.greetingTitleRow}>
                {new Date().getHours() < 18 ? (
                  <Sun size={20} color={C.rosewood} strokeWidth={2} style={{ marginRight: 8 }} />
                ) : (
                  <Moon size={20} color={C.rosewood} strokeWidth={2} style={{ marginRight: 8 }} />
                )}
                <Text style={styles.greetingTitle}>{new Date().getHours() < 18 ? 'Bonjour' : 'Bonsoir'}</Text>
              </View>
              <Text style={styles.greetingSession}>Table {tableNumber || 1} · Session active</Text>
            </View>
            <Text style={styles.greetingSub}>Que souhaitez-vous déguster aujourd'hui ?</Text>

            {/* SECTION 3: SEARCH BAR */}
            <Animated.View style={[styles.searchWrapper, { transform: [{ scale: searchScale }] }, searchFocused && { borderColor: C.primary }]}>
              <Search size={14} color={C.searchIcon} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher un café, thé, pâtisserie..."
                placeholderTextColor="#BBA898"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => {
                  Animated.spring(searchScale, { toValue: 1.01, useNativeDriver: true }).start();
                  setSearchFocused(true);
                }}
                onBlur={() => {
                  Animated.spring(searchScale, { toValue: 1, useNativeDriver: true }).start();
                  setSearchFocused(false);
                }}
              />
            </Animated.View>

            {/* SECTION 5: OFFRES DU MOMENT (Dynamic Promotions) */}
            {promotions.length > 0 && (
              <View style={styles.sectionBlock}>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  pagingEnabled
                  snapToInterval={232} 
                  decelerationRate="fast"
                  onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
                  data={promotions}
                  keyExtractor={b => b.id.toString()}
                  renderItem={({ item }) => (
                    <View style={styles.bannerCard}>
                      <Image source={{ uri: item.image_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(44, 24, 16, 0.4)' }]} />
                      
                      <View style={styles.bannerTag}><Text style={styles.bannerTagTxt}>{item.tag || 'PROMO'}</Text></View>
                      <Text style={styles.bannerTitle}>{item.title}</Text>
                      <Text style={styles.bannerSub}>{item.subtitle}</Text>
                    </View>
                  )}
                />
                {/* Dots */}
                <View style={styles.dotsRow}>
                  {promotions.map((_, i) => {
                    const scale = scrollX.interpolate({ inputRange: [(i - 1) * 232, i * 232, (i + 1) * 232], outputRange: [8, 20, 8], extrapolate: 'clamp' });
                    const opacity = scrollX.interpolate({ inputRange: [(i - 1) * 232, i * 232, (i + 1) * 232], outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' });
                    return <Animated.View key={i} style={[styles.dot, { width: scale, opacity }]} />;
                  })}
                </View>
              </View>
            )}

            {/* SECTION 6: TENDANCES (Dynamic) */}
            {tendancesList.length > 0 && (
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Flame size={18} color={C.primary} strokeWidth={2} style={{ marginRight: 8 }} />
                    <Text style={styles.sectionTitle}>Tendances</Text>
                  </View>
                  <Text style={styles.sectionLink}>Voir tout →</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16, paddingHorizontal: 16 }}>
                  {tendancesList.map((tProduct, index) => {
                    const isFav = favorites[tProduct.id];
                    return (
                      <TouchableOpacity 
                        key={tProduct.id} 
                        style={styles.tCard}
                        onPress={() => router.push({ pathname: `/product/${tProduct.id}`, params: { coffeeString: JSON.stringify(tProduct) } })}
                      >
                        <View style={styles.tNumberBadge}><Text style={styles.tNumberTxt}>{index + 1}</Text></View>
                        <TouchableOpacity style={styles.tFavBtn} onPress={(e) => toggleFavorite(e, tProduct.id)}>
                          <Heart size={12} color={isFav ? '#C05C3A' : C.searchIcon} fill={isFav ? '#C05C3A' : 'transparent'} />
                        </TouchableOpacity>

                        <View style={styles.tImgZone}>
                          <Image source={{ uri: tProduct.image_url || 'https://via.placeholder.com/80' }} style={styles.tImg} resizeMode="cover" />
                        </View>

                        <Text style={styles.tName} numberOfLines={1}>{tProduct.name}</Text>
                        <Text style={styles.tPrice} numberOfLines={1}>DT {Number(tProduct.price).toFixed(2).replace('.', ',')}</Text>
                        <View style={styles.tStars}>
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star key={i} size={10} color={C.rosewood} fill={C.rosewood} strokeWidth={1.2} style={{ marginRight: 2 }} />
                          ))}
                        </View>

                        <TouchableOpacity style={styles.tAddBtn} onPress={() => handleAddToCart(tProduct)}>
                          <Plus size={16} color={C.bg} />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* SECTION 7: SPECIAL DU JOUR (Seasonal Products) */}
            {specialsList.length > 0 && (
              <View style={styles.sectionBlock}>
                <View style={[styles.sectionTitleRow, { marginBottom: 16 }]}>
                  <Sun size={18} color={C.primary} strokeWidth={2} style={{ marginRight: 8 }} />
                  <Text style={styles.sectionTitle}>Spécial du jour</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16, paddingHorizontal: 16 }}>
                  {specialsList.map(spec => (
                    <TouchableOpacity 
                      key={spec.id} 
                      style={styles.specCard}
                      onPress={() => router.push({ pathname: `/product/${spec.id}`, params: { coffeeString: JSON.stringify(spec) } })}
                    >
                      <View style={styles.specLeft}>
                        <Image source={{ uri: spec.image_url }} style={styles.specImg} />
                        <View style={styles.specBadge}><Text style={styles.specBadgeTxt}>SAISONNIER</Text></View>
                      </View>
                      <View style={styles.specRight}>
                        <View style={styles.specTimeRow}>
                          <Animated.View style={[styles.blinkDot, { opacity: blinkAnim }]} />
                          <Text style={styles.specTimeTxt}>Limité</Text>
                        </View>
                        <Text style={styles.specTitle}>{spec.name}</Text>
                        <Text style={styles.specDesc} numberOfLines={2}>{spec.description}</Text>
                        <View style={styles.specBot}>
                          <Text style={styles.specPrice}>DT {Number(spec.price).toFixed(2).replace('.', ',')}</Text>
                          <TouchableOpacity style={styles.specAdd} onPress={() => handleAddToCart(spec)}>
                            <Plus size={14} color={C.bg} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* SECTION 8: CATEGORIES */}
            <Text style={styles.catTitle}>Catégories</Text>
            <View style={styles.catScrollWrapper}>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={categories}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => {
                  const isActive = activeCategory === item.id;
                  return (
                    <TouchableOpacity
                      style={[styles.chip, isActive ? styles.chipActive : styles.chipInactive]}
                      onPress={() => setActiveCategory(item.id)}
                    >
                      <Text style={[styles.chipText, isActive ? styles.chipTextActive : styles.chipTextInactive]}>{item.name}</Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </View>
        }
        data={isLoading ? [1, 2, 3, 4] : filteredProducts}
        keyExtractor={(item, index) => isLoading ? index.toString() : item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={styles.gridWrapper}
        renderItem={isLoading ? renderSkeleton : renderProduct}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB: Call Staff */}
      <TouchableOpacity style={styles.fabStaff} onPress={handleCallStaff} activeOpacity={0.8} accessibilityLabel="Appeler un serveur">
        <Bell size={22} color={C.bg} strokeWidth={2.25} />
      </TouchableOpacity>

      {/* TOAST SYSTEM */}
      <Animated.View style={[styles.toastContainer, { transform: [{ translateY: toastTranslateY }] }]}>
        <Text style={styles.toastText}>{toastMessage}</Text>
      </Animated.View>

      {/* CALL STAFF MODAL */}
      <CallServerModal 
        visible={showCallModal}
        onClose={() => setShowCallModal(false)}
        onConfirm={confirmCallStaff}
        loading={callingStaff}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16 },
  hBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  hBadgeLoyalty: { backgroundColor: C.primary },
  hBadgeText: { color: C.primary, fontFamily: FONT.poppinsSemi, fontSize: 11 },
  logoBlock: { alignItems: 'center' },
  logoFont: { fontFamily: FONT.playfair, fontSize: 22 },
  logoTagline: { fontFamily: FONT.poppinsSemi, fontSize: 9, letterSpacing: 1.5, color: C.tagline, marginTop: -2 },
  contentPadding: { paddingHorizontal: 16 },
  greetingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 },
  greetingTitleRow: { flexDirection: 'row', alignItems: 'center' },
  greetingTitle: { fontFamily: FONT.playfair, fontSize: 18, color: C.mainText },
  greetingSession: { fontFamily: FONT.poppinsSemi, fontSize: 10, color: C.secondaryText, paddingBottom: 2 },
  greetingSub: { fontFamily: FONT.poppins, fontSize: 12, color: C.secondaryText, marginTop: 4, marginBottom: 20 },
  searchWrapper: { backgroundColor: C.cardBg, borderWidth: 1, borderColor: '#DDD3C4', borderRadius: 24, height: 42, flexDirection: 'row', alignItems: 'center', marginBottom: 24, paddingRight: 14 },
  searchIcon: { position: 'absolute', left: 14 },
  searchInput: { flex: 1, paddingLeft: 40, fontFamily: FONT.poppins, fontSize: 12, color: C.mainText },
  sectionBlock: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontFamily: FONT.playfair, fontSize: 16, color: C.primary },
  sectionLink: { fontFamily: FONT.poppinsSemi, fontSize: 11, color: C.rosewood },
  bannerCard: { width: 220, height: 110, backgroundColor: '#3D1C0C', borderRadius: 16, padding: 12, marginRight: 12, overflow: 'hidden', position: 'relative' },
  bannerTag: { backgroundColor: C.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, alignSelf: 'flex-start', marginBottom: 8 },
  bannerTagTxt: { color: C.mainText, fontSize: 9, fontFamily: FONT.poppins, fontWeight: 'bold' },
  bannerTitle: { color: 'white', fontFamily: FONT.playfair, fontSize: 15, fontWeight: 'bold' },
  bannerSub: { color: '#EAD9C9', fontFamily: FONT.poppins, fontSize: 10, marginTop: 2 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 12, gap: 4 },
  dot: { height: 6, backgroundColor: C.primary, borderRadius: 3 },
  tCard: { width: 110, backgroundColor: C.cardBg, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 8, marginRight: 12, position: 'relative' },
  tNumberBadge: { position: 'absolute', top: -5, left: -5, width: 20, height: 20, borderRadius: 10, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  tNumberTxt: { color: C.bg, fontSize: 10, fontWeight: 'bold' },
  tFavBtn: { position: 'absolute', top: 6, right: 6, zIndex: 1 },
  tImgZone: { height: 75, backgroundColor: C.imgBg, borderRadius: 12, marginBottom: 8, overflow: 'hidden' },
  tImg: { width: '100%', height: '100%' },
  tName: { fontFamily: FONT.playfair, fontSize: 12, color: C.mainText },
  tPrice: { fontFamily: FONT.poppins, fontSize: 10, color: C.secondaryText, fontWeight: 'bold', marginTop: 2 },
  tStars: { marginTop: 2, flexDirection: 'row', alignItems: 'center' },
  tAddBtn: { position: 'absolute', bottom: 6, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  specCard: { width: 240, flexDirection: 'row', backgroundColor: C.cardBg, borderRadius: 16, borderWidth: 1, borderColor: C.border, marginRight: 12, overflow: 'hidden', padding: 8 },
  specLeft: { width: 80, height: 80, backgroundColor: C.imgBg, borderRadius: 12, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  specImg: { width: '100%', height: '100%', borderRadius: 12 },
  specBadge: { position: 'absolute', bottom: -5, backgroundColor: C.rosewood, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  specBadgeTxt: { color: 'white', fontSize: 8, fontWeight: 'bold' },
  specRight: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
  specTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  blinkDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.rosewood },
  specTimeTxt: { color: C.rosewood, fontSize: 9, fontFamily: FONT.poppins, fontWeight: '600' },
  specTitle: { fontFamily: FONT.playfair, fontSize: 12, color: C.mainText, fontWeight: 'bold' },
  specDesc: { fontFamily: FONT.poppins, fontSize: 9, color: C.secondaryText, marginTop: 2, marginBottom: 6 },
  specBot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  specPrice: { fontFamily: FONT.poppins, fontSize: 11, fontWeight: 'bold', color: C.mainText },
  specAdd: { width: 20, height: 20, borderRadius: 10, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  catTitle: { fontFamily: FONT.playfair, fontSize: 14, color: C.mainText, marginBottom: 8 },
  catScrollWrapper: { marginBottom: 20, marginHorizontal: -16, paddingHorizontal: 16 },
  chip: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7, marginRight: 8 },
  chipActive: { backgroundColor: C.primary, borderWidth: 1.5, borderColor: C.primary },
  chipInactive: { backgroundColor: C.cardBg, borderWidth: 1.5, borderColor: '#C8B49A' },
  chipText: { fontFamily: FONT.poppins, fontSize: 12 },
  chipTextActive: { color: C.bg, fontWeight: '600' },
  chipTextInactive: { color: C.secondaryText },
  gridContent: { paddingBottom: 80, paddingHorizontal: 16 },
  gridWrapper: { justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  card: { flex: 1, backgroundColor: C.cardBg, borderWidth: 1, borderColor: C.border, borderRadius: 16, overflow: 'hidden' },
  cardImgZone: { height: 110, backgroundColor: C.imgBg, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  cardImg: { width: '100%', height: '100%' },
  cardOverlayTop: { position: 'absolute', top: 8, left: 8, right: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  pBadge: { backgroundColor: C.primary, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  pBadgeText: { color: C.bg, fontFamily: FONT.poppinsSemi, fontSize: 8 },
  favBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.cardBg, borderWidth: 1, borderColor: '#DDD3C4', alignItems: 'center', justifyContent: 'center' },
  cardInfo: { padding: 8, paddingTop: 10 },
  cardName: { fontFamily: FONT.playfair, fontSize: 13, color: C.mainText, marginBottom: 4 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceSymbol: { fontFamily: FONT.poppins, fontSize: 10, color: C.secondaryText },
  priceValue: { fontFamily: FONT.poppinsSemi, fontSize: 14, color: C.mainText },
  cardAddBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  fabStaff: { position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: C.rosewood, justifyContent: 'center', alignItems: 'center', shadowColor: C.secondaryText, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6, zIndex: 50 },
  toastContainer: { position: 'absolute', bottom: 20, alignSelf: 'center', backgroundColor: C.mainText, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, zIndex: 60, maxWidth: width - 48 },
  toastText: { color: C.bg, fontFamily: FONT.poppinsSemi, fontSize: 11, textAlign: 'center' }
});
