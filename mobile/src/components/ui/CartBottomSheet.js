import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, Image, Animated, ActivityIndicator, PanResponder, Dimensions, SafeAreaView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { X, Trash2, Minus, Plus, Receipt } from 'lucide-react-native';

import { useCartStore } from '../../store/useCartStore';
import { useSessionStore } from '../../store/useSessionStore';
import { useOrderStore } from '../../store/useOrderStore';
import { orderApi } from '../../api/orderApi';
import { assistanceApi } from '../../api/assistanceApi';
import { useLoyalty } from '../../context/LoyaltyContext';
import PointsToast from '../PointsToast';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
      <View style={styles.hiddenAction}>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => onRemove(item.id)}>
          <Trash2 size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
      
      <Animated.View style={[styles.cartItem, { transform: [{ translateX: pan.x }] }]} {...panResponder.panHandlers}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          {formattedOptions !== '' && <Text style={styles.itemOptions} numberOfLines={2}>{formattedOptions}</Text>}
          <Text style={styles.itemPrice}>{Number(item.price * item.quantity).toFixed(2).replace('.', ',')} DT</Text>
        </View>

        <View style={styles.itemRight}>
          <View style={styles.itemImageWrapper}>
            <Image source={{ uri: item.image_url || 'https://via.placeholder.com/48' }} style={styles.itemImage} resizeMode="cover" />
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
        </View>
      </Animated.View>
    </View>
  );
};

export default function CartBottomSheet() {
  const router = useRouter();
  const { isCartSheetOpen, closeCartSheet, items, updateQuantity, removeItem, getTotal, clearCart } = useCartStore();
  const { tableId, tableNumber } = useSessionStore();
  const { setCurrentOrder } = useOrderStore();
  const { isLoggedIn, earnPoints } = useLoyalty();

  const [isPlacing, setIsPlacing] = useState(false);
  const [isCallingBill, setIsCallingBill] = useState(false);
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
      if (isLoggedIn) {
        const pts = Math.floor(finalTotal * 10);
        if (pts > 0) {
          earnPoints(pts, 'order', `Commande table ${tableNumber || 1}`);
          setToastPts(pts);
          setShowToast(true);
        }
      }

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
      closeCartSheet();
      router.push({ pathname: '/order-confirmation', params: { payload: JSON.stringify(receiptPayload) } });
    }
  };

  const handleRequestBill = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsCallingBill(true);
    try {
      // Reusing assistance API to request the bill
      await assistanceApi.requestAssistance(tableId || 1); 
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      alert("Le serveur a été notifié et vous apportera l'addition.");
    } catch (e) {
      alert("Erreur lors de la demande de l'addition.");
    } finally {
      setIsCallingBill(false);
    }
  };

  return (
    <Modal
      visible={isCartSheetOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={closeCartSheet}
    >
      <View style={styles.overlay}>
        {/* Backdrop clickable to close */}
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={closeCartSheet} />
        
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ width: 40 }} />
            <Text style={styles.headerTitle}>Panier</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={closeCartSheet}>
              <X size={24} color={C.mainText} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.storeName}>Coffee Time</Text>

          {/* Cart Items List */}
          <FlatList
            data={items}
            keyExtractor={(item, index) => `${item.id}-${index}`}
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
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.addMoreBtn} onPress={closeCartSheet}>
              <Plus size={16} color={C.primary} style={{ marginRight: 6 }} />
              <Text style={styles.addMoreText}>Ajouter un autre article</Text>
            </TouchableOpacity>

            <View style={styles.divider} />
            
            <View style={styles.totalsContainer}>
              <Text style={styles.totalItemsText}>{items.length} Article{items.length > 1 ? 's' : ''}</Text>
              <Text style={styles.subtotalText}>Sous-total  {subtotal.toFixed(2).replace('.', ',')} DT</Text>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.billBtn} onPress={handleRequestBill} disabled={isCallingBill}>
                {isCallingBill ? <ActivityIndicator size="small" color={C.primary} /> : <Receipt size={24} color={C.primary} />}
                <Text style={styles.billBtnText}>L'addition</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.checkoutBtn} 
                onPress={handleCheckout} 
                disabled={isPlacing}
                activeOpacity={0.9}
              >
                {isPlacing ? (
                  <ActivityIndicator color={C.bg} />
                ) : (
                  <Text style={styles.checkoutText}>Passer à la caisse</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </View>
      <PointsToast 
        points={toastPts} 
        reason={`Commande table ${tableNumber || 1}`}
        icon="bag-handle-outline"
        visible={showToast}
        onHide={() => setShowToast(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: C.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.9,
    minHeight: SCREEN_HEIGHT * 0.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontFamily: FONT.poppinsSemi,
    fontSize: 18,
    color: C.mainText,
    fontWeight: 'bold',
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeName: {
    fontFamily: FONT.playfair,
    fontSize: 22,
    color: C.mainText,
    paddingHorizontal: 24,
    marginBottom: 16,
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  swipeContainer: { 
    marginBottom: 12, 
    overflow: 'hidden', 
    borderRadius: 16 
  },
  hiddenAction: { 
    position: 'absolute', 
    right: 0, 
    top: 0, 
    bottom: 0, 
    width: 80, 
    backgroundColor: '#E57373', 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'flex-end', 
    paddingRight: 24 
  },
  cartItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    backgroundColor: C.cardBg, 
    padding: 12, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: C.border 
  },
  itemInfo: { 
    flex: 1, 
    marginRight: 12 
  },
  itemName: { 
    fontFamily: FONT.poppins, 
    fontSize: 14, 
    color: C.mainText, 
    fontWeight: 'bold', 
    marginBottom: 4 
  },
  itemOptions: { 
    fontFamily: FONT.poppins, 
    fontSize: 11, 
    color: C.lightText, 
    marginBottom: 6 
  },
  itemPrice: { 
    fontFamily: FONT.poppins, 
    fontSize: 13, 
    color: C.mainText, 
    fontWeight: '600' 
  },
  itemRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  itemImageWrapper: { 
    width: 50, 
    height: 50, 
    borderRadius: 12, 
    backgroundColor: C.imgBg, 
    overflow: 'hidden',
    marginBottom: 8,
  },
  itemImage: { width: '100%', height: '100%' },
  qtyContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12,
  },
  qtyBtn: { 
    width: 26, 
    height: 26, 
    borderRadius: 13, 
    backgroundColor: C.secondaryText, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  qtyText: { 
    fontFamily: FONT.poppins, 
    fontSize: 14, 
    color: C.mainText, 
    fontWeight: 'bold', 
    minWidth: 16, 
    textAlign: 'center' 
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    backgroundColor: C.cardBg,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 16,
  },
  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
  },
  addMoreText: {
    fontFamily: FONT.poppinsSemi,
    fontSize: 14,
    color: C.primary,
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginBottom: 16,
  },
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalItemsText: {
    fontFamily: FONT.poppinsSemi,
    fontSize: 14,
    color: C.mainText,
  },
  subtotalText: {
    fontFamily: FONT.poppinsSemi,
    fontSize: 14,
    color: C.mainText,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  billBtn: {
    width: 70,
    backgroundColor: C.imgBg,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  billBtnText: {
    fontFamily: FONT.poppinsSemi,
    fontSize: 9,
    color: C.primary,
    marginTop: 4,
  },
  checkoutBtn: { 
    flex: 1,
    backgroundColor: C.primary, 
    borderRadius: 20, 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: C.primary, 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 8, 
    elevation: 4 
  },
  checkoutText: { 
    fontFamily: FONT.poppinsSemi, 
    fontSize: 15, 
    color: C.bg, 
  },
});
