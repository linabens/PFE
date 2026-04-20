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

  // Animation de l'icône (pulsation légère)
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade-in général
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();

    // Boucle de pulsation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const BENEFITS = [
    { icon: 'bag-handle-outline', text: 'Gagnez 10 pts par 1,00 DT dépensé sur vos commandes' },
    { icon: 'game-controller-outline', text: 'Gagnez jusqu\'à 80 pts en jouant aux mini-jeux' },
    { icon: 'gift-outline', text: '100 points de bienvenue offerts dès l\'inscription' },
  ];

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <Animated.View style={[s.container, { opacity: fadeAnim }]}>

        {/* ── Icône principale animée ── */}
        <View style={s.heroSection}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }], marginBottom: 12 }}>
            <Ionicons name="star" size={72} color={C.primary} />
          </Animated.View>

          <Text style={s.title}>BrewLuna Rewards</Text>
          <Text style={s.subtitle}>Gagnez des points à chaque gorgée</Text>

          {/* Séparateur décoratif */}
          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Text style={s.dividerSymbol}>☽</Text>
            <View style={s.dividerLine} />
          </View>
        </View>

        {/* ── Bénéfices ── */}
        <View style={s.benefitsCard}>
          {BENEFITS.map((b, i) => (
            <BenefitRow
              key={i}
              iconName={b.icon}
              text={b.text}
              delay={300 + i * 150}
            />
          ))}
        </View>

        {/* ── Paliers preview ── */}
        <View style={s.tiersPreview}>
          {['🥉 Bronze', '🥈 Silver', '🥇 Gold', '💎 Platinum'].map((tier, i) => (
            <View key={i} style={s.tierPill}>
              <Text style={s.tierPillText}>{tier}</Text>
            </View>
          ))}
        </View>

        {/* ── Boutons d'action ── */}
        <View style={s.actions}>
          <TouchableOpacity
            style={s.btnPrimary}
            activeOpacity={0.85}
            onPress={() => router.push('/loyalty/register')}
          >
            <Ionicons name="person-add-outline" size={18} color="#FFFFFF" />
            <Text style={s.btnPrimaryText}>Créer un compte</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.btnSecondary}
            activeOpacity={0.85}
            onPress={() => router.push('/loyalty/login')}
          >
            <Ionicons name="log-in-outline" size={18} color={C.primary} />
            <Text style={s.btnSecondaryText}>Se connecter</Text>
          </TouchableOpacity>
        </View>

      </Animated.View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40 },

  // Hero
  heroSection: { alignItems: 'center', marginBottom: 32 },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 30, color: C.primary,
    marginTop: 16, marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14, color: C.mocha,
    fontStyle: 'italic', textAlign: 'center',
  },
  divider: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 20, width: '60%', gap: 10,
  },
  dividerLine: { flex: 1, height: 1.5, backgroundColor: C.border },
  dividerSymbol: { color: C.muted, fontSize: 16 },

  // Bénéfices
  benefitsCard: {
    backgroundColor: C.card,
    borderRadius: 24, padding: 24,
    marginBottom: 20,
    borderWidth: 1, borderColor: C.border,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 10,
    elevation: 2,
    gap: 18,
  },
  benefitRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  benefitIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.bg,
    alignItems: 'center', justifyContent: 'center',
  },
  benefitText: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13, color: C.primary,
    lineHeight: 20,
  },

  // Paliers
  tiersPreview: {
    flexDirection: 'row', gap: 8, flexWrap: 'wrap',
    justifyContent: 'center', marginBottom: 32,
  },
  tierPill: {
    backgroundColor: C.card,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: C.border,
  },
  tierPillText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12, color: C.primary,
  },

  // Boutons
  actions: { gap: 14 },
  btnPrimary: {
    backgroundColor: C.primary,
    borderRadius: 16, height: 56,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12,
    elevation: 6,
  },
  btnPrimaryText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16, color: '#FFFFFF',
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderRadius: 16, height: 56,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10,
    borderWidth: 2, borderColor: C.primary,
  },
  btnSecondaryText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16, color: C.primary,
  },
});
