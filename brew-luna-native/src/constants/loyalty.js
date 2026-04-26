/**
 * BREW LUNA — Constantes du module Fidélité
 * Définit les paliers, récompenses et règles de points
 */

// ─── Paliers de fidélité ──────────────────────────────────────────────────────
export const TIERS = [
  {
    name: 'Bronze',
    minPoints: 0,
    color: '#C09891',
    textColor: '#3D1C0C',
    icon: 'coffee-outline',
    description: 'Bienvenue dans la famille BrewLuna',
  },
  {
    name: 'Silver',
    minPoints: 500,
    color: '#8B8FA8',
    textColor: '#FFFFFF',
    icon: 'star-half-outline',
    description: 'Un habitué apprécié de BrewLuna',
  },
  {
    name: 'Gold',
    minPoints: 1500,
    color: '#D4A853',
    textColor: '#2C1810',
    icon: 'star-outline',
    description: 'Un membre VIP de BrewLuna',
  },
  {
    name: 'Platinum',
    minPoints: 4000,
    color: '#6B3A2A',
    textColor: '#F5E6D3',
    icon: 'diamond-outline',
    description: 'Le sommet de la fidélité BrewLuna',
  },
];

// ─── Catalogue de récompenses ─────────────────────────────────────────────────
export const REWARDS = [
  {
    id: 'r1',
    name: 'Espresso Offert',
    points: 150,
    icon: 'coffee',
    description: '1 espresso gratuit sur votre prochaine commande',
  },
  {
    id: 'r2',
    name: 'Réduction 10%',
    points: 300,
    icon: 'pricetag-outline',
    description: '10% de réduction sur votre prochaine commande',
  },
  {
    id: 'r3',
    name: 'Viennoiserie Offerte',
    points: 400,
    icon: 'restaurant-outline',
    description: '1 viennoiserie de votre choix offerte',
  },
  {
    id: 'r4',
    name: 'Latte Offert',
    points: 500,
    icon: 'cafe-outline',
    description: '1 latte de votre choix offert',
  },
  {
    id: 'r5',
    name: 'Réduction 25%',
    points: 800,
    icon: 'gift-outline',
    description: '25% de réduction sur toute votre commande',
  },
  {
    id: 'r6',
    name: 'Tournée Offerte',
    points: 1200,
    icon: 'sparkles-outline',
    description: 'Tournée de cafés offerte pour votre table',
  },
];

// ─── Règles de points ─────────────────────────────────────────────────────────
export const POINTS_RULES = {
  PER_TND: 10,         // 10 points par 1.00 TND dépensé
  WELCOME: 100,        // Points de bienvenue à l'inscription
  GAME: {
    easy: 20,
    medium: 40,
    hard: 80,
  },
};

// ─── Calcul du palier depuis les points gagnés à vie ─────────────────────────
export const getTierFromPoints = (totalEarned) => {
  const sorted = [...TIERS].sort((a, b) => b.minPoints - a.minPoints);
  return sorted.find((t) => totalEarned >= t.minPoints) || TIERS[0];
};

// ─── Prochain palier ──────────────────────────────────────────────────────────
export const getNextTier = (totalEarned) => {
  const sorted = [...TIERS].sort((a, b) => a.minPoints - b.minPoints);
  return sorted.find((t) => t.minPoints > totalEarned) || null;
};

// ─── Progression vers le prochain palier (0.0 → 1.0) ─────────────────────────
export const getProgressToNext = (totalEarned) => {
  const current = getTierFromPoints(totalEarned);
  const next = getNextTier(totalEarned);
  if (!next) return 1.0;
  const range = next.minPoints - current.minPoints;
  const earned = totalEarned - current.minPoints;
  return Math.min(earned / range, 1.0);
};

// ─── Génération d'un code de bon d'achat aléatoire ───────────────────────────
export const generateVoucherCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const part = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `BL-${part()}`;
};
