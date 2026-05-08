import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  StatusBar, Animated, ScrollView, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useGame } from '../../src/context/GameContext';
import { useLoyalty } from '../../src/context/LoyaltyContext';
import PointsToast from '../../src/components/PointsToast';

const { width } = Dimensions.get('window');

const C = {
  bg: '#FAF3EB', card: '#FFFFFF', primary: '#5C3221', accent: '#C09891',
  muted: '#B89A87', mocha: '#7A5C4D', border: '#EAD9C9', cream: '#F5E6D3',
  success: '#166534', successBg: '#DCFCE7',
};

function buildSolved(n) {
  return Array.from({ length: n * n }, (_, i) => (i === n * n - 1 ? 0 : i + 1));
}

function shuffle(tiles, n, moves = 300) {
  let t = [...tiles];
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (let m = 0; m < moves; m++) {
    const emptyIdx = t.indexOf(0);
    const row = Math.floor(emptyIdx / n);
    const col = emptyIdx % n;
    const valid = directions
      .map(([dr, dc]) => ({ r: row + dr, c: col + dc }))
      .filter(({ r, c }) => r >= 0 && r < n && c >= 0 && c < n)
      .map(({ r, c }) => r * n + c);
    const pick = valid[Math.floor(Math.random() * valid.length)];
    [t[emptyIdx], t[pick]] = [t[pick], t[emptyIdx]];
  }
  return t;
}

function isSolved(tiles, n) {
  return tiles.every((v, i) => i === n * n - 1 ? v === 0 : v === i + 1);
}

function getAdjacent(idx, n) {
  const row = Math.floor(idx / n);
  const col = idx % n;
  return [
    row > 0 ? idx - n : -1,
    row < n - 1 ? idx + n : -1,
    col > 0 ? idx - 1 : -1,
    col < n - 1 ? idx + 1 : -1,
  ].filter(i => i >= 0);
}

