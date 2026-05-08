import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { ShoppingBag } from 'lucide-react-native';
import { useCartStore } from '../../store/useCartStore';

const C = {
  bg: '#FAF3EB',
  primary: '#5C3221',
  cream: '#FFFFFF',
};

const FONT = {
  poppins: 'Poppins_400Regular',
  poppinsSemi: 'Poppins_600SemiBold',
};

export default function FloatingCartBar() {
  const { items, getItemCount, getTotal, openCartSheet } = useCartStore();
  const slideAnim = useRef(new Animated.Value(100)).current;

  const count = getItemCount();
  const total = getTotal();

  useEffect(() => {
    if (count > 0) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 50,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 100,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [count]);

  if (count === 0) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <TouchableOpacity 
        style={styles.bar} 
        activeOpacity={0.9} 
        onPress={openCartSheet}
      >
        <View style={styles.left}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{count}</Text>
          </View>
          <Text style={styles.viewCartText}>Voir le panier</Text>
        </View>

        <View style={styles.right}>
          <Text style={styles.totalText}>{total.toFixed(2).replace('.', ',')} DT</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80, // Above the tab bar
    left: 16,
    right: 16,
    zIndex: 100,
  },
  bar: {
    backgroundColor: C.primary,
    borderRadius: 30,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    paddingHorizontal: 6,
  },
  badgeText: {
    color: C.cream,
    fontFamily: FONT.poppinsSemi,
    fontSize: 12,
  },
  viewCartText: {
    color: C.cream,
    fontFamily: FONT.poppinsSemi,
    fontSize: 14,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalText: {
    color: C.cream,
    fontFamily: FONT.poppinsSemi,
    fontSize: 15,
  },
});
