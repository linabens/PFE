import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Coffee, ChevronRight } from 'lucide-react-native';
import { useOrderStore } from '../../store/useOrderStore';

const C = {
  bg: '#FAF3EB',
  primary: '#5C3221',
  cream: '#FFFFFF',
  rosewood: '#C09891',
};

const FONT = {
  poppins: 'Poppins_400Regular',
  poppinsSemi: 'Poppins_600SemiBold',
};

const STATUS_MESSAGES = {
  'pending': 'En attente de confirmation',
  'confirmed': 'Confirmée par le staff',
  'preparing': 'En cours de préparation',
  'ready': 'Prête à être servie !',
  'completed': 'Commande terminée',
};

export default function ActiveOrderWidget() {
  const router = useRouter();
  const { currentOrderId, orderStatus } = useOrderStore();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (currentOrderId && orderStatus !== 'completed') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
    }
  }, [currentOrderId, orderStatus]);

  if (!currentOrderId) return null;

  const statusText = STATUS_MESSAGES[orderStatus] || 'Suivi de commande';

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: pulseAnim }] }]}>
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.9} 
        onPress={() => router.push('/order-tracking')}
      >
        <View style={styles.left}>
          <View style={styles.iconBox}>
            <Coffee size={20} color={C.cream} />
          </View>
          <View style={styles.textStack}>
            <Text style={styles.title}>Commande #{currentOrderId.toString().slice(-4).toUpperCase()}</Text>
            <Text style={styles.status}>{statusText}</Text>
          </View>
        </View>

        <ChevronRight size={20} color={C.primary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 24,
    marginBottom: 20,
    marginTop: -10, // Pulls it slightly closer to header
    zIndex: 10,
  },
  card: {
    backgroundColor: C.cream,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: '#EAD9C9',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textStack: {
    justifyContent: 'center',
  },
  title: {
    fontFamily: FONT.poppinsSemi,
    fontSize: 14,
    color: C.primary,
  },
  status: {
    fontFamily: FONT.poppins,
    fontSize: 12,
    color: C.rosewood,
  },
});
