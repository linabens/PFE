import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, Dimensions, ScrollView, StatusBar, Animated, Easing
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useLoyalty } from '../src/context/LoyaltyContext';
import { POINTS_RULES } from '../src/constants/loyalty';
import PointsToast from '../src/components/PointsToast';

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

// ── Data ──────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    key: 'cafe',
    label: 'Collection Café',
    sublabel: 'Grains, tasses, arômes',
    color: '#3D1C0C',
    icons: ['coffee', 'coffee-outline', 'cup-water', 'muffin', 'spoon-sugar', 'kettle-outline', 'pot-steam-outline', 'stove', 'cookie-outline', 'leaf-maple'],
    iconLib: 'MaterialCommunityIcons',
  },
  {
    key: 'nuit',
    label: 'Lunaire & Nuit',
    sublabel: 'Lunes, étoiles, rêves',
    color: '#1D4ED8',
    icons: ['moon-waning-crescent', 'star-four-points', 'weather-night', 'circle-double', 'crown-outline', 'diamond-outline', 'sparkles', 'crystal-ball', 'compass-outline', 'map-outline'],
    iconLib: 'MaterialCommunityIcons',
  },
  {
    key: 'nature',
    label: 'Nature Luna',
    sublabel: 'Fleurs, terre, calme',
    color: '#166534',
    icons: ['leaf', 'flower-outline', 'sprout', 'pine-tree', 'weather-sunny', 'water-outline', 'bird', 'butterfly-outline', 'jellyfish-outline', 'bee'],
    iconLib: 'MaterialCommunityIcons',
  },
];

const LEVELS = [
  {
    key: 'facile',
    label: 'Facile',
    desc: 'Grille 3×4 · 6 paires',
    rows: 4, cols: 3,
    color: '#059669',
    timer: 60,
    pts: 60,
  },
  {
    key: 'moyen',
    label: 'Moyen',
    desc: 'Grille 4×5 · 10 paires',
    rows: 5, cols: 4,
    color: '#D97706',
    timer: 120,
    pts: 80,
  },
  {
    key: 'difficile',
    label: 'Expert',
    desc: 'Grille 4×6 · 12 paires',
    rows: 6, cols: 4,
    color: '#DC2626',
    timer: 180,
    pts: 100,
  },
];

