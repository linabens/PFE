/**
 * BREW LUNA — Écran d'échange de points (catalogue de récompenses)
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, FlatList, Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLoyalty } from '../context/LoyaltyContext';
import { REWARDS } from '../constants/loyalty';

const C = {
  bg:      '#FAF3EB',   // Home Match
  card:    '#FFFFFF',
  primary: '#5C3221',   // espresso
  accent:  '#C09891',   // rosewood
  muted:   '#B89A87',
  mocha:   '#7A5C4D',
  border:  '#EAD9C9',
  cream:   '#F5E6D3',
  error:   '#C0392B',
};

// ─── Carte de récompense ───────────────────────────────────────────────────────
const RewardCard = ({ reward, canAfford, onRedeem }) => (
  <View style={s.rewardCard}>
    {/* Icône emoji */}
    <View style={s.rewardEmojiWrap}>
      <Text style={s.rewardEmoji}>{reward.emoji}</Text>
    </View>

    {/* Info */}
    <View style={s.rewardBody}>
      <Text style={s.rewardName}>{reward.name}</Text>
      <Text style={s.rewardDesc} numberOfLines={2}>{reward.description}</Text>
    </View>

    {/* Coût + bouton */}
    <View style={s.rewardRight}>
      <View style={s.costPill}>
        <Ionicons name="star" size={10} color="#FFFFFF" />
        <Text style={s.costTxt}>{reward.points}</Text>
      </View>
      <TouchableOpacity
        style={[s.redeemBtn, !canAfford && s.redeemDisabled]}
        onPress={() => canAfford && onRedeem(reward)}
        activeOpacity={canAfford ? 0.8 : 1}
      >
        <Text style={[s.redeemTxt, !canAfford && s.redeemTxtDisabled]}>
          {canAfford ? 'Échanger' : 'Insuffisant'}
        </Text>
      </TouchableOpacity>
    </View>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
