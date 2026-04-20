import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, SafeAreaView, Image, Animated, Easing, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, ShoppingCart, Star, Plus } from 'lucide-react-native';
import { menuApi } from '../../src/api/menuApi';
import { useMenuStore } from '../../src/store/useMenuStore';
import { useCartStore } from '../../src/store/useCartStore';

const { width } = Dimensions.get('window');

// Premium Palette Sync
const P_COLORS = {
  bg: '#FDFBF7',
  card: '#FFFFFF',
  text: '#3E2723',
  subtext: '#8D6E63',
  primary: '#D7CCC8',
  accent: '#A1887F',
  pill: '#F5F5F5'
};

export default function PremiumMenuScreen() {
  const router = useRouter();
  const { categories, products, isLoading, setCategories, setProducts, setLoading, setError } = useMenuStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState('all');
  const itemCount = useCartStore((state) => state.getItemCount());
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
        
        if (catsRes.success) setCategories([{ id: 'all', name: 'All' }, ...catsRes.data]);
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

    fetchMenu();
  }, [fadeAnim, translateY]);

  const filteredProducts = products.filter((p) => {
    const matchesCategory = activeCategoryId === 'all' || p.category_id === activeCategoryId;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const renderProductCard = ({ item: coffee }) => {
    const rating = coffee.rating || (Math.random() * (5 - 4) + 4).toFixed(1);

    return (
      <TouchableOpacity 
        style={styles.gridCard}
        activeOpacity={0.9}
        onPress={() => router.push({
          pathname: `/product/${coffee.id}`,
          params: { coffeeString: JSON.stringify(coffee) }
        })}
      >
        <Image 
          source={{ uri: coffee.image_url || 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?q=80&w=400&h=400&auto=format&fit=crop' }} 
          style={styles.gridImg} 
        />
        <View style={styles.gridContent}>
          <Text style={styles.gridTitle} numberOfLines={1}>{coffee.name}</Text>
          <Text style={styles.gridSub} numberOfLines={1}>{coffee.description || 'Rich & creamy'}</Text>
          
          <View style={styles.gridFooter}>
            <Text style={styles.gridPrice}>{Number(coffee.price).toFixed(2)} DT</Text>
            <TouchableOpacity 
              style={styles.gridAddBtn}
              onPress={(e) => {
                e.stopPropagation();
                addItem(coffee, 1);
              }}
            >
              <Plus size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.topBar}>
        <Text style={styles.headerTitle}>Full Menu</Text>
        <TouchableOpacity style={styles.cartBtn} onPress={() => router.push('/cart')}>
          <ShoppingCart size={24} color={P_COLORS.text} />
          {itemCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{itemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.searchBarContainer}>
        <Search size={18} color={P_COLORS.subtext} style={styles.searchIcon} />
        <TextInput
          placeholder="What are you craving?"
          placeholderTextColor={P_COLORS.subtext}
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Pill Category Tabs matching the Home Screen */}
      <View style={styles.categoryWrapper}>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item) => item.id.toString()}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.categoryTab, activeCategoryId === item.id && styles.categoryTabActive]}
              onPress={() => setActiveCategoryId(item.id)}
            >
              <Text style={[styles.categoryText, activeCategoryId === item.id && styles.categoryTextActive]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeContainer}>
      {isLoading && products.length === 0 ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={P_COLORS.text} size="large" />
          <Text style={styles.loadingText}>Brewing your catalog...</Text>
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
              <Text style={styles.emptyText}>No drinks found.</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: P_COLORS.bg },
  headerContainer: { paddingTop: 20, backgroundColor: P_COLORS.bg },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 24 },
  headerTitle: { fontSize: 32, fontWeight: '800', color: P_COLORS.text, letterSpacing: -0.5 },
  cartBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-end', position: 'relative' },
  cartBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#EF5350', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: P_COLORS.bg },
  cartBadgeText: { fontSize: 10, fontWeight: 'bold', color: 'white' },
  
  searchBarContainer: { marginHorizontal: 24, marginBottom: 24, flexDirection: 'row', alignItems: 'center', backgroundColor: P_COLORS.card, borderRadius: 100, paddingHorizontal: 16, height: 56, borderWidth: 1, borderColor: '#F0EBE1', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: '100%', fontSize: 16, color: P_COLORS.text },
  
  categoryWrapper: { marginBottom: 24 },
  categoryScroll: { paddingHorizontal: 24, gap: 12 },
  categoryTab: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 100, backgroundColor: P_COLORS.card, borderWidth: 1, borderColor: '#F0EBE1' },
  categoryTabActive: { backgroundColor: P_COLORS.text, borderColor: P_COLORS.text },
  categoryText: { color: P_COLORS.subtext, fontWeight: '600', fontSize: 14 },
  categoryTextActive: { color: 'white' },
  
  listContent: { paddingBottom: 120 },
  columnWrapper: { justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 16 },
  
  gridCard: { width: (width - 64) / 2, backgroundColor: P_COLORS.card, borderRadius: 24, padding: 12, borderWidth: 1, borderColor: '#F0EBE1', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10 },
  gridImg: { width: '100%', height: 120, borderRadius: 16, resizeMode: 'cover', marginBottom: 12 },
  gridContent: { flex: 1, justifyContent: 'space-between' },
  gridTitle: { fontSize: 16, fontWeight: 'bold', color: P_COLORS.text, marginBottom: 4 },
  gridSub: { fontSize: 12, color: P_COLORS.subtext, marginBottom: 12 },
  gridFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gridPrice: { fontSize: 16, fontWeight: '800', color: P_COLORS.text },
  gridAddBtn: { backgroundColor: P_COLORS.text, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, color: P_COLORS.subtext, fontSize: 15, fontWeight: '500' },
  emptyContainer: { marginTop: 60, alignItems: 'center' },
  emptyText: { color: P_COLORS.subtext, fontSize: 16 }
});
