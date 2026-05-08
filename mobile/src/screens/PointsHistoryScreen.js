/**
 * BREW LUNA — Écran de l'historique complet des points
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLoyalty } from '../context/LoyaltyContext';

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

const FILTERS = [
  { key: 'all',    label: 'Tout' },
  { key: 'earn',   label: 'Gagnés' },
  { key: 'spend',  label: 'Dépensés' },
];

// ─── Formatage de date ─────────────────────────────────────────────────────────
const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

// ─── Entrée d'historique ───────────────────────────────────────────────────────
const HistoryEntry = ({ item }) => {
  const isEarned = item.points > 0;
  return (
    <View style={s.entry}>
      <View style={[s.entryIcon, { backgroundColor: isEarned ? '#E8F5E9' : '#FDEDEC' }]}>
        <Ionicons
          name={item.icon || 'star'}
          size={20}
          color={isEarned ? C.success : C.danger}
        />
      </View>
      <View style={s.entryBody}>
        <Text style={s.entryDesc}>{item.description}</Text>
        <Text style={s.entryDate}>{formatDate(item.date)}</Text>
      </View>
      <Text style={[s.entryPts, { color: isEarned ? C.success : C.danger }]}>
        {isEarned ? '+' : ''}{item.points} pts
      </Text>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
export default function PointsHistoryScreen() {
  const router = useRouter();
  const { history, points, totalEarned } = useLoyalty();
  const [filter, setFilter] = useState('all');

  const filtered = history.filter((item) => {
    if (filter === 'earn')  return item.points > 0;
    if (filter === 'spend') return item.points < 0;
    return true;
  });

  const totalSpent = totalEarned - points;

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Historique des points</Text>
        <div style={{ width: 38 }} />
      </View>

      {/* ── Résumé ── */}
      <View style={s.summaryRow}>
        <View style={s.summaryCell}>
          <Ionicons name="add-circle" size={18} color={C.success} />
          <Text style={[s.summaryVal, { color: C.success }]}>{totalEarned.toLocaleString('fr-FR')}</Text>
          <Text style={s.summaryLbl}>Gagnés</Text>
        </View>
        <View style={s.summaryDivider} />
        <View style={s.summaryCell}>
          <Ionicons name="remove-circle" size={18} color={C.danger} />
          <Text style={[s.summaryVal, { color: C.danger }]}>{totalSpent.toLocaleString('fr-FR')}</Text>
          <Text style={s.summaryLbl}>Dépensés</Text>
        </View>
        <View style={s.summaryDivider} />
        <View style={s.summaryCell}>
          <Ionicons name="star" size={18} color={C.primary} />
          <Text style={[s.summaryVal, { color: C.primary }]}>{points.toLocaleString('fr-FR')}</Text>
          <Text style={s.summaryLbl}>Solde</Text>
        </View>
      </View>

      {/* ── Filtres ── */}
      <View style={s.filtersRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[s.filterChip, filter === f.key && s.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[s.filterTxt, filter === f.key && s.filterTxtActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Liste ── */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <HistoryEntry item={item} />}
        ListEmptyComponent={
          <View style={s.emptyState}>
            <Ionicons name="star-outline" size={48} color={C.muted} />
            <Text style={s.emptyTitle}>Aucune activité</Text>
            <Text style={s.emptyBody}>
              Commencez à commander ou à jouer pour gagner des points !
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  backBtn:     { padding: 6 },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_700Bold', fontSize: 20, color: C.primary,
  },

  summaryRow: {
    flexDirection: 'row', backgroundColor: '#FFFFFF',
    paddingVertical: 18, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: C.border,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03, shadowRadius: 10, elevation: 2,
  },
  summaryCell:  { flex: 1, alignItems: 'center', gap: 4 },
  summaryDivider: { width: 1, backgroundColor: C.border, height: '60%', alignSelf: 'center' },
  summaryVal: {
    fontFamily: 'PlayfairDisplay_700Bold', fontSize: 18,
  },
  summaryLbl: {
    fontFamily: 'Poppins_400Regular', fontSize: 10, color: C.muted,
  },

  filtersRow: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 16, paddingVertical: 16,
  },
  filterChip: {
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: C.border,
  },
  filterChipActive: {
    backgroundColor: C.primary, borderColor: C.primary,
  },
  filterTxt: {
    fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: C.mocha,
  },
  filterTxtActive: { color: '#FFFFFF' },

  listContent: { padding: 16, paddingBottom: 48 },

  entry: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: C.card, borderRadius: 16, padding: 14,
    marginBottom: 10,
    borderWidth: 1, borderColor: C.border,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  entryIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  entryBody:  { flex: 1 },
  entryDesc: {
    fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: C.primary, marginBottom: 3,
  },
  entryDate: {
    fontFamily: 'Poppins_400Regular', fontSize: 12, color: C.muted,
  },
  entryPts: {
    fontFamily: 'Poppins_600SemiBold', fontSize: 15,
  },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: {
    fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22, color: C.primary,
  },
  emptyBody: {
    fontFamily: 'Poppins_400Regular', fontSize: 14, color: C.muted,
    textAlign: 'center', lineHeight: 22, maxWidth: 280,
  },
});
