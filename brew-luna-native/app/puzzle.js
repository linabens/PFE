import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, Dimensions, ScrollView, StatusBar, Animated, PanResponder
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
  gridBg:  '#FFFFFF',
  gridSel: '#EAD9C9',
};

// ── Data ──────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    key: 'cafe',
    label: 'Univers du Café',
    sublabel: 'Grains, torréfaction, arômes',
    color: '#3D1C0C',
    iconName: 'coffee-outline',
    words: ['ARABICA', 'ROBUSTA', 'MOKA', 'CREMA', 'GRAIN', 'CUISSON', 'AROME', 'LATTE', 'CAPPUCCINO', 'ESPRESSO'],
  },
  {
    key: 'luna',
    label: 'BrewLuna',
    sublabel: 'Ambiance, nuit, détente',
    color: '#1D4ED8',
    iconName: 'weather-night',
    words: ['LUNE', 'ETOILE', 'DETENTE', 'SOIR', 'CALME', 'PAUSE', 'NUIT', 'LUMIERRE', 'MINUIT', 'LUNAIRE'],
  },
  {
    key: 'nature',
    label: 'Nature & Éveil',
    sublabel: 'Fleurs, terre, réveil',
    color: '#166534',
    iconName: 'leaf-outline',
    words: ['FLEUR', 'TERRE', 'EVEIL', 'MATIN', 'SOLEIL', 'FORET', 'ECLAT', 'FRAIS', 'SOURCE', 'ESPRIT'],
  },
];

const LEVELS = [
  {
    key: 'facile',
    label: 'Facile',
    desc: 'Grille 9×9 · 6 mots · horizontal & vertical',
    color: '#059669',
    iconName: 'shield-check-outline',
    gridSize: 9,
    wordCount: 6,
    timer: 120,
    dirs: [[0, 1], [1, 0], [0, -1], [-1, 0]],
  },
  {
    key: 'moyen',
    label: 'Moyen',
    desc: 'Grille 11×11 · 8 mots · inclut diagonale',
    color: '#D97706',
    iconName: 'shield-half-full',
    gridSize: 11,
    wordCount: 8,
    timer: 180,
    dirs: [[0, 1], [1, 0], [0, -1], [-1, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]],
  },
  {
    key: 'difficile',
    label: 'Expert',
    desc: 'Grille 13×13 · 10 mots · toutes directions',
    color: '#DC2626',
    iconName: 'shield-star-outline',
    gridSize: 13,
    wordCount: 10,
    timer: 240,
    dirs: [[0, 1], [1, 0], [0, -1], [-1, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]],
  },
];

// ── Utils ─────────────────────────────────────────────────────────────────────
const generateGrid = (size, wordList, directions) => {
  const grid = Array.from({ length: size }, () => Array(size).fill(''));
  const placedWords = [];

  const shuffledWords = [...wordList].sort(() => Math.random() - 0.5);

  for (const word of shuffledWords) {
    if (placedWords.length >= 10) break; // cap maximum
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 100) {
      attempts++;
      const dir = directions[Math.floor(Math.random() * directions.length)];
      const r = Math.floor(Math.random() * size);
      const c = Math.floor(Math.random() * size);

      if (canPlaceWord(grid, word, r, c, dir, size)) {
        placeWord(grid, word, r, c, dir);
        placedWords.push({ word, start: [r, c], dir });
        placed = true;
      }
    }
  }

  // Fill empty
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === '') {
        grid[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
      }
    }
  }

  return { grid, placedWords };
};

const canPlaceWord = (grid, word, r, c, [dr, dc], size) => {
  if (r + dr * (word.length - 1) < 0 || r + dr * (word.length - 1) >= size) return false;
  if (c + dc * (word.length - 1) < 0 || c + dc * (word.length - 1) >= size) return false;

  for (let i = 0; i < word.length; i++) {
    const char = grid[r + dr * i][c + dc * i];
    if (char !== '' && char !== word[i]) return false;
  }
  return true;
};

const placeWord = (grid, word, r, c, [dr, dc]) => {
  for (let i = 0; i < word.length; i++) {
    grid[r + dr * i][c + dc * i] = word[i];
  }
};