// ── Component: Memory Card ─────────────────────────────────────────────────────
const MemoryCard = ({ icon, isFlipped, isMatched, onPress, size, color, lib }) => {
  const flipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(flipAnim, {
      toValue: isFlipped || isMatched ? 180 : 0,
      duration: 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [isFlipped, isMatched]);

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = flipAnim.interpolate({
    inputRange: [89, 90],
    outputRange: [1, 0],
  });

  const backOpacity = flipAnim.interpolate({
    inputRange: [89, 90],
    outputRange: [0, 1],
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      disabled={isFlipped || isMatched}
      style={{ width: size, height: size, margin: 4 }}
    >
      {/* Front (Hidden) */}
      <Animated.View style={[
        s.cardInner,
        { transform: [{ rotateY: frontInterpolate }], opacity: frontOpacity, backgroundColor: C.primary, borderColor: C.border }
      ]}>
        <View style={s.cardPattern}>
          <MaterialCommunityIcons name="star-four-points" size={size/3} color={C.accent} opacity={0.3} />
        </View>
      </Animated.View>

      {/* Back (Icon) */}
      <Animated.View style={[
        s.cardInner,
        s.cardBack,
        { transform: [{ rotateY: backInterpolate }], opacity: backOpacity, borderColor: isMatched ? C.success : C.primary }
      ]}>
        <MaterialCommunityIcons name={icon} size={size/2} color={isMatched ? C.success : C.primary} />
      </Animated.View>
    </TouchableOpacity>
  );
};

// ── Screen: Memory Luna ──────────────────────────────────────────────────────
export default function MemoryLunaScreen() {
  const router = useRouter();

  // ── Navigation ────────────────────────────────────────────────────────────
  const [screen, setScreen] = useState('categories'); // categories | levels | game | result
  const [category, setCategory] = useState(null);
  const [level, setLevel] = useState(null);

  // ── Game State ────────────────────────────────────────────────────────────
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  // ── Loyalty ───────────────────────────────────────────────────────────────
  const { isLoggedIn, earnPoints } = useLoyalty();
  const [showToast, setShowToast] = useState(false);
  const [toastPts, setToastPts] = useState(0);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const timerRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [screen]);

  // ── Game Flow ─────────────────────────────────────────────────────────────
  const initializeGame = (cat, lev) => {
    const pairCount = (lev.rows * lev.cols) / 2;
    const selectedIcons = cat.icons.slice(0, pairCount);
    const deck = [...selectedIcons, ...selectedIcons]
      .sort(() => Math.random() - 0.5)
      .map((icon, index) => ({ id: index, icon }));

    setCards(deck);
    setFlippedIndices([]);
    setMatchedPairs([]);
    setMoves(0);
    setTimeLeft(lev.timer);
    setIsGameOver(false);
    setCategory(cat);
    setLevel(lev);
    setScreen('game');

    timerRef.current = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) { handleGameOver(false); return 0; }
        return p - 1;
      });
    }, 1000);
  };

  const handleGameOver = (win) => {
    clearInterval(timerRef.current);
    setIsGameOver(true);
    setScreen('result');

    if (win && isLoggedIn) {
      const pts = level.pts;
      earnPoints(pts, 'game', `Memory Luna: ${category.label}`);
      setToastPts(pts);
      setShowToast(true);
    }
  };

  const handleCardPress = (index) => {
    if (flippedIndices.length === 2 || flippedIndices.includes(index) || matchedPairs.includes(cards[index].icon)) return;

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [idx1, idx2] = newFlipped;
      if (cards[idx1].icon === cards[idx2].icon) {
        // Match!
        const newMatched = [...matchedPairs, cards[idx1].icon];
        setMatchedPairs(newMatched);
        setFlippedIndices([]);
        if (newMatched.length === (level.rows * level.cols) / 2) {
          setTimeout(() => handleGameOver(true), 600);
        }
      } else {
        // No match
        setTimeout(() => setFlippedIndices([]), 1000);
      }
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER: CATEGORIES
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === 'categories') return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={s.scroll}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={C.primary} />
            <Text style={s.backTxt}>Retour aux jeux</Text>
          </TouchableOpacity>

          <Text style={s.eyebrow}>CONCENTRATION</Text>
          <Text style={s.bigTitle}>Memory Luna</Text>
          <Text style={s.subtitle}>Trouvez les paires d'icônes en un minimum de coups.</Text>

          <Text style={s.sectionLbl}>CHOISIR UNE COLLECTION</Text>

          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.key}
              style={s.catCard}
              onPress={() => { setCategory(cat); setScreen('levels'); }}
            >
              <View style={[s.catIcon, { backgroundColor: C.bg }]}>
                <MaterialCommunityIcons name={cat.icons[0]} size={30} color={cat.color} />
              </View>
              <View style={s.catBody}>
                <Text style={s.catLabel}>{cat.label}</Text>
                <Text style={s.catSub}>{cat.sublabel}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={C.muted} />
            </TouchableOpacity>
          ))}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER: LEVELS
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === 'levels') return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={s.scroll}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <TouchableOpacity style={s.backBtn} onPress={() => setScreen('categories')}>
            <Ionicons name="arrow-back" size={24} color={C.primary} />
            <Text style={s.backTxt}>{category?.label}</Text>
          </TouchableOpacity>

          <Text style={s.eyebrow}>DIFFICULTÉ</Text>
          <Text style={s.bigTitle}>Combien de cartes ?</Text>
          <Text style={s.subtitle}>Plus il y a de cartes, plus le bonus est important.</Text>

          {LEVELS.map(lev => (
            <TouchableOpacity key={lev.key} style={s.levCard} onPress={() => initializeGame(category, lev)}>
              <View style={[s.levBadge, { backgroundColor: lev.color + '15' }]}>
                <Text style={{ color: lev.color, fontWeight: 'bold' }}>{lev.rows*lev.cols}</Text>
              </View>
              <View style={s.levBody}>
                <Text style={[s.levLabel, { color: lev.color }]}>{lev.label}</Text>
                <Text style={s.levDesc}>{lev.desc}</Text>
              </View>
              <View style={s.playBtn}>
                <Ionicons name="play" size={18} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER: RESULT
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === 'result') return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={[s.scroll, { alignItems: 'center' }]}>
        <Text style={s.medal}>{matchedPairs.length === (level.rows*level.cols)/2 ? '🧠' : '⌛'}</Text>
        <Text style={s.bigTitle}>{matchedPairs.length === (level.rows*level.cols)/2 ? 'Excellent !' : 'Temps écoulé'}</Text>
        
        <View style={s.scoreBox}>
          <Text style={s.scoreBig}>{moves}</Text>
          <Text style={s.scoreLbl}>COUPS JOUÉS</Text>
        </View>

        <View style={s.resultActions}>
          <TouchableOpacity style={s.btnPrimary} onPress={() => initializeGame(category, level)}>
            <Text style={s.btnPrimaryTxt}>Rejouer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnSecondary} onPress={() => setScreen('categories')}>
            <Text style={s.btnSecondaryTxt}>Changer de collection</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <PointsToast
          points={toastPts}
          reason={`Paires trouvées ! 🧠`}
          icon="medal-outline"
          visible={showToast}
          onHide={() => setShowToast(false)}
        />
    </SafeAreaView>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER: GAME
  // ════════════════════════════════════════════════════════════════════════════
  const cardSize = (width - 60) / level.cols;

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.closeBtn} onPress={() => { clearInterval(timerRef.current); setScreen('levels'); }}>
          <Ionicons name="close" size={24} color={C.primary} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.timer}>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</Text>
          <Text style={s.moves}>{moves} coups</Text>
        </View>
        <View style={s.badge}>
          <Text style={s.badgeTxt}>{matchedPairs.length} / {(level.rows*level.cols)/2}</Text>
        </View>
      </View>

      <View style={s.gameContainer}>
        <View style={s.grid}>
          {cards.map((card, index) => (
            <MemoryCard
              key={index}
              icon={card.icon}
              isFlipped={flippedIndices.includes(index)}
              isMatched={matchedPairs.includes(card.icon)}
              onPress={() => handleCardPress(index)}
              size={cardSize}
              color={category.color}
            />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  backTxt: { color: C.primary, fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  eyebrow: { fontSize: 10, letterSpacing: 2, color: C.muted, marginBottom: 4, fontFamily: 'Poppins_600SemiBold' },
  bigTitle: { fontSize: 32, fontFamily: 'PlayfairDisplay_700Bold', color: C.primary },
  subtitle: { fontSize: 14, color: C.mocha, marginBottom: 30, fontFamily: 'Poppins_400Regular' },
  sectionLbl: { fontSize: 11, letterSpacing: 1.5, color: C.muted, marginBottom: 16, fontFamily: 'Poppins_600SemiBold' },

  // Categories & Levels
  catCard: {
    backgroundColor: C.card, borderRadius: 24, padding: 16, flexDirection: 'row',
    alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: C.border,
  },
  catIcon: { width: 60, height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  catBody: { flex: 1 },
  catLabel: { fontSize: 18, fontFamily: 'Poppins_600SemiBold', color: C.primary },
  catSub: { fontSize: 12, color: C.muted },

  levCard: {
    backgroundColor: C.card, borderRadius: 24, padding: 20, marginBottom: 14,
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.border,
  },
  levBadge: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  levBody: { flex: 1 },
  levLabel: { fontSize: 18, fontFamily: 'Poppins_600SemiBold' },
  levDesc: { fontSize: 12, color: C.muted },
  playBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },

  // Game UI
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  headerCenter: { alignItems: 'center' },
  closeBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  timer: { fontSize: 20, fontFamily: 'JetBrainsMono_400Regular', color: C.primary },
  moves: { fontSize: 12, color: C.muted, fontFamily: 'Poppins_400Regular' },
  badge: { backgroundColor: C.card, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: C.border },
  badgeTxt: { fontSize: 14, color: C.primary, fontFamily: 'Poppins_600SemiBold' },

  gameContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' },

  // Cards
  cardInner: {
    flex: 1, borderRadius: 12, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', backfaceVisibility: 'hidden',
  },
  cardBack: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: C.card },
  cardPattern: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' },

  // Results
  scoreBox: { backgroundColor: C.card, borderRadius: 24, padding: 30, alignItems: 'center', marginBottom: 30, borderWidth: 2, borderColor: C.primary },
  scoreBig: { fontSize: 60, fontFamily: 'PlayfairDisplay_700Bold', color: C.primary },
  scoreLbl: { fontSize: 12, letterSpacing: 2, color: C.muted },
  medal: { fontSize: 80, marginBottom: 10 },
  resultActions: { width: '100%', gap: 12 },
  btnPrimary: { backgroundColor: C.primary, padding: 18, borderRadius: 16, alignItems: 'center' },
  btnPrimaryTxt: { color: '#FFFFFF', fontFamily: 'Poppins_600SemiBold', fontSize: 16 },
  btnSecondary: { backgroundColor: '#FFFFFF', padding: 18, borderRadius: 16, alignItems: 'center', borderWidth: 2, borderColor: C.primary },
  btnSecondaryTxt: { color: C.primary, fontFamily: 'Poppins_600SemiBold', fontSize: 16 },
});
