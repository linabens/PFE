/**
 * BREW LUNA — Contexte de Fidélité
 * Gère l'état global du programme de fidélité :
 * compte utilisateur, points, historique, récompenses
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  POINTS_RULES,
  getTierFromPoints,
  getNextTier,
  getProgressToNext,
  generateVoucherCode,
} from '../constants/loyalty';

// ─── Clés de stockage local ───────────────────────────────────────────────────
const STORAGE_KEY = '@brewluna_loyalty';

// ─── Valeur initiale du contexte ──────────────────────────────────────────────
const LoyaltyContext = createContext(null);

// ─── État par défaut d'un nouveau compte ─────────────────────────────────────
const DEFAULT_STATE = {
  loyaltyUser: null,   // { id, name, phoneNumber }
  points: 0,           // solde actuel (points dépensables)
  totalEarned: 0,      // points gagnés à vie (pour calcul du palier)
  history: [],         // [{ id, type, description, points, date, icon }]
  ordersCount: 0,      // nombre de commandes avec points
  gamesCount: 0,       // nombre de parties avec points
  vouchers: [],        // bons d'achat générés
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export function LoyaltyProvider({ children }) {
  const [state, setState] = useState(DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Chargement initial depuis AsyncStorage
  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          setState(saved);
        }
      } catch (e) {
        console.warn('[Loyalty] Erreur de chargement:', e);
      } finally {
        setIsLoaded(true);
      }
    };
    load();
  }, []);

  // Sauvegarde automatique à chaque changement d'état
  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch((e) =>
      console.warn('[Loyalty] Erreur de sauvegarde:', e)
    );
  }, [state, isLoaded]);

  // ─── Inscription ────────────────────────────────────────────────────────────
  const register = useCallback(async (name, phoneNumber) => {
    // Vérification téléphone unique (simplifié pour démo locale)
    if (state.loyaltyUser?.phoneNumber === phoneNumber) {
      throw new Error('Un compte avec ce numéro existe déjà.');
    }

    const userId = `user_${Date.now()}`;
    const welcomeEntry = {
      id: `h_${Date.now()}`,
      type: 'welcome',
      description: 'Bienvenue dans le programme BrewLuna Rewards !',
      points: POINTS_RULES.WELCOME,
      date: new Date().toISOString(),
      icon: 'hand-left-outline',
    };

    setState({
      loyaltyUser: { id: userId, name, phoneNumber },
      points: POINTS_RULES.WELCOME,
      totalEarned: POINTS_RULES.WELCOME,
      history: [welcomeEntry],
      ordersCount: 0,
      gamesCount: 0,
      vouchers: [],
    });
  }, [state.loyaltyUser]);

  // ─── Connexion ───────────────────────────────────────────────────────────────
  const login = useCallback(async (phoneNumber) => {
    if (!state.loyaltyUser) {
      throw new Error('Aucun compte trouvé avec ce numéro.');
    }
    if (state.loyaltyUser.phoneNumber !== phoneNumber) {
      throw new Error('Numéro de téléphone non reconnu.');
    }
    // Connexion validée
    return true;
  }, [state.loyaltyUser]);

  // ─── Déconnexion ──────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    setState((prev) => ({ ...prev, _loggedOut: true }));
  }, []);

  // ─── Reconnexion (annule le logout) ──────────────────────────────────────────
  const reconnect = useCallback(() => {
    setState((prev) => {
      const { _loggedOut, ...rest } = prev;
      return rest;
    });
  }, []);

  // ─── Gagner des points ───────────────────────────────────────────────────────
  const earnPoints = useCallback((amount, type, description) => {
    if (!amount || amount <= 0) return;

    const icons = {
      order: 'bag-handle-outline',
      game: 'game-controller-outline',
      welcome: 'hand-left-outline',
    };

    const entry = {
      id: `h_${Date.now()}`,
      type,
      description,
      points: amount,
      date: new Date().toISOString(),
      icon: icons[type] || 'star-outline',
    };

    setState((prev) => ({
      ...prev,
      points: prev.points + amount,
      totalEarned: prev.totalEarned + amount,
      history: [entry, ...prev.history],
      ordersCount: type === 'order' ? prev.ordersCount + 1 : prev.ordersCount,
      gamesCount: type === 'game' ? prev.gamesCount + 1 : prev.gamesCount,
    }));
  }, []);

  // ─── Dépenser des points (rachat de récompense) ───────────────────────────────
  const redeemPoints = useCallback((reward) => {
    if (state.points < reward.points) {
      throw new Error('Solde de points insuffisant.');
    }

    const code = generateVoucherCode();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    const voucher = {
      id: `v_${Date.now()}`,
      rewardId: reward.id,
      rewardName: reward.name,
      code,
      expiry: expiryDate.toISOString(),
      usedAt: null,
    };

    const entry = {
      id: `h_${Date.now()}`,
      type: 'redeem',
      description: `Échangé : ${reward.name}`,
      points: -reward.points,
      date: new Date().toISOString(),
      icon: 'gift-outline',
    };

    setState((prev) => ({
      ...prev,
      points: prev.points - reward.points,
      history: [entry, ...prev.history],
      vouchers: [voucher, ...prev.vouchers],
    }));

    return voucher;
  }, [state.points]);

  // ─── Valeurs dérivées ─────────────────────────────────────────────────────────
  const isLoggedIn = !!state.loyaltyUser && !state._loggedOut;
  const tier = getTierFromPoints(state.totalEarned);
  const nextTier = getNextTier(state.totalEarned);
  const progressToNext = getProgressToNext(state.totalEarned);

  const value = {
    // État
    loyaltyUser: isLoggedIn ? state.loyaltyUser : null,
    isLoggedIn,
    points: state.points,
    totalEarned: state.totalEarned,
    history: state.history,
    ordersCount: state.ordersCount,
    gamesCount: state.gamesCount,
    vouchers: state.vouchers,
    // Paliers
    tier,
    nextTier,
    progressToNext,
    // Actions
    register,
    login,
    logout,
    reconnect,
    earnPoints,
    redeemPoints,
    // Chargement
    isLoaded,
  };

  return (
    <LoyaltyContext.Provider value={value}>
      {children}
    </LoyaltyContext.Provider>
  );
}

// ─── Hook d'accès au contexte ─────────────────────────────────────────────────
export const useLoyalty = () => {
  const ctx = useContext(LoyaltyContext);
  if (!ctx) throw new Error('useLoyalty doit être utilisé dans un LoyaltyProvider');
  return ctx;
};
