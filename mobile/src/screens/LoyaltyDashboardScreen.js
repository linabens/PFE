/**
 * BREW LUNA — Tableau de bord du programme de fidélité
 * Affiché quand l'utilisateur EST connecté
 */

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, ScrollView, Animated,
  Dimensions, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Trophy } from 'lucide-react-native';
import { useLoyalty } from '../context/LoyaltyContext';
import TierBadgeIcon from '../components/loyalty/TierBadgeIcon';

const { width } = Dimensions.get('window');

const C = {
  bg:      '#FAF3EB',   // Home Match
  card:    '#FFFFFF',
  primary: '#5C3221',   // espresso
  accent:  '#C09891',   // rosewood
  muted:   '#B89A87',
  mocha:   '#7A5C4D',
  border:  '#EAD9C9',
  cream:   '#F5E6D3',
  success: '#166534',
  danger:  '#C0392B',
};

// ─── Formatage de date ─────────────────────────────────────────────────────────
const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─── Ligne d'historique ────────────────────────────────────────────────────────
const HistoryRow = ({ item }) => {
  const isEarned = item.points > 0;
  return (
    <View style={s.histRow}>
      <View style={[s.histIcon, { backgroundColor: isEarned ? '#E8F5E9' : '#FDEDEC' }]}>
        <Ionicons name={item.icon} size={18} color={isEarned ? C.success : C.danger} />
      </View>
      <View style={s.histBody}>
        <Text style={s.histDesc} numberOfLines={1}>{item.description}</Text>
        <Text style={s.histDate}>{formatDate(item.date)}</Text>
      </View>
      <Text style={[s.histPts, { color: isEarned ? C.success : C.danger }]}>
        {isEarned ? '+' : ''}{item.points} pts
      </Text>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
export default function LoyaltyDashboardScreen() {
  const router = useRouter();
  const {
    loyaltyUser, points, totalEarned,
    tier, nextTier, progressToNext,
    history, ordersCount, gamesCount,
    logout,
  } = useLoyalty();

  // Animation de la barre de progression
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(progressAnim, {
        toValue: progressToNext,
        duration: 1000,
        delay: 300,
        useNativeDriver: false,
      }),
    ]).start();
  }, [progressToNext]);

  const recentHistory = history.slice(0, 5);
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const handleLogout = () => {
    logout();
    router.replace('/(tabs)/loyalty');
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* ── Header ── */}
      <View style={s.header}>
        <View>
          <Text style={s.headerEyebrow}>TABLEAU DE BORD</Text>
          <Text style={s.headerTitle}>Mes Rewards</Text>
        </View>
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={C.accent} />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Carte Points Hero ── */}
        <View style={s.heroCard}>
          {/* Ligne utilisateur + palier */}
          <View style={s.heroTop}>
            <View>
              <Text style={s.heroName}>{loyaltyUser?.name || 'Client'}</Text>
              <Text style={s.heroEmail}>{loyaltyUser?.phoneNumber}</Text>
            </View>
            <View style={[s.tierBadge, { backgroundColor: tier.color }]}>
              <TierBadgeIcon tierName={tier.name} size={15} color={tier.textColor} />
              <Text style={[s.tierBadgeTxt, { color: tier.textColor }]}>{tier.name}</Text>
            </View>
          </View>

          {/* Points */}
          <View style={s.pointsRow}>
            <Text style={s.pointsNum}>{points.toLocaleString('fr-FR')}</Text>
            <Text style={s.pointsLabel}>points disponibles</Text>
          </View>

          {/* Barre de progression */}
          <View style={s.progressSection}>
            <View style={s.progressTrack}>
              <Animated.View style={[s.progressFill, { width: progressWidth, backgroundColor: C.primary }]} />
            </View>
            <View style={s.progressLabelRow}>
              {!nextTier && <Trophy size={14} color={C.muted} strokeWidth={2} style={{ marginRight: 6 }} />}
              <Text style={s.progressLabel}>
                {nextTier
                  ? `${Math.max(0, nextTier.minPoints - totalEarned)} pts pour atteindre ${nextTier.name}`
                  : 'Niveau maximum atteint'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Stats rapides ── */}
        <View style={s.statsRow}>
          {[
            { label: 'Points gagnés', value: totalEarned.toLocaleString('fr-FR'), icon: 'star' },
            { label: 'Commandes', value: ordersCount, icon: 'bag-handle' },
            { label: 'Jeux joués', value: gamesCount, icon: 'game-controller' },
          ].map((stat, i) => (
            <View key={i} style={s.statCard}>
              <Ionicons name={stat.icon} size={20} color={C.primary} />
              <Text style={s.statVal}>{stat.value}</Text>
              <Text style={s.statLbl}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Actions ── */}
        <View style={s.actionsRow}>
          <TouchableOpacity
            style={s.actionBtnPrimary}
            activeOpacity={0.85}
            onPress={() => router.push('/loyalty/redeem')}
          >
            <Ionicons name="gift-outline" size={20} color="#FFFFFF" />
            <Text style={s.actionBtnPrimaryTxt}>Échanger des points</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.actionBtnSecondary}
            activeOpacity={0.85}
            onPress={() => router.push('/loyalty/history')}
          >
            <Ionicons name="time-outline" size={20} color={C.primary} />
            <Text style={s.actionBtnSecondaryTxt}>Historique</Text>
          </TouchableOpacity>
        </View>

        {/* ── Activité récente ── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Activité récente</Text>
            {history.length > 5 && (
              <TouchableOpacity onPress={() => router.push('/loyalty/history')}>
                <Text style={s.seeAll}>Voir tout</Text>
              </TouchableOpacity>
            )}
          </View>

          {recentHistory.length === 0 ? (
            <View style={s.emptyState}>
              <Ionicons name="star-outline" size={32} color={C.muted} />
              <Text style={s.emptyText}>Aucune activité encore.{'\n'}Commencez à gagner des points !</Text>
            </View>
          ) : (
            <View style={s.histList}>
              {recentHistory.map((item) => (
                <HistoryRow key={item.id} item={item} />
              ))}
            </View>
          )}
        </View>

        {/* ── Info palier actuel ── */}
        <View style={[s.tierInfoCard, { borderColor: C.border }]}>
          <View style={[s.tierInfoIcon, { backgroundColor: C.bg }]}>
            <Ionicons name="trophy-outline" size={24} color={C.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.tierInfoName, { color: C.primary }]}>Statut {tier.name}</Text>
            <Text style={s.tierInfoDesc}>{tier.description}</Text>
          </View>
        </View>

      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 16, paddingBottom: 48 },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
  },
  headerEyebrow: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 9, letterSpacing: 2, color: C.muted,
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24, color: C.primary,
  },
  logoutBtn: { padding: 8 },

  // Hero card
  heroCard: {
    backgroundColor: C.card,
    borderRadius: 24, padding: 24, marginBottom: 16,
    borderWidth: 1, borderColor: C.border,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  heroTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  heroName:   { fontFamily: 'Poppins_600SemiBold', fontSize: 18, color: C.primary },
  heroEmail:  { fontFamily: 'Poppins_400Regular', fontSize: 13, color: C.muted, marginTop: 2 },
  tierBadge:  {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tierBadgeTxt: { fontFamily: 'Poppins_600SemiBold', fontSize: 12 },
  progressLabelRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },

  pointsRow: { alignItems: 'center', marginBottom: 24 },
  pointsNum: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 56, color: C.primary, lineHeight: 64,
  },
  pointsLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13, color: C.muted, marginTop: 2,
  },

  progressSection: { gap: 10 },
  progressTrack: {
    height: 8, backgroundColor: C.bg,
    borderRadius: 4, overflow: 'hidden',
  },
  progressFill:  { height: '100%', borderRadius: 4 },
  progressLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12, color: C.muted, textAlign: 'center',
  },

  // Stats
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: C.card, borderRadius: 16,
    padding: 16, alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: C.border,
  },
  statVal: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 18, color: C.primary,
  },
  statLbl: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 9, color: C.muted, textAlign: 'center',
  },

  // Actions
  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  actionBtnPrimary: {
    flex: 1.4, backgroundColor: C.primary, borderRadius: 16, height: 56,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  actionBtnPrimaryTxt: {
    fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#FFFFFF',
  },
  actionBtnSecondary: {
    flex: 1, backgroundColor: C.card, borderRadius: 16, height: 56,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 2, borderColor: C.primary,
  },
  actionBtnSecondaryTxt: {
    fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: C.primary,
  },

  // Section
  section:       { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: C.primary,
  },
  seeAll: {
    fontFamily: 'Poppins_400Regular', fontSize: 14, color: C.accent,
  },

  histList: { gap: 10 },
  histRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: C.card, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: C.border,
  },
  histIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  histBody:  { flex: 1 },
  histDesc: {
    fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: C.primary,
  },
  histDate: {
    fontFamily: 'Poppins_400Regular', fontSize: 12, color: C.muted, marginTop: 2,
  },
  histPts: {
    fontFamily: 'Poppins_600SemiBold', fontSize: 15,
  },

  emptyState: { alignItems: 'center', padding: 32, gap: 12 },
  emptyText: {
    fontFamily: 'Poppins_400Regular', fontSize: 14, color: C.muted,
    textAlign: 'center', lineHeight: 22,
  },

  // Tier info
  tierInfoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: C.card, borderRadius: 16, padding: 16,
    borderWidth: 1, marginBottom: 12,
  },
  tierInfoIcon: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  tierInfoName: {
    fontFamily: 'Poppins_600SemiBold', fontSize: 15, marginBottom: 4,
  },
  tierInfoDesc: {
    fontFamily: 'Poppins_400Regular', fontSize: 13, color: C.muted,
  },
});