// ─────────────────────────────────────────────────────────────────────────────
export default function WordSearchScreen() {
  const router = useRouter();

  // ── Navigation ────────────────────────────────────────────────────────────
  const [screen, setScreen] = useState('categories'); // categories | levels | game | result
  const [category, setCategory] = useState(null);
  const [level, setLevel] = useState(null);

  // ── Game State ────────────────────────────────────────────────────────────
  const [gridData, setGridData] = useState({ grid: [], placedWords: [] });
  const [foundWords, setFoundWords] = useState([]);
  const [selection, setSelection] = useState(null); // { start: [r,c], end: [r,c] }
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameActive, setGameActive] = useState(false);

  // ── Loyalty State ─────────────────────────────────────────────────────────
  const { isLoggedIn, earnPoints } = useLoyalty();
  const [showToast, setShowToast] = useState(false);
  const [toastPts, setToastPts] = useState(0);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const timerRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const gridRef  = useRef(null);
  const gridPos  = useRef({ x: 0, y: 0, cellSize: 0 });

  // ── Animations ────────────────────────────────────────────────────────────
  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [screen]);

  // ── Timer Logic ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!gameActive) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) { endSession(); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [gameActive]);

  const endSession = () => {
    setGameActive(false);
    clearInterval(timerRef.current);
    setScreen('result');

    if (isLoggedIn && foundWords.length > 0) {
        const difficultyMap = { facile: 'easy', moyen: 'medium', difficile: 'hard' };
        const key = difficultyMap[level?.key] || 'easy';
        const pts = POINTS_RULES.GAME[key];
        
        earnPoints(pts, 'game', `Mots Cachés: ${category?.label} (${level?.label})`);
        setToastPts(pts);
        setShowToast(true);
      }
  };

  // ── Game Logic ────────────────────────────────────────────────────────────
  const startGame = (cat, lev) => {
    const { grid, placedWords } = generateGrid(lev.gridSize, cat.words, lev.dirs);
    setCategory(cat);
    setLevel(lev);
    setGridData({ grid, placedWords });
    setFoundWords([]);
    setScore(0);
    setTimeLeft(lev.timer);
    setGameActive(true);
    setScreen('game');
  };

  const getCellFromPos = (x, y) => {
    const { x: gx, y: gy, cellSize } = gridPos.current;
    if (cellSize === 0) return null;
    const r = Math.floor((y - gy) / cellSize);
    const c = Math.floor((x - gx) / cellSize);
    if (r >= 0 && r < level.gridSize && c >= 0 && c < level.gridSize) return [r, c];
    return null;
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      const cell = getCellFromPos(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
      if (cell) setSelection({ start: cell, end: cell });
    },
    onPanResponderMove: (evt) => {
      const cell = getCellFromPos(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
      if (cell && selection) {
        if (cell[0] !== selection.end[0] || cell[1] !== selection.end[1]) {
          setSelection(prev => ({ ...prev, end: cell }));
        }
      }
    },
    onPanResponderRelease: () => {
      checkSelection();
      setSelection(null);
    },
  });

  const checkSelection = () => {
    if (!selection) return;
    const { start, end } = selection;
    const dr = end[0] - start[0];
    const dc = end[1] - start[1];
    const len = Math.max(Math.abs(dr), Math.abs(dc)) + 1;

    // Normalize dir
    const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
    const stepC = dc === 0 ? 0 : dc / Math.abs(dc);

    // Build selected string
    let str = "";
    const cells = [];
    for (let i = 0; i < len; i++) {
      const r = start[0] + stepR * i;
      const c = start[1] + stepC * i;
      if (r < 0 || r >= level.gridSize || c < 0 || c >= level.gridSize) break;
      str += gridData.grid[r][c];
      cells.push(`${r}-${c}`);
    }

    // Check against placedWords
    const matched = gridData.placedWords.find(pw => pw.word === str && !foundWords.includes(str));
    if (matched) {
      setFoundWords(p => [...p, str]);
      setScore(p => p + (str.length * 10));
      if (foundWords.length + 1 === gridData.placedWords.length) {
        setTimeout(endSession, 800);
      }
    }
  };

  const isCellSelected = (r, c) => {
    if (!selection) return false;
    const { start, end } = selection;
    const dr = end[0] - start[0];
    const dc = end[1] - start[1];
    const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
    const stepC = dc === 0 ? 0 : dc / Math.abs(dc);
    const len = Math.max(Math.abs(dr), Math.abs(dc)) + 1;

    if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return false;

    for (let i = 0; i < len; i++) {
      if (start[0] + stepR * i === r && start[1] + stepC * i === c) return true;
    }
    return false;
  };

  const isCellFound = (r, c) => {
    return gridData.placedWords.some(pw => {
      if (!foundWords.includes(pw.word)) return false;
      const [sr, sc] = pw.start;
      const [dr, dc] = pw.dir;
      for (let i = 0; i < pw.word.length; i++) {
        if (sr + dr * i === r && sc + dc * i === c) return true;
      }
      return false;
    });
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
            <Text style={s.backTxt}>Retour</Text>
          </TouchableOpacity>

          <Text style={s.eyebrow}>DIVERTISSEMENT</Text>
          <Text style={s.bigTitle}>Mots Cachés</Text>
          <Text style={s.subtitle}>Trouvez les mots thématiques pour gagner des points</Text>

          <Text style={s.sectionLbl}>CHOISIR UNE COLLECTION</Text>

          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.key}
              style={s.catCard}
              onPress={() => { setCategory(cat); setScreen('levels'); }}
            >
              <View style={[s.catIcon, { backgroundColor: C.bg }]}>
                <MaterialCommunityIcons name={cat.iconName} size={30} color={cat.color} />
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
          <Text style={s.bigTitle}>Ajustez le niveau</Text>
          <Text style={s.subtitle}>Plus le niveau est haut, plus vous gagnez de points</Text>

          {LEVELS.map(lev => (
            <TouchableOpacity key={lev.key} style={s.levCard} onPress={() => startGame(category, lev)}>
              <View style={[s.levBadge, { backgroundColor: lev.color + '15' }]}>
                <MaterialCommunityIcons name={lev.iconName} size={26} color={lev.color} />
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
        <Text style={s.medal}>{foundWords.length > 0 ? '🧠' : '🎯'}</Text>
        <Text style={s.bigTitle}>Esprit Affûté !</Text>
        <Text style={s.subtitle}>Vous avez trouvé {foundWords.length} mots sur {gridData.placedWords.length}</Text>

        <View style={s.scoreBox}>
          <Text style={s.scoreBig}>{score}</Text>
          <Text style={s.scoreLbl}>POINTS SCORE</Text>
        </View>

        <View style={s.resultActions}>
          <TouchableOpacity style={s.btnPrimary} onPress={() => startGame(category, level)}>
            <Text style={s.btnPrimaryTxt}>Rejuger cette grille</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnSecondary} onPress={() => setScreen('categories')}>
            <Text style={s.btnSecondaryTxt}>Choisir un autre thème</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <PointsToast
          points={toastPts}
          reason={`Défi terminé ! 🎯`}
          icon="ribbon-outline"
          visible={showToast}
          onHide={() => setShowToast(false)}
        />
    </SafeAreaView>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER: GAME
  // ════════════════════════════════════════════════════════════════════════════
  const cellSize = (width - 40) / level.gridSize;

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" />
      
      {/* Top Bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => setScreen('levels')} style={s.closeBtnGame}>
            <Ionicons name="close" size={24} color={C.primary} />
        </TouchableOpacity>
        <View style={s.timerChip}>
          <Ionicons name="time-outline" size={16} color={timeLeft < 30 ? C.danger : C.primary} />
          <Text style={[s.timerTxt, { color: timeLeft < 30 ? C.danger : C.primary }]}>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </Text>
        </View>
        <Text style={s.liveScore}>{score} pts</Text>
      </View>

      <View style={s.gameBody}>
        <View style={s.gameHeader}>
            <View style={s.catBadge}>
                <Text style={s.catBadgeTxt}>{category?.label.toUpperCase()}</Text>
            </View>
            <Text style={s.foundCnt}>{foundWords.length} / {gridData.placedWords.length}</Text>
        </View>

        {/* The Grid */}
        <View
          style={s.gridContainer}
          onLayout={(e) => {
            e.target.measure((x, y, w, h, px, py) => {
              gridPos.current = { x: px, y: py, cellSize: w / level.gridSize };
            });
          }}
          {...panResponder.panHandlers}
        >
          {gridData.grid.map((row, r) => (
            <View key={r} style={s.row}>
              {row.map((char, c) => {
                const selected = isCellSelected(r, c);
                const found = isCellFound(r, c);
                return (
                  <View
                    key={c}
                    style={[
                      s.cell,
                      { width: cellSize, height: cellSize },
                      selected && s.cellSelected,
                      found && s.cellFound
                    ]}
                  >
                    <Text style={[
                      s.cellChar,
                      selected && s.cellCharSelected,
                      found && s.cellCharFound
                    ]}>
                      {char}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {/* Word List */}
        <View style={s.wordList}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.wordScroll}
          >
            {gridData.placedWords.map((pw, i) => (
              <View 
                key={i} 
                style={[s.wordBadge, foundWords.includes(pw.word) && s.wordBadgeFound]}
              >
                <Text style={[s.wordText, foundWords.includes(pw.word) && s.wordTextFound]}>
                  {pw.word}
                </Text>
              </View>
            ))}
          </ScrollView>
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

  scoreBox: { backgroundColor: C.card, borderRadius: 24, padding: 30, alignItems: 'center', marginBottom: 30, borderWidth: 2, borderColor: C.primary },
  scoreBig: { fontSize: 60, fontFamily: 'PlayfairDisplay_700Bold', color: C.primary },
  scoreLbl: { fontSize: 12, letterSpacing: 2, color: C.muted },
  medal: { fontSize: 80, marginBottom: 10 },
  resultActions: { width: '100%', gap: 12 },
  btnPrimary: { backgroundColor: C.primary, padding: 18, borderRadius: 16, alignItems: 'center' },
  btnPrimaryTxt: { color: '#FFFFFF', fontFamily: 'Poppins_600SemiBold', fontSize: 16 },
  btnSecondary: { backgroundColor: '#FFFFFF', padding: 18, borderRadius: 16, alignItems: 'center', borderWidth: 2, borderColor: C.primary },
  btnSecondaryTxt: { color: C.primary, fontFamily: 'Poppins_600SemiBold', fontSize: 16 },

  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  timerChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.card, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: C.border },
  timerTxt: { fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  liveScore: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: C.primary },

  gameBody: { flex: 1, alignItems: 'center' },
  gridContainer: { backgroundColor: C.gridBg, borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: C.primary },
  row: { flexDirection: 'row' },
  cell: { alignItems: 'center', justifyContent: 'center', borderRightWidth: 0.5, borderBottomWidth: 0.5, borderColor: '#EEE' },
  cellSelected: { backgroundColor: C.gridSel },
  cellFound: { backgroundColor: C.accent + '20' },
  cellChar: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: C.primary },
  cellCharSelected: { color: C.primary, fontWeight: 'bold' },
  cellCharFound: { color: C.primary, opacity: 0.6 },

  wordList: { width: '100%', marginTop: 20 },
  wordScroll: { paddingHorizontal: 20, gap: 10 },
  wordBadge: { backgroundColor: C.card, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: C.border },
  wordBadgeFound: { backgroundColor: C.accent, borderColor: C.accent },
  wordText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: C.primary },
  wordTextFound: { color: '#FFFFFF', textDecorationLine: 'line-through' },

  gameHeader: { width: '100%', paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  catBadge:   { backgroundColor: C.card, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: C.border },
  catBadgeTxt:{ fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: C.primary, letterSpacing: 0.5 },
  foundCnt:   { fontSize: 14, color: C.muted, fontFamily: 'Poppins_600SemiBold' },
  closeBtnGame: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
});
