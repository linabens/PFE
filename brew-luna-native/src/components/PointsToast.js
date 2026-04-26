/**
 * BREW LUNA — Toast de notification de points
 * Affiché en bas de l'écran après chaque gain de points.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const C = {
  espresso: '#5C3221',
  cream:    '#FAF3EB',
  rosewood: '#C09891',
};

export default function PointsToast({ points, reason, icon = 'star', visible = true, onHide }) {
  const slideAnim = useRef(new Animated.Value(100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    // Slide-in
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();

    // Auto-dismiss après 3.5s
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 100, duration: 300, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => onHide && onHide());
    }, 3500);

    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[
      s.toast,
      { transform: [{ translateY: slideAnim }], opacity: opacityAnim },
    ]}>
      <View style={s.iconWrap}>
        <Ionicons name={icon} size={20} color="#FFFFFF" />
      </View>
      <View style={s.textBlock}>
        <Text style={s.pointsTxt}>+{points} points !</Text>
        {reason ? <Text style={s.reasonTxt}>{reason}</Text> : null}
      </View>
      <View style={s.starRow}>
        <Ionicons name="star" size={14} color={C.rosewood} />
        <Ionicons name="sparkles" size={10} color={C.rosewood} opacity={0.6} />
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    alignSelf: 'center',
    backgroundColor: C.espresso,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
    zIndex: 9999,
    width: '90%',
    maxWidth: 340,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  textBlock: { flex: 1 },
  pointsTxt: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16, color: '#FFFFFF', lineHeight: 22,
  },
  reasonTxt: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12, color: C.rosewood, marginTop: 1,
  },
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
