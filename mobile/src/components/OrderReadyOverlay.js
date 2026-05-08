import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Platform } from 'react-native';
let BlurView;
try {
  BlurView = require('expo-blur').BlurView;
} catch (e) {
  // Fallback for environments where expo-blur is missing
  BlurView = ({ children, style }) => <View style={[style, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>{children}</View>;
}

import { Coffee, Sparkles, CheckCircle2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

// ============================================
// PREMIUM ROSEWOOD & GOLD PALETTE
// ============================================
const COLORS = {
  bg: '#1A0A06', // Dark Espresso
  rosewood: '#C09891',
  gold: '#D4AF37',
  cream: '#FAF3EB',
  primary: '#5C3221',
};

const FONT = {
  playfair: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  poppins: Platform.OS === 'ios' ? 'System' : 'sans-serif'
};

export default function OrderReadyOverlay({ onDismiss, orderId }) {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);
  const rotateAnim = new Animated.Value(0);

  useEffect(() => {
    // Vibration haptique immédiate
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Entrée fluide
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 10000,
          useNativeDriver: true,
        })
      )
    ]).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Blur background for Glassmorphism effect */}
      <BlurView intensity={Platform.OS === 'ios' ? 80 : 100} tint="dark" style={StyleSheet.absoluteFill} />
      
      <Animated.View style={[styles.content, { transform: [{ scale: scaleAnim }] }]}>
        {/* Dynamic Glowing Aura */}
        <Animated.View style={[styles.aura, { transform: [{ rotate: spin }] }]}>
          <Sparkles size={height * 0.4} color="rgba(212, 175, 55, 0.15)" strokeWidth={0.5} />
        </Animated.View>

        <View style={styles.iconContainer}>
          <View style={styles.circle}>
            <Coffee size={60} color={COLORS.gold} strokeWidth={1.5} />
          </View>
          <View style={styles.checkBadge}>
            <CheckCircle2 size={24} color={COLORS.bg} fill={COLORS.gold} />
          </View>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>Votre commande est prête !</Text>
          <Text style={styles.orderId}>Commande #{orderId?.toString().slice(-6).toUpperCase()}</Text>
          <Text style={styles.subtitle}>Elle vous attend toute chaude au comptoir.</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={onDismiss} activeOpacity={0.8}>
          <Text style={styles.buttonText}>J'y vais ! ☕</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  content: {
    width: width * 0.85,
    backgroundColor: 'rgba(26, 10, 6, 0.85)',
    borderRadius: 40,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(192, 152, 145, 0.3)',
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  aura: {
    position: 'absolute',
    top: -50,
    opacity: 0.5,
  },
  iconContainer: {
    marginBottom: 30,
  },
  circle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(92, 50, 33, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  checkBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: COLORS.gold,
    borderRadius: 12,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontFamily: FONT.playfair,
    fontSize: 28,
    color: COLORS.cream,
    textAlign: 'center',
    marginBottom: 10,
  },
  orderId: {
    fontFamily: FONT.poppins,
    fontSize: 14,
    color: COLORS.rosewood,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 15,
  },
  subtitle: {
    fontFamily: FONT.poppins,
    fontSize: 15,
    color: COLORS.rosewood,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.9,
  },
  button: {
    backgroundColor: COLORS.gold,
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  buttonText: {
    color: COLORS.bg,
    fontFamily: FONT.poppins,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
