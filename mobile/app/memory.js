import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  SafeAreaView, Dimensions, ScrollView, StatusBar, Animated, Easing
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Brain, Hourglass } from 'lucide-react-native';
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
    sublabel: 'Lattes, grains, tasses',
    color: '#3D1C0C',
    images: [
      'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1495474472201-447beec73507?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1507133750070-4ed019df2d59?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1610889556528-9a770e32642f?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1461023058943-07cb14a6ed45?auto=format&fit=crop&w=400&q=80',
    ],
  },
  {
    key: 'pastries',
    label: 'Pâtisseries',
    sublabel: 'Croissants, muffins, tartes',
    color: '#D97706',
    images: [
      'https://images.unsplash.com/photo-1555507036-ab1e4006aaeb?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1587668178277-295251f900ce?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1514517521153-1be72277b32f?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1509365465994-3b2d79040db3?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1530610476181-d83430b64dcb?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1515037893149-de7f840978e2?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1627308595186-b48d2d667f13?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1587241321921-91a834d6d191?auto=format&fit=crop&w=400&q=80',
    ],
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
const MemoryCard = ({ image, isFlipped, isMatched, onPress, size, color }) => {
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

      {/* Back (Image) */}
      <Animated.View style={[
        s.cardInner,
        s.cardBack,
        { transform: [{ rotateY: backInterpolate }], opacity: backOpacity, borderColor: isMatched ? C.success : C.primary, overflow: 'hidden' }
      ]}>
        <Image source={{ uri: image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        {isMatched && (
          <View style={{ position: 'absolute', backgroundColor: C.success + 'AA', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name="check-circle" size={size/3} color="#FFF" />
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

// ── Screen: Coffee Memory ──────────────────────────────────────────────────────
export default function CoffeeMemoryScreen() {
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
    const selectedImages = cat.images.slice(0, pairCount);
    const deck = [...selectedImages, ...selectedImages]
      .sort(() => Math.random() - 0.5)
      .map((image, index) => ({ id: index, image }));

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
      earnPoints(pts, 'game', `Coffee Memory: ${category.label}`);
      setToastPts(pts);
      setShowToast(true);
    }
  };

  const handleCardPress = (index) => {
    if (flippedIndices.length === 2 || flippedIndices.includes(index) || matchedPairs.includes(cards[index].image)) return;

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [idx1, idx2] = newFlipped;
      if (cards[idx1].image === cards[idx2].image) {
        // Match!
        const newMatched = [...matchedPairs, cards[idx1].image];
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
          <Text style={s.bigTitle}>Coffee Memory</Text>
          <Text style={s.subtitle}>Trouvez les paires d'images en un minimum de coups.</Text>

          <Text style={s.sectionLbl}>CHOISIR UNE COLLECTION</Text>

          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.key}
              style={s.catCard}
              onPress={() => { setCategory(cat); setScreen('levels'); }}
            >
              <View style={[s.catIcon, { backgroundColor: C.bg, overflow: 'hidden' }]}>
                <Image source={{ uri: cat.images[0] }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
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
        <View style={s.medalWrap}>
          {matchedPairs.length === (level.rows * level.cols) / 2 ? (
            <Brain size={64} color={C.primary} strokeWidth={1.75} />
          ) : (
            <Hourglass size={64} color={C.muted} strokeWidth={1.75} />
          )}
        </View>
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
          reason="Paires trouvées"
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
              image={card.image}
              isFlipped={flippedIndices.includes(index)}
              isMatched={matchedPairs.includes(card.image)}
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
  medalWrap: { marginBottom: 16, alignItems: 'center', justifyContent: 'center' },
  resultActions: { width: '100%', gap: 12 },
  btnPrimary: { backgroundColor: C.primary, padding: 18, borderRadius: 16, alignItems: 'center' },
  btnPrimaryTxt: { color: '#FFFFFF', fontFamily: 'Poppins_600SemiBold', fontSize: 16 },
  btnSecondary: { backgroundColor: '#FFFFFF', padding: 18, borderRadius: 16, alignItems: 'center', borderWidth: 2, borderColor: C.primary },
  btnSecondaryTxt: { color: C.primary, fontFamily: 'Poppins_600SemiBold', fontSize: 16 },
});
