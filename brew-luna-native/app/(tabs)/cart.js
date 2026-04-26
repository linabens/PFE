import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, SafeAreaView, ActivityIndicator, Alert, Animated, PanResponder, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Trash2, Minus, Plus, ShoppingBag } from 'lucide-react-native';

import { useCartStore } from '../../src/store/useCartStore';
import { useSessionStore } from '../../src/store/useSessionStore';
import { useOrderStore } from '../../src/store/useOrderStore';
import { orderApi } from '../../src/api/orderApi';
import { useLoyalty } from '../../src/context/LoyaltyContext';
import PointsToast from '../../src/components/PointsToast';

// ============================================
// WARM CREAM PALETTE
// ============================================
const C = {
  bg: '#FAF3EB',       // cream warm
  imgBg: '#F0E4D6',    // sand
  border: '#EAD9C9',   // borders/separators
  primary: '#5C3221',  // espresso
  secondaryText: '#7A5C4D', // mocha
  mainText: '#3D1C0C', // dark brown
  lightText: '#8D7B6C', // lighter subtext
  cardBg: '#FFFFFF',   // white
  rosewood: '#C09891',
};

const FONT = {
  playfair: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  poppins: Platform.OS === 'ios' ? 'System' : 'sans-serif'
};

// Custom Swipeable Row
const SwipeableItem = ({ item, onRemove, onUpdateQuantity }) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const SWIPE_THRESHOLD = -60;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => Math.abs(gestureState.dx) > 10,
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dx < 0) { // Only swipe left
          pan.setValue({ x: gestureState.dx, y: 0 });
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx < SWIPE_THRESHOLD) {
          Animated.spring(pan, { toValue: { x: -80, y: 0 }, useNativeDriver: true }).start();
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
        }
      }
    })
  ).current;

  const formattedOptions = item.options?.join(' · ') || '';

  return (
    <View style={styles.swipeContainer}>
      {/* Hidden Trash Background */}
      <View style={styles.hiddenAction}>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => onRemove(item.id)}>
          <Trash2 size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
      
      {/* Foreground Draggable Row */}
      <Animated.View style={[styles.cartItem, { transform: [{ translateX: pan.x }] }]} {...panResponder.panHandlers}>
        <View style={styles.itemImageWrapper}>
          <Image source={{ uri: item.image_url || 'https://via.placeholder.com/48' }} style={styles.itemImage} resizeMode="cover" />
        </View>

        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          {formattedOptions !== '' && <Text style={styles.itemOptions} numberOfLines={1}>{formattedOptions}</Text>}
          <Text style={styles.itemPrice}>{Number(item.price * item.quantity).toFixed(2)} DT</Text>
        </View>

        <View style={styles.qtyContainer}>
          <TouchableOpacity 
            style={styles.qtyBtn} 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (item.quantity <= 1) onRemove(item.id);
              else onUpdateQuantity(item.id, item.quantity - 1);
            }}
          >
            <Minus size={14} color={C.bg} />
          </TouchableOpacity>
          
          <Text style={styles.qtyText}>{item.quantity}</Text>
          
          <TouchableOpacity 
            style={styles.qtyBtn} 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onUpdateQuantity(item.id, item.quantity + 1);
            }}
          >
            <Plus size={14} color={C.bg} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