export default function RedeemScreen() {
  const router = useRouter();
  const { points, redeemPoints } = useLoyalty();

  const [confirmReward, setConfirmReward] = useState(null);
  const [voucher, setVoucher] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    if (!confirmReward) return;
    setIsProcessing(true);
    try {
      const v = redeemPoints(confirmReward);
      setConfirmReward(null);
      setVoucher(v);
    } catch (e) {
      alert(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const expiryDate = (iso) => {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Catalogue Rewards</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* ── Solde compact ── */}
      <View style={s.balanceBar}>
        <Ionicons name="star" size={18} color={C.primary} />
        <Text style={s.balanceTxt}>
          Votre solde : <Text style={s.balanceNum}>{points.toLocaleString('fr-FR')} points</Text>
        </Text>
      </View>

      {/* ── Catalogue ── */}
      <FlatList
        data={REWARDS}
        keyExtractor={(r) => r.id}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={s.sectionTitle}>Récompenses disponibles</Text>
        }
        renderItem={({ item }) => (
          <RewardCard
            reward={item}
            canAfford={points >= item.points}
            onRedeem={setConfirmReward}
          />
        )}
      />

      {/* ── Modal de confirmation ── */}
      <Modal visible={!!confirmReward} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <View style={s.modalIconWrap}>
              <Ionicons name="help-circle-outline" size={32} color={C.primary} />
            </View>
            <Text style={s.modalTitle}>Confirmer l'échange</Text>
            <Text style={s.modalBody}>
              Voulez-vous échanger <Text style={{ color: C.primary, fontWeight: '700' }}>{confirmReward?.points} points</Text> contre : {'\n'}
              <Text style={{ fontStyle: 'italic', color: C.primary }}>"{confirmReward?.name}"</Text> ?
            </Text>

            <View style={s.modalActions}>
              <TouchableOpacity
                style={s.cancelBtn}
                onPress={() => setConfirmReward(null)}
              >
                <Text style={s.cancelTxt}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.confirmBtn}
                onPress={handleConfirm}
                disabled={isProcessing}
              >
                {isProcessing
                  ? <ActivityIndicator size="small" color="#FFFFFF" />
                  : <Text style={s.confirmTxt}>Confirmer</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal du bon d'achat ── */}
      <Modal visible={!!voucher} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.voucherCard}>
            <View style={s.voucherHeader}>
              <Ionicons name="gift" size={32} color={C.primary} />
              <Text style={s.voucherTitle}>Votre bon d'achat !</Text>
            </View>

            <View style={s.voucherInfo}>
              <Text style={s.voucherReward}>{voucher?.rewardName}</Text>
              <Text style={s.voucherExpiry}>
                Expire le {voucher ? expiryDate(voucher.expiry) : ''}
              </Text>
            </View>

            {/* Code */}
            <View style={s.codeBox}>
              <Text style={s.codeLabel}>PRÉSENTEZ CE CODE À LA CAISSE</Text>
              <Text style={s.codeValue}>{voucher?.code}</Text>
            </View>

            <Text style={s.voucherNote}>
              Ce bon à usage unique a été ajouté à votre historique de récompenses.
            </Text>

            <TouchableOpacity
              style={s.closeBtn}
              onPress={() => setVoucher(null)}
            >
              <Text style={s.closeBtnTxt}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 20, color: C.primary,
  },

  balanceBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  balanceTxt: {
    fontFamily: 'Poppins_400Regular', fontSize: 14, color: C.mocha,
  },
  balanceNum: {
    fontFamily: 'Poppins_600SemiBold', color: C.primary,
  },

  listContent: { padding: 16, paddingBottom: 48 },
  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold', fontSize: 14,
    color: C.primary, marginBottom: 16,
  },

  // Reward card
  rewardCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: C.card, borderRadius: 20, padding: 16,
    marginBottom: 12,
    borderWidth: 1, borderColor: C.border,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  rewardEmojiWrap: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: C.bg,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  rewardEmoji: { fontSize: 28 },
  rewardBody:  { flex: 1 },
  rewardName: {
    fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: C.primary, marginBottom: 4,
  },
  rewardDesc: {
    fontFamily: 'Poppins_400Regular', fontSize: 12, color: C.muted, lineHeight: 18,
  },
  rewardRight: { alignItems: 'flex-end', gap: 10 },
  costPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.primary, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  costTxt: {
    fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: '#FFFFFF',
  },
  redeemBtn: {
    backgroundColor: C.primary, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  redeemDisabled: { backgroundColor: '#EAD9C9', opacity: 0.6 },
  redeemTxt: {
    fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: '#FFFFFF',
  },
  redeemTxtDisabled: { color: C.muted },

  // Modals
  overlay: {
    flex: 1, backgroundColor: 'rgba(61,28,12,0.6)',
    alignItems: 'center', justifyContent: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: '#FFFFFF', borderRadius: 24,
    padding: 28, width: '100%',
    alignItems: 'center',
  },
  modalIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22, color: C.primary,
    marginBottom: 12, textAlign: 'center',
  },
  modalBody: {
    fontFamily: 'Poppins_400Regular', fontSize: 14, color: C.mocha,
    textAlign: 'center', lineHeight: 22, marginBottom: 28,
  },
  modalActions: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelBtn: {
    flex: 1, backgroundColor: C.bg, borderRadius: 16,
    height: 52, alignItems: 'center', justifyContent: 'center',
  },
  cancelTxt: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: C.mocha },
  confirmBtn: {
    flex: 1, backgroundColor: C.primary, borderRadius: 16,
    height: 52, alignItems: 'center', justifyContent: 'center',
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  confirmTxt: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#FFFFFF' },

  // Voucher
  voucherCard: {
    backgroundColor: '#FFFFFF', borderRadius: 28,
    padding: 32, width: '100%', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1, shadowRadius: 20, elevation: 10,
  },
  voucherHeader: { alignItems: 'center', marginBottom: 20 },
  voucherTitle: {
    fontFamily: 'PlayfairDisplay_700Bold', fontSize: 24,
    color: C.primary, marginTop: 8, textAlign: 'center',
  },
  voucherInfo: { alignItems: 'center', marginBottom: 24 },
  voucherReward: {
    fontFamily: 'Poppins_600SemiBold', fontSize: 18,
    color: C.accent, marginBottom: 4, textAlign: 'center',
  },
  voucherExpiry: {
    fontFamily: 'Poppins_400Regular', fontSize: 13,
    color: C.muted,
  },
  codeBox: {
    backgroundColor: C.bg, borderRadius: 16,
    padding: 24, width: '100%', alignItems: 'center', marginBottom: 24,
    borderWidth: 2, borderColor: C.border, borderStyle: 'dashed',
  },
  codeLabel: {
    fontFamily: 'Poppins_600SemiBold', fontSize: 11,
    color: C.muted, letterSpacing: 1.5, marginBottom: 8,
  },
  codeValue: {
    fontFamily: 'JetBrainsMono_400Regular', fontSize: 32,
    color: C.primary, letterSpacing: 4, fontWeight: '700',
  },
  voucherNote: {
    fontFamily: 'Poppins_400Regular', fontSize: 12,
    color: C.muted, textAlign: 'center', lineHeight: 20, marginBottom: 28,
  },
  closeBtn: {
    backgroundColor: C.primary, borderRadius: 16, height: 56,
    width: '100%', alignItems: 'center', justifyContent: 'center',
  },
  closeBtnTxt: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: '#FFFFFF' },
});
