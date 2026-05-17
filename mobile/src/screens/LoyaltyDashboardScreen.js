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
import { LinearGradient } from 'expo-linear-gradient';
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

  // Animations
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(progressAnim, {
        toValue: progressToNext,
        duration: 1200,
        delay: 400,
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

  // Traduction des paliers pour l'affichage
  const displayTierName = tier.name === 'Silver' ? 'Argent' : tier.name === 'Gold' ? 'Or' : tier.name === 'Platinum' ? 'Platine' : tier.name;
  const displayNextTierName = nextTier?.name === 'Silver' ? 'Argent' : nextTier?.name === 'Gold' ? 'Or' : nextTier?.name === 'Platinum' ? 'Platine' : nextTier?.name;

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF3EB" />

      {/* ── Header ── */}
      <View style={s.header}>
        <View>
          <Text style={s.headerEyebrow}>ESPACE MEMBRE</Text>
          <Text style={s.headerTitle}>Ma Fidélité</Text>
        </View>
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#C09891" />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Carte de Membre Numérique (VIP Card) ── */}
        <View style={[s.heroCard, { backgroundColor: tier.color === '#6B3A2A' ? '#2C1810' : tier.color + '20' || '#FFFFFF' }]}>
          <LinearGradient
            colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          
          <View style={s.heroTop}>
            <View>
              <Text style={s.heroName}>{loyaltyUser?.name || 'Client Privilège'}</Text>
              <Text style={s.heroEmail}>{loyaltyUser?.phoneNumber}</Text>
            </View>
            <View style={[s.tierBadge, { backgroundColor: tier.color }]}>
              <TierBadgeIcon tierName={tier.name} size={14} color="#FFFFFF" />
              <Text style={s.tierBadgeTxt}>{displayTierName}</Text>
            </View>
          </View>

          <View style={s.pointsRow}>
            <Text style={s.pointsNum}>{points.toLocaleString('fr-FR')}</Text>
            <Text style={s.pointsLabel}>Points cumulés</Text>
          </View>

          <View style={s.progressSection}>
            <View style={s.progressTrack}>
              <Animated.View style={[s.progressFill, { width: progressWidth, backgroundColor: tier.color }]} />
            </View>
            <View style={s.progressLabelRow}>
              <Text style={s.progressLabel}>
                {nextTier
                  ? `${Math.max(0, nextTier.minPoints - totalEarned)} pts restants pour le rang ${displayNextTierName}`
                  : 'Félicitations ! Vous êtes au rang maximum'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Statistiques ── */}
        <View style={s.statsRow}>
          {[
            { label: 'Total gagné', value: totalEarned.toLocaleString('fr-FR'), icon: 'star', color: '#D4AF37' },
            { label: 'Commandes', value: ordersCount, icon: 'cafe', color: '#5C3221' },
            { label: 'Jeux', value: gamesCount, icon: 'game-controller', color: '#C09891' },
          ].map((stat, i) => (
            <View key={i} style={s.statCard}>
              <View style={[s.statIconCircle, { backgroundColor: stat.color + '15' }]}>
                <Ionicons name={stat.icon} size={18} color={stat.color} />
              </View>
              <Text style={s.statVal}>{stat.value}</Text>
              <Text style={s.statLbl}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Actions Principales ── */}
        <View style={s.actionsRow}>
          <TouchableOpacity
            style={s.actionBtnPrimary}
            activeOpacity={0.85}
            onPress={() => router.push('/loyalty/redeem')}
          >
            <Ionicons name="gift" size={20} color="#FFFFFF" />
            <Text style={s.actionBtnPrimaryTxt}>Utiliser mes points</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.actionBtnSecondary}
            activeOpacity={0.85}
            onPress={() => router.push('/loyalty/history')}
          >
            <Ionicons name="list" size={20} color="#5C3221" />
            <Text style={s.actionBtnSecondaryTxt}>Historique</Text>
          </TouchableOpacity>
        </View>

        {/* ── Activité Récente ── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Mes dernières activités</Text>
            {history.length > 5 && (
              <TouchableOpacity onPress={() => router.push('/loyalty/history')}>
                <Text style={s.seeAll}>Voir tout</Text>
              </TouchableOpacity>
            )}
          </View>

          {recentHistory.length === 0 ? (
            <View style={s.emptyState}>
              <View style={s.emptyIconCircle}>
                <Ionicons name="calendar-outline" size={32} color="#B89A87" />
              </View>
              <Text style={s.emptyText}>Aucune activité enregistrée pour le moment.</Text>
            </View>
          ) : (
            <View style={s.histList}>
              {recentHistory.map((item) => (
                <HistoryRow key={item.id} item={item} />
              ))}
            </View>
          )}
        </View>

        {/* ── Information sur le Statut ── */}
        <View style={s.tierInfoCard}>
          <LinearGradient
            colors={['#FAF3EB', '#FFFFFF']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <View style={s.tierInfoIcon}>
            <Ionicons name="ribbon-outline" size={26} color="#5C3221" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.tierInfoName}>Avantages du rang {displayTierName}</Text>
            <Text style={s.tierInfoDesc} numberOfLines={2}>{tier.description}</Text>
          </View>
        </View>

      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#FAF3EB' },
  scroll: { padding: 20, paddingBottom: 60 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 15,
  },
  headerEyebrow: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10, letterSpacing: 2, color: '#B89A87',
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 26, color: '#3D1C0C',
  },
  logoutBtn: { 
    width: 44, height: 44, 
    borderRadius: 22, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#EAD9C9',
  },

  heroCard: {
    borderRadius: 28, padding: 25, marginBottom: 20,
    borderWidth: 1, borderColor: '#EAD9C9',
    overflow: 'hidden',
    shadowColor: '#3D1C0C', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08, shadowRadius: 20, elevation: 4,
  },
  heroTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25 },
  heroName:   { fontFamily: 'Poppins_600SemiBold', fontSize: 20, color: '#3D1C0C' },
  heroEmail:  { fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#7A5C4D', opacity: 0.8 },
  tierBadge:  {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6,
  },
  tierBadgeTxt: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: '#FFFFFF' },

  pointsRow: { alignItems: 'center', marginBottom: 25 },
  pointsNum: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 58, color: '#3D1C0C',
  },
  pointsLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12, color: '#7A5C4D', textTransform: 'uppercase', letterSpacing: 1,
  },

  progressSection: { gap: 12 },
  progressTrack: {
    height: 10, backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 5, overflow: 'hidden',
  },
  progressFill:  { height: '100%', borderRadius: 5 },
  progressLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12, color: '#5C3221', textAlign: 'center', opacity: 0.9,
  },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 20,
    padding: 16, alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: '#EAD9C9',
  },
  statIconCircle: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  statVal: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 18, color: '#3D1C0C' },
  statLbl: { fontFamily: 'Poppins_400Regular', fontSize: 10, color: '#7A5C4D' },

  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 25 },
  actionBtnPrimary: {
    flex: 1.5, backgroundColor: '#5C3221', borderRadius: 20, height: 60,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowColor: '#5C3221', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 15, elevation: 8,
  },
  actionBtnPrimaryTxt: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: '#FFFFFF' },
  actionBtnSecondary: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 20, height: 60,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderWidth: 2, borderColor: '#5C3221',
  },
  actionBtnSecondaryTxt: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: '#5C3221' },

  section:       { marginBottom: 25 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 17, color: '#3D1C0C' },
  seeAll: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#C09891' },

  histList: { gap: 12 },
  histRow: {
    flexDirection: 'row', alignItems: 'center', gap: 15,
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 15,
    borderWidth: 1, borderColor: '#EAD9C9',
  },
  histIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  histBody:  { flex: 1 },
  histDesc: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#3D1C0C' },
  histDate: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#B89A87', marginTop: 2 },
  histPts: { fontFamily: 'Poppins_700Bold', fontSize: 16 },

  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 15 },
  emptyIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EAD9C9' },
  emptyText: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#B89A87', textAlign: 'center', width: '80%' },

  tierInfoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 18,
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: '#EAD9C9', overflow: 'hidden',
  },
  tierInfoIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EAD9C9' },
  tierInfoName: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: '#3D1C0C', marginBottom: 4 },
  tierInfoDesc: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#7A5C4D', lineHeight: 18 },
});