export default function CartScreen() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, getTotal, clearCart } = useCartStore();
  const { tableId, tableNumber } = useSessionStore();
  const { setCurrentOrder } = useOrderStore();
  const { isLoggedIn, earnPoints } = useLoyalty();

  const [isPlacing, setIsPlacing] = useState(false);
  const [toastPts, setToastPts]   = useState(0);
  const [showToast, setShowToast] = useState(false);

  const subtotal = getTotal();
  const tax = subtotal * 0.19; // 19% TVA
  const finalTotal = subtotal + tax;

  const handleCheckout = async () => {
    if (items.length === 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsPlacing(true);

    try {
      const orderData = {
        table_id: tableId || 1,
        items: items.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          options: item.options || [],
          unit_price: item.price
        }))
      };

      const response = await orderApi.createOrder(orderData);
      
      if (response.success) {
        setCurrentOrder(response.data.id, response.data.status);
      } else {
        throw new Error('API Error');
      }
    } catch (err) {
      setCurrentOrder("MOCK_ORD_" + Math.floor(Math.random()*1000), "pending");
    } finally {
      // Calcul et attribution des points de fidélité
      if (isLoggedIn) {
        const pts = Math.floor(finalTotal * 10);
        if (pts > 0) {
          earnPoints(pts, 'order', `Commande table ${tableNumber || 1}`);
          setToastPts(pts);
          setShowToast(true);
        }
      }

      // Build exactly the PDF payload
      const receiptPayload = {
        items,
        subtotal,
        tax,
        finalTotal,
        tableNumber: tableNumber || 1,
        date: new Date().toLocaleDateString('fr-FR'),
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      };

      clearCart();
      setIsPlacing(false);
      
      // Navigate to the shiny new PDF screen!
      router.push({ pathname: '/order-confirmation', params: { payload: JSON.stringify(receiptPayload) } });
    }
  };

  const handleClearCart = () => {
    Alert.alert(
      "Vider le panier",
      "Êtes-vous sûr de vouloir supprimer tous les articles ?",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Vider", style: "destructive", onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          clearCart();
        }}
      ]
    );
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyWrapper}>
          <ShoppingBag size={64} color={C.border} style={{ marginBottom: 16 }} />
          <Text style={styles.emptyTitle}>Votre panier est vide</Text>
          <Text style={styles.emptySub}>Découvrez nos offres du moment et laissez-vous tenter !</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/home')}>
            <Text style={styles.browseBtnText}>Voir la carte</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mon panier</Text>
        <TouchableOpacity style={styles.trashHeaderBtn} onPress={handleClearCart}>
          <Trash2 size={20} color={C.rosewood} />
        </TouchableOpacity>
      </View>

      {/* Cart Items */}
      <FlatList
        data={items}
        renderItem={({ item }) => (
          <SwipeableItem 
            item={item} 
            onRemove={(id) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              removeItem(id);
            }} 
            onUpdateQuantity={updateQuantity} 
          />
        )}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Footer Invoice & CTA */}
      <View style={styles.bottomSheet}>
        <View style={styles.divider} />
        
        <View style={styles.invoiceRow}>
          <Text style={styles.invoiceLabel}>Sous-total</Text>
          <Text style={styles.invoiceValue}>{subtotal.toFixed(2)} DT</Text>
        </View>
        <View style={styles.invoiceRow}>
          <Text style={styles.invoiceLabel}>TVA (19%)</Text>
          <Text style={styles.invoiceValue}>{tax.toFixed(2)} DT</Text>
        </View>
        
        <View style={[styles.invoiceRow, { marginTop: 8, marginBottom: 20 }]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{finalTotal.toFixed(2)} DT</Text>
        </View>

        <TouchableOpacity 
          style={styles.ctaBtn} 
          onPress={handleCheckout} 
          disabled={isPlacing}
          activeOpacity={0.9}
        >
          {isPlacing ? (
            <ActivityIndicator color={C.bg} />
          ) : (
            <Text style={styles.ctaText}>Confirmer la commande</Text>
          )}
        </TouchableOpacity>
        
        <Text style={styles.tableText}>Table {tableNumber || 1} · Paiement à la caisse</Text>
      </View>
      <PointsToast 
        points={toastPts} 
        reason={`Commande table ${tableNumber || 1}`}
        icon="bag-handle-outline"
        visible={showToast}
        onHide={() => setShowToast(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 30, paddingBottom: 20 },
  headerTitle: { fontFamily: FONT.playfair, fontSize: 28, color: C.mainText },
  trashHeaderBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.imgBg, justifyContent: 'center', alignItems: 'center' },

  listContent: { paddingHorizontal: 24, paddingBottom: 100 },
  
  swipeContainer: { marginBottom: 16, overflow: 'hidden', borderRadius: 16 },
  hiddenAction: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, backgroundColor: '#E57373', borderRadius: 16, justifyContent: 'center', alignItems: 'flex-end', paddingRight: 24 },
  
  cartItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.cardBg, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: C.border },
  
  itemImageWrapper: { width: 48, height: 48, borderRadius: 12, backgroundColor: C.imgBg, overflow: 'hidden' },
  itemImage: { width: '100%', height: '100%' },
  
  itemInfo: { flex: 1, marginLeft: 12 },
  itemName: { fontFamily: FONT.poppins, fontSize: 13, color: C.mainText, fontWeight: 'bold', marginBottom: 2 },
  itemOptions: { fontFamily: FONT.poppins, fontSize: 10, color: C.lightText, marginBottom: 4 },
  itemPrice: { fontFamily: FONT.poppins, fontSize: 12, color: C.rosewood, fontWeight: '600' },
  
  qtyContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4 },
  qtyBtn: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.secondaryText, alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontFamily: FONT.poppins, fontSize: 13, color: C.mainText, fontWeight: 'bold', minWidth: 14, textAlign: 'center' },
  
  bottomSheet: { paddingHorizontal: 24, paddingBottom: 30 },
  divider: { height: 1, backgroundColor: C.border, marginBottom: 20 },
  
  invoiceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  invoiceLabel: { fontFamily: FONT.poppins, fontSize: 13, color: C.lightText },
  invoiceValue: { fontFamily: FONT.poppins, fontSize: 13, color: C.mainText, fontWeight: '600' },
  
  totalLabel: { fontFamily: FONT.poppins, fontSize: 15, color: C.mainText, fontWeight: '800' },
  totalValue: { fontFamily: FONT.poppins, fontSize: 18, color: C.mainText, fontWeight: '800' },
  
  ctaBtn: { backgroundColor: C.primary, paddingVertical: 18, borderRadius: 30, alignItems: 'center', marginBottom: 12, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  ctaText: { fontFamily: FONT.poppins, fontSize: 14, color: C.bg, fontWeight: 'bold' },
  
  tableText: { fontFamily: FONT.poppins, fontSize: 11, color: C.secondaryText, textAlign: 'center' },
  
  emptyWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontFamily: FONT.playfair, fontSize: 22, color: C.mainText, marginBottom: 8 },
  emptySub: { fontFamily: FONT.poppins, fontSize: 13, color: C.secondaryText, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  browseBtn: { backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 20 },
  browseBtnText: { color: C.bg, fontFamily: FONT.poppins, fontSize: 13, fontWeight: 'bold' }
});
