/**
 * BREW LUNA — Écran d'entrée du module Fidélité
 * Affiché quand l'utilisateur n'est PAS connecté à un compte fidélité
 */

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, Animated, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Moon } from 'lucide-react-native';
import TierBadgeIcon from '../components/loyalty/TierBadgeIcon';

const { height } = Dimensions.get('window');

// ─── Palette cohérente avec le reste de l'app ─────────────────────────────────
const C = {
  bg:        '#FAF3EB',   // Home Match
  card:      '#FFFFFF',
  primary:   '#5C3221',   // espresso
  accent:    '#C09891',   // rosewood
  cream:     '#F5E6D3',
  muted:     '#B89A87',
  mocha:     '#7A5C4D',
  border:    '#EAD9C9',
  success:   '#166534',
};

// ─── Ligne de bénéfice ────────────────────────────────────────────────────────
const BenefitRow = ({ iconName, text, delay, masterAnim }) => {
  const localAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(localAnim, {
      toValue: 1,
      duration: 500,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[s.benefitRow, {
      opacity: localAnim,
      transform: [{ translateX: localAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }]
    }]}>
      <View style={s.benefitIconWrap}>
        <Ionicons name={iconName} size={20} color={C.primary} />
      </View>
      <Text style={s.benefitText}>{text}</Text>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
export default function LoyaltyScreen() {
  const router = useRouter();

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideUp   = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideUp, { toValue: 0, friction: 8, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 2500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 2500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const BENEFITS = [
    { icon: 'star-outline', text: 'Gagnez 10 pts pour chaque 1,00 DT dépensé' },
    { icon: 'game-controller-outline', text: 'Gagnez jusqu\'à 80 pts en jouant à nos mini-jeux' },
    { icon: 'gift-outline', text: '100 points offerts dès votre inscription' },
  ];

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF3EB" />

      <Animated.View style={[s.container, { opacity: fadeAnim, transform: [{ translateY: slideUp }] }]}>

        {/* ── Section Hero ── */}
        <View style={s.heroSection}>
          <View style={s.iconContainer}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <View style={s.glowIcon}>
                <Ionicons name="star" size={60} color="#5C3221" />
              </View>
            </Animated.View>
          </View>

          <Text style={s.title}>Fidélité Coffee Time</Text>
          <Text style={s.subtitle}>L'art de récompenser votre passion du café</Text>

          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Ionicons name="cafe-outline" size={16} color="#B89A87" />
            <View style={s.dividerLine} />
          </View>
        </View>

        {/* ── Avantages ── */}
        <View style={s.benefitsCard}>
          <Text style={s.benefitsHeader}>Pourquoi nous rejoindre ?</Text>
          {BENEFITS.map((b, i) => (
            <BenefitRow
              key={i}
              iconName={b.icon}
              text={b.text}
              delay={400 + i * 200}
            />
          ))}
        </View>

        {/* ── Aperçu des Paliers ── */}
        <View style={s.tiersPreview}>
          {[
            { name: 'Bronze', color: '#C09891' },
            { name: 'Argent', color: '#A8A8A8' },
            { name: 'Or', color: '#D4AF37' },
            { name: 'Platine', color: '#2C1810' },
          ].map((tier) => (
            <View key={tier.name} style={s.tierPill}>
              <TierBadgeIcon tierName={tier.name === 'Argent' ? 'Silver' : tier.name === 'Or' ? 'Gold' : tier.name === 'Platine' ? 'Platinum' : 'Bronze'} size={14} color={tier.color} />
              <Text style={s.tierPillText}>{tier.name}</Text>
            </View>
          ))}
        </View>

        {/* ── Boutons d'Action ── */}
        <View style={s.actions}>
          <TouchableOpacity
            style={s.btnPrimary}
            activeOpacity={0.85}
            onPress={() => router.push('/loyalty/register')}
          >
            <Ionicons name="person-add" size={18} color="#FFFFFF" />
            <Text style={s.btnPrimaryText}>Devenir membre</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.btnSecondary}
            activeOpacity={0.85}
            onPress={() => router.push('/loyalty/login')}
          >
            <Text style={s.btnSecondaryText}>Déjà membre ? Se connecter</Text>
          </TouchableOpacity>
        </View>

      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: '#FAF3EB' },
  container: { flex: 1, paddingHorizontal: 28, paddingTop: 30, paddingBottom: 40 },

  heroSection: { alignItems: 'center', marginBottom: 35 },
  iconContainer: {
    width: 120, height: 120,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  glowIcon: {
    width: 90, height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#5C3221',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28, color: '#3D1C0C',
    marginTop: 15, marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14, color: '#7A5C4D',
    textAlign: 'center',
    opacity: 0.8,
  },
  divider: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 25, width: '50%', gap: 15,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#EAD9C9' },

  benefitsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28, padding: 24,
    marginBottom: 25,
    borderWidth: 1, borderColor: '#EAD9C9',
    shadowColor: '#3D1C0C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04, shadowRadius: 15,
    elevation: 3,
  },
  benefitsHeader: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15, color: '#3D1C0C',
    marginBottom: 20, textAlign: 'center',
  },
  benefitRow: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    marginBottom: 16,
  },
  benefitIconWrap: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: '#FAF3EB',
    alignItems: 'center', justifyContent: 'center',
  },
  benefitText: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13, color: '#5C3221',
    lineHeight: 19,
  },

  tiersPreview: {
    flexDirection: 'row', gap: 8, flexWrap: 'wrap',
    justifyContent: 'center', marginBottom: 35,
  },
  tierPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: '#EAD9C9',
  },
  tierPillText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11, color: '#5C3221',
  },

  actions: { gap: 12 },
  btnPrimary: {
    backgroundColor: '#5C3221',
    borderRadius: 18, height: 58,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 12,
    shadowColor: '#5C3221',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12,
    elevation: 8,
  },
  btnPrimaryText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16, color: '#FFFFFF',
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14, color: '#7A5C4D',
    textDecorationLine: 'underline',
  },
});