export default function PuzzleSliderScreen() {
  const router = useRouter();
  const { updatePuzzleScore } = useGame();
  const { isLoggedIn, earnPoints } = useLoyalty();

  const [n, setN] = useState(3); // 3 or 4
  const [tiles, setTiles] = useState(null);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [phase, setPhase] = useState('intro'); // intro | playing | won
  const [showToast, setShowToast] = useState(false);

  const timerRef = useRef(null);
  const slideAnims = useRef({});

  const TILE_SIZE = Math.floor((width - 60) / n);

  const startGame = useCallback((size) => {
    const solved = buildSolved(size);
    const shuffled = shuffle(solved, size);
    setN(size);
    setTiles(shuffled);
    setMoves(0);
    setSeconds(0);
    setPhase('playing');
    slideAnims.current = {};
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
  }, []);

  const handleTile = (idx) => {
    if (phase !== 'playing') return;
    const emptyIdx = tiles.indexOf(0);
    if (!getAdjacent(idx, n).includes(emptyIdx)) return;

    const next = [...tiles];
    [next[emptyIdx], next[idx]] = [next[idx], next[emptyIdx]];
    setTiles(next);
    setMoves(m => m + 1);

    if (isSolved(next, n)) {
      clearInterval(timerRef.current);
      setPhase('won');
      updatePuzzleScore(seconds, `${n}x${n}`);
      if (isLoggedIn) {
        const pts = n === 3 ? 60 : 100;
        earnPoints(pts, 'game', 'Puzzle Slider');
        setShowToast(true);
      }
    }
  };

  const fmt = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const tileColor = (val) => {
    if (val === 0) return 'transparent';
    const hue = (val * 23) % 360;
    return C.primary;
  };

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (phase === 'intro') return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={s.center}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={C.primary} />
        </TouchableOpacity>
        <MaterialCommunityIcons name="puzzle-outline" size={72} color={C.accent} style={{ marginBottom: 16 }} />
        <Text style={s.eyebrow}>SLIDE & SOLVE</Text>
        <Text style={s.bigTitle}>Puzzle Slider</Text>
        <Text style={s.subtitle}>Arrange the tiles in order!{'\n'}Choose your challenge:</Text>
        <View style={s.diffRow}>
          <TouchableOpacity style={s.diffCard} onPress={() => startGame(3)}>
            <Text style={s.diffTitle}>3 × 3</Text>
            <Text style={s.diffSub}>Beginner · 8 tiles</Text>
            <View style={s.miniGrid}>
              {[1,2,3,4,5,6,7,8,0].map((v,i) => (
                <View key={i} style={[s.miniCell, v === 0 && { backgroundColor: C.cream }]}>
                  {v > 0 && <Text style={s.miniTxt}>{v}</Text>}
                </View>
              ))}
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={s.diffCard} onPress={() => startGame(4)}>
            <Text style={s.diffTitle}>4 × 4</Text>
            <Text style={s.diffSub}>Expert · 15 tiles</Text>
            <View style={[s.miniGrid, { width: 80 }]}>
              {Array.from({length:16},(_,i)=>i<15?i+1:0).map((v,i) => (
                <View key={i} style={[s.miniCell, { width: 18, height: 18 }, v === 0 && { backgroundColor: C.cream }]}>
                  {v > 0 && <Text style={[s.miniTxt, { fontSize: 7 }]}>{v}</Text>}
                </View>
              ))}
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  // ── WON ────────────────────────────────────────────────────────────────────
  if (phase === 'won') return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.center}>
        <MaterialCommunityIcons name="trophy-outline" size={72} color={C.primary} style={{ marginBottom: 12 }} />
        <Text style={s.bigTitle}>Puzzle Solved!</Text>
        <View style={s.statsRow}>
          {[['Moves', moves], ['Time', fmt(seconds)]].map(([lbl, val]) => (
            <View key={lbl} style={s.statBox}>
              <Text style={s.statNum}>{val}</Text>
              <Text style={s.statLbl}>{lbl}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={s.startBtn} onPress={() => startGame(n)}>
          <Text style={s.startBtnTxt}>Play Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.secondaryBtn} onPress={() => setPhase('intro')}>
          <Text style={s.secondaryTxt}>Change Difficulty</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.secondaryBtn} onPress={() => router.back()}>
          <Text style={s.secondaryTxt}>Back to Games</Text>
        </TouchableOpacity>
      </ScrollView>
      <PointsToast points={n === 3 ? 60 : 100} reason="Puzzle solved" icon="puzzle-outline" visible={showToast} onHide={() => setShowToast(false)} />
    </SafeAreaView>
  );

  // ── PLAYING ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => { clearInterval(timerRef.current); setPhase('intro'); }}>
          <Ionicons name="arrow-back" size={22} color={C.primary} />
        </TouchableOpacity>
        <View style={s.headerStats}>
          <View style={s.stat}>
            <MaterialCommunityIcons name="cursor-move" size={14} color={C.accent} />
            <Text style={s.statTxt}>{moves}</Text>
          </View>
          <View style={s.stat}>
            <Ionicons name="time-outline" size={14} color={C.accent} />
            <Text style={s.statTxt}>{fmt(seconds)}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => startGame(n)}>
          <Ionicons name="refresh" size={22} color={C.primary} />
        </TouchableOpacity>
      </View>

      <View style={s.boardWrap}>
        <View style={[s.board, { width: TILE_SIZE * n + (n - 1) * 4 + 8, height: TILE_SIZE * n + (n - 1) * 4 + 8 }]}>
          {tiles?.map((val, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                s.tile,
                { width: TILE_SIZE, height: TILE_SIZE },
                val === 0 && s.emptyTile,
              ]}
              onPress={() => handleTile(idx)}
              disabled={val === 0}
              activeOpacity={0.8}
            >
              {val > 0 && (
                <>
                  <Text style={s.tileNum}>{val}</Text>
                  <MaterialCommunityIcons name="coffee-outline" size={14} color={C.accent} style={{ opacity: 0.4 }} />
                </>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Text style={s.hint}>Tap a tile next to the empty space to slide it</Text>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  center: { padding: 24, alignItems: 'center', paddingBottom: 48 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 32, padding: 4 },
  eyebrow: { fontSize: 10, letterSpacing: 2, color: C.muted, fontFamily: 'Poppins_600SemiBold', marginBottom: 4 },
  bigTitle: { fontSize: 32, fontFamily: 'PlayfairDisplay_700Bold', color: C.primary, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: C.mocha, textAlign: 'center', fontFamily: 'Poppins_400Regular', marginBottom: 32, lineHeight: 22 },
  diffRow: { flexDirection: 'row', gap: 16 },
  diffCard: { backgroundColor: C.card, borderRadius: 20, padding: 20, alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: C.border, flex: 1 },
  diffTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22, color: C.primary },
  diffSub: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: C.muted },
  miniGrid: { flexDirection: 'row', flexWrap: 'wrap', width: 60, marginTop: 8, gap: 2 },
  miniCell: { width: 18, height: 18, backgroundColor: C.primary, borderRadius: 3, alignItems: 'center', justifyContent: 'center' },
  miniTxt: { color: '#fff', fontSize: 8, fontFamily: 'JetBrainsMono_400Regular' },
  statsRow: { flexDirection: 'row', gap: 16, marginVertical: 24 },
  statBox: { backgroundColor: C.card, borderRadius: 16, padding: 20, alignItems: 'center', minWidth: 100, borderWidth: 1, borderColor: C.border },
  statNum: { fontFamily: 'JetBrainsMono_400Regular', fontSize: 24, color: C.primary },
  statLbl: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: C.muted, marginTop: 4 },
  startBtn: { backgroundColor: C.primary, paddingVertical: 16, paddingHorizontal: 40, borderRadius: 16, marginBottom: 12 },
  startBtnTxt: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 16 },
  secondaryBtn: { paddingVertical: 12 },
  secondaryTxt: { color: C.mocha, fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerStats: { flexDirection: 'row', gap: 20 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statTxt: { fontFamily: 'JetBrainsMono_400Regular', fontSize: 14, color: C.primary },
  boardWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  board: { backgroundColor: C.border, borderRadius: 16, padding: 4, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  tile: { backgroundColor: C.primary, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 2 },
  emptyTile: { backgroundColor: C.cream },
  tileNum: { fontFamily: 'JetBrainsMono_400Regular', fontSize: 22, color: '#fff', fontWeight: 'bold' },
  hint: { textAlign: 'center', color: C.muted, fontFamily: 'Poppins_400Regular', fontSize: 12, paddingBottom: 24 },
});
