import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, SafeAreaView, Image, Animated, Easing, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Plus, Coffee, Heart } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { menuApi } from '../../src/api/menuApi';
import { useMenuStore } from '../../src/store/useMenuStore';
import { useCartStore } from '../../src/store/useCartStore';
import ChatFAB from '../../src/components/ChatFAB';
import ProductImageFallback from '../../src/components/ui/ProductImageFallback';

const { width } = Dimensions.get('window');

// ============================================
// WARM CREAM PALETTE (Synced with Home)
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

export default function PremiumMenuScreen() {
  const router = useRouter();
  const { categories, products, isLoading, setCategories, setProducts, setLoading, setError } = useMenuStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState('all');
  const [favorites, setFavorites] = useState({});
  const addItem = useCartStore((state) => state.addItem);

  // Entrance Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true);
      try {
        const [catsRes, prodsRes] = await Promise.all([
          menuApi.getCategories(),
          menuApi.getProducts()
        ]);
        
        if (catsRes.success) setCategories([{ id: 'all', name: 'Tous' }, ...catsRes.data]);
        if (prodsRes.success) setProducts(prodsRes.data);

        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 0, duration: 500, easing: Easing.out(Easing.exp), useNativeDriver: true })
        ]).start();

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (products.length === 0) {
      fetchMenu();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 500, easing: Easing.out(Easing.exp), useNativeDriver: true })
      ]).start();
    }
  }, []);

  const toggleFavorite = (e, id) => {
    e.stopPropagation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddToCart = (product) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addItem(product, 1);
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory = activeCategoryId === 'all' || p.category_id === activeCategoryId;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const renderProductCard = ({ item: coffee }) => {
    const isFav = favorites[coffee.id];
    const badgeText = coffee.is_trending ? "Populaire" : null;

    return (
      <TouchableOpacity 
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => router.push({
          pathname: `/product/${coffee.id}`,
          params: { coffeeString: JSON.stringify(coffee) }
        })}
      >
        <View style={styles.cardImgZone}>
          {coffee.image_url ? (
            <Image source={{ uri: coffee.image_url }} style={styles.cardImg} resizeMode="cover" />
          ) : (
            <ProductImageFallback size={36} color={C.searchIcon} />
          )}

          <View style={styles.cardOverlayTop}>
            {badgeText ? (
              <View style={styles.pBadge}><Text style={styles.pBadgeText}>{badgeText}</Text></View>
            ) : <View />}
            <TouchableOpacity style={styles.favBtn} onPress={(e) => toggleFavorite(e, coffee.id)}>
              <Heart size={14} color={isFav ? '#C05C3A' : C.searchIcon} fill={isFav ? '#C05C3A' : 'transparent'} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>{coffee.name}</Text>
          <View style={styles.priceRow}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', paddingBottom: 2 }}>
              <Text style={styles.priceSymbol}>DT </Text>
              <Text style={styles.priceValue}>{Number(coffee.price).toFixed(2).replace('.', ',')}</Text>
            </View>
            <TouchableOpacity style={styles.cardAddBtn} onPress={(e) => { e.stopPropagation(); handleAddToCart(coffee); }}>
              <Plus size={16} color={C.bg} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.topBar}>
        <Text style={styles.headerTitle}>Notre Carte</Text>
      </View>

      <View style={styles.searchBarContainer}>
        <Search size={18} color={C.searchIcon} style={styles.searchIcon} />
        <TextInput
          placeholder="Rechercher un café, thé..."
          placeholderTextColor="#BBA898"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.categoryWrapper}>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item) => item.id.toString()}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
          renderItem={({ item }) => {
            const isActive = activeCategoryId === item.id;
            return (
              <TouchableOpacity 
                style={[styles.chip, isActive ? styles.chipActive : styles.chipInactive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveCategoryId(item.id);
                }}
              >
                <Text style={[styles.chipText, isActive ? styles.chipTextActive : styles.chipTextInactive]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeContainer}>
      {isLoading && products.length === 0 ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={C.primary} size="large" />
          <Text style={styles.loadingText}>Chargement de la carte...</Text>
        </View>
      ) : (
        <Animated.FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          ListHeaderComponent={renderHeader}
          renderItem={renderProductCard}
          style={{ opacity: fadeAnim, transform: [{ translateY }] }}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Coffee size={48} color={C.searchIcon} strokeWidth={1.5} style={{ marginBottom: 12, opacity: 0.6 }} />
              <Text style={styles.emptyText}>Aucune boisson ne correspond à votre recherche.</Text>
            </View>
          )}
        />
      )}
      <ChatFAB />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: C.bg },
  headerContainer: { paddingTop: 20, backgroundColor: C.bg },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 20 },
  headerTitle: { fontSize: 32, fontFamily: FONT.playfair, color: C.mainText, letterSpacing: -0.5 },
  
  searchBarContainer: { 
    marginHorizontal: 16, 
    marginBottom: 24, 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: C.cardBg, 
    borderRadius: 24, 
    height: 46, 
    paddingHorizontal: 16, 
    borderWidth: 1, 
    borderColor: '#DDD3C4',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: '100%', fontSize: 13, color: C.mainText, fontFamily: FONT.poppins },
  
  categoryWrapper: { marginBottom: 20 },
  categoryScroll: { paddingHorizontal: 16, gap: 8 },
  chip: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7 },
  chipActive: { backgroundColor: C.primary, borderWidth: 1.5, borderColor: C.primary },
  chipInactive: { backgroundColor: C.cardBg, borderWidth: 1.5, borderColor: '#C8B49A' },
  chipText: { fontFamily: FONT.poppins, fontSize: 12 },
  chipTextActive: { color: C.bg, fontWeight: '600' },
  chipTextInactive: { color: C.secondaryText },
  
  listContent: { paddingBottom: 140 }, // Space for FAB and Floating Cart
  columnWrapper: { justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12, gap: 12 },
  
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
  
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, color: C.secondaryText, fontSize: 13, fontFamily: FONT.poppins },
  emptyContainer: { marginTop: 60, alignItems: 'center', paddingHorizontal: 32 },
  emptyText: { color: C.secondaryText, fontSize: 13, fontFamily: FONT.poppins, textAlign: 'center' }
});
