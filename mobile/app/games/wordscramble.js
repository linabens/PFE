import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  StatusBar, Animated, Dimensions, PanResponder, ScrollView
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
  success: '#166534', successBg: '#DCFCE7', error: '#9B1C1C', errorBg: '#FEE2E2',
  gold: '#D97706', goldBg: '#FEF3C7',
};

const BOGGLE_WORDS = [
  'CAFE','GRAIN','TASSE','NOIR','LAIT','SUCRE','MATIN','PAUSE','CHAUD',
  'FROID','GLACE','SIROP','AROME','DOUX','FORT','MUG','EAU','MOKA','THE',
  'BREW','ROAST','MOCHA','LATTE','CREMA','FROTH','LUNGO',
  'BARISTA', 'FILTRE', 'GRAINS', 'TASSES', 'CHAUDS'
];

const COMMON_LETTERS = "EEEEEEAAAAAAIIIIIIOOOOOOUUUUUNNNNNRRRRRRSSSSSSSTTTTTLLLLDDCCHHMMBBPVGFJQZYXKW";

function dfsPlace(grid, letters, idx, path, size) {
  if (idx === letters.length) return true;
  const current = path[path.length - 1];
  const dirs = [
    [-1,-1],[-1,0],[-1,1],
    [0,-1],        [0,1],
    [1,-1], [1,0], [1,1]
  ].sort(() => Math.random() - 0.5);

  for (let d of dirs) {
    const nr = current.r + d[0];
    const nc = current.c + d[1];
    if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
      if (grid[nr][nc] === '' && !path.find(p => p.r === nr && p.c === nc)) {
        path.push({r: nr, c: nc});
        if (dfsPlace(grid, letters, idx + 1, path, size)) return true;
        path.pop();
      }
    }
  }
  return false;
}

function generateGrid(size) {
  const grid = Array(size).fill(null).map(() => Array(size).fill(''));
  const wordsToPlace = [...BOGGLE_WORDS].sort(() => Math.random() - 0.5).slice(0, size === 4 ? 4 : (size === 5 ? 6 : 8));
  
  wordsToPlace.forEach(word => {
    const letters = word.split('');
    let startCandidates = [];
    for(let r=0; r<size; r++) {
      for(let c=0; c<size; c++) {
        if(grid[r][c] === '') startCandidates.push({r, c});
      }
    }
    startCandidates.sort(() => Math.random() - 0.5);
    for (let start of startCandidates) {
      let path = [start];
      if (dfsPlace(grid, letters, 1, path, size)) {
        path.forEach((p, i) => grid[p.r][p.c] = letters[i]);
        break;
      }
    }
  });

  // Fill empty spaces
  for(let r=0; r<size; r++) {
    for(let c=0; c<size; c++) {
      if(grid[r][c] === '') {
        grid[r][c] = COMMON_LETTERS[Math.floor(Math.random() * COMMON_LETTERS.length)];
      }
    }
  }
  return grid;
}

export default function WordScrambleScreen() {
  const router = useRouter();
  const { updateWordScrambleScore } = useGame();
  const { isLoggedIn, earnPoints } = useLoyalty();

  const [mode, setMode] = useState(null); // null | 'classic' | 'survival' | 'timeAttack' | 'result'
  const [gridSize, setGridSize] = useState(4);
  const [grid, setGrid] = useState([]);
  
  const [score, setScore] = useState(0);
  const [foundWords, setFoundWords] = useState([]);
  const [streak, setStreak] = useState(0);
  
  // Game state
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [lives, setLives] = useState(3);
  const timerRef = useRef(null);
  
  // Interaction
  const gridRef = useRef(null);
  const [gridBox, setGridBox] = useState(null);
  const [activePath, setActivePath] = useState([]);
  
  const [showToast, setShowToast] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong'
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (mode === 'survival' || mode === 'timeAttack') {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleTimeOut();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [mode, lives]);

  const handleTimeOut = () => {
    if (mode === 'survival') {
      if (lives > 1) {
        setLives(l => l - 1);
        setTimeRemaining(60); // Reset to 60s for next life
      } else {
        endGame();
      }
    } else if (mode === 'timeAttack') {
      endGame();
    }
  };

  const measureGrid = () => {
    gridRef.current?.measure((x, y, w, h, px, py) => {
      setGridBox({ px, py, w, h, cellSize: w / gridSize });
    });
  };

  const startGame = (selectedMode) => {
    setMode(selectedMode);
    setGridSize(4);
    setScore(0);
    setFoundWords([]);
    setStreak(0);
    setGrid(generateGrid(4));
    setFeedback(null);
    
    if (selectedMode === 'survival') {
      setTimeRemaining(120);
      setLives(3);
    } else if (selectedMode === 'timeAttack') {
      setTimeRemaining(60);
    }
    
    setTimeout(measureGrid, 500);
  };

  const endGame = () => {
    clearInterval(timerRef.current);
    setMode('result');
    updateWordScrambleScore(score);
    if (isLoggedIn && score > 0) {
      earnPoints(score, 'game', 'Word Brew');
      setShowToast(true);
    }
  };

  const getCellByCoordinates = (x, y) => {
    if (!gridBox) return null;
    const { px, py, cellSize } = gridBox;
    const c = Math.floor((x - px) / cellSize);
    const r = Math.floor((y - py) / cellSize);
    if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
      return { r, c };
    }
    return null;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const cell = getCellByCoordinates(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
        if (cell) setActivePath([cell]);
      },
      onPanResponderMove: (evt) => {
        const cell = getCellByCoordinates(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
        if (cell) {
          setActivePath(prev => {
            if (prev.length === 0) return [cell];
            const last = prev[prev.length - 1];
            // If same cell, do nothing
            if (last.r === cell.r && last.c === cell.c) return prev;
            // If previous cell (backtracking), remove last
            if (prev.length > 1) {
              const secondLast = prev[prev.length - 2];
              if (secondLast.r === cell.r && secondLast.c === cell.c) {
                return prev.slice(0, -1);
              }
            }
            // If adjacent and not already in path, add it
            const isAdjacent = Math.abs(last.r - cell.r) <= 1 && Math.abs(last.c - cell.c) <= 1;
            const isNotUsed = !prev.find(p => p.r === cell.r && p.c === cell.c);
            if (isAdjacent && isNotUsed) {
              return [...prev, cell];
            }
            return prev;
          });
        }
      },
      onPanResponderRelease: () => {
        validateWord();
      }
    })
  ).current;

  // Needed to read the latest activePath in onPanResponderRelease
  const activePathRef = useRef([]);
  useEffect(() => { activePathRef.current = activePath; }, [activePath]);

  const validateWord = () => {
    const path = activePathRef.current;
    if (path.length < 3) {
      setActivePath([]);
      return;
    }
    
    const word = path.map(p => grid[p.r][p.c]).join('');
    
    if (BOGGLE_WORDS.includes(word) && !foundWords.includes(word)) {
      // Valid Word
      const newScore = word.length * 10 * (mode === 'timeAttack' && streak >= 3 ? 1.5 : 1);
      setScore(s => s + newScore);
      setFoundWords(prev => [word, ...prev]);
      setStreak(s => s + 1);
      
      if (mode === 'survival') {
        const timeBonus = word.length >= 7 ? 15 : (word.length >= 5 ? 10 : 5);
        setTimeRemaining(t => t + timeBonus);
      }

      setFeedback('correct');
      
      // Progression (Grid expansion)
      const totalFound = foundWords.length + 1;
      if (totalFound === 10 && gridSize < 5) {
        setGridSize(5);
        setGrid(generateGrid(5));
        setTimeout(measureGrid, 100);
      } else if (totalFound === 20 && gridSize < 6) {
        setGridSize(6);
        setGrid(generateGrid(6));
        setTimeout(measureGrid, 100);
      } else if (totalFound % 4 === 0) {
        // Shuffle grid every 4 words to keep it fresh
        setGrid(generateGrid(gridSize));
      }

    } else {
      // Invalid
      setStreak(0);
      setFeedback('wrong');
    }

    setTimeout(() => {
      setFeedback(null);
      setActivePath([]);
    }, 500);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const renderGrid = () => {
    const activeWord = activePath.map(p => grid[p.r][p.c]).join('');
    
    return (
      <View style={s.gameContainer}>
        {/* HUD */}
        <View style={s.hud}>
          <View style={s.hudCol}>
            <Text style={s.hudLabel}>Score</Text>
            <Text style={s.hudValue}>{Math.floor(score)}</Text>
          </View>
          
          {mode !== 'classic' && (
            <View style={s.hudColCenter}>
              <Text style={s.hudLabel}>Temps</Text>
              <Text style={[s.hudValue, timeRemaining <= 10 && { color: C.error }]}>
                {formatTime(timeRemaining)}
              </Text>
            </View>
          )}

          <View style={s.hudColRight}>
            {mode === 'survival' ? (
              <>
                <Text style={s.hudLabel}>Vies</Text>
                <View style={{ flexDirection: 'row' }}>
                  {[1,2,3].map(i => (
                    <Ionicons key={i} name={i <= lives ? "heart" : "heart-outline"} size={16} color={C.error} />
                  ))}
                </View>
              </>
            ) : (
              <>
                <Text style={s.hudLabel}>Streak</Text>
                <Text style={[s.hudValue, streak >= 3 && { color: C.gold }]}>{streak} 🔥</Text>
              </>
            )}
          </View>
        </View>

        {/* Current Word Display */}
        <View style={[s.wordDisplay, feedback === 'correct' && s.wordCorrect, feedback === 'wrong' && s.wordWrong]}>
          <Text style={[s.wordDisplayTxt, feedback === 'correct' && {color: C.success}, feedback === 'wrong' && {color: C.error}]}>
            {activeWord || 'Tracez un mot...'}
          </Text>
        </View>

        {/* The Grid */}
        <View style={s.gridArea} ref={gridRef} onLayout={measureGrid} {...panResponder.panHandlers}>
          {grid.map((row, r) => (
            <View key={`r-${r}`} style={s.gridRow}>
              {row.map((letter, c) => {
                const isActive = activePath.find(p => p.r === r && p.c === c);
                const isLast = activePath.length > 0 && activePath[activePath.length - 1].r === r && activePath[activePath.length - 1].c === c;
                return (
                  <View 
                    key={`c-${c}`} 
                    style={[
                      s.cell, 
                      { width: (width - 48) / gridSize, height: (width - 48) / gridSize },
                      isActive && s.cellActive,
                      isLast && s.cellLast
                    ]}
                  >
                    <Text style={[s.cellTxt, isActive && s.cellTxtActive]}>{letter}</Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {/* Found Words List */}
        <View style={s.foundList}>
          <Text style={s.foundTitle}>Mots trouvés ({foundWords.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.foundScroll}>
            {foundWords.map((w, i) => (
              <View key={i} style={s.foundPill}>
                <Text style={s.foundPillTxt}>{w}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
        
        {mode === 'classic' && (
           <TouchableOpacity style={s.quitBtn} onPress={endGame}>
             <Text style={s.quitBtnTxt}>Terminer</Text>
           </TouchableOpacity>
        )}
      </View>
    );
  };

  // ── MENU ────────────────────────────────────────────────────────────────
  if (mode === null) return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={s.center}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={C.primary} />
        </TouchableOpacity>
        <MaterialCommunityIcons name="alphabetical-variant" size={72} color={C.accent} style={{ marginBottom: 16 }} />
        <Text style={s.eyebrow}>WORD BREW</Text>
        <Text style={s.bigTitle}>Boggle Edition</Text>
        <Text style={s.subtitle}>Glissez pour former des mots !</Text>

        <TouchableOpacity style={s.modeBtn} onPress={() => startGame('classic')}>
          <View style={[s.modeIcon, { backgroundColor: C.mocha + '20' }]}>
            <Ionicons name="cafe" size={24} color={C.mocha} />
          </View>
          <View style={s.modeInfo}>
            <Text style={s.modeTitle}>Classique</Text>
            <Text style={s.modeDesc}>Sans limite de temps. Détendez-vous.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={C.muted} />
        </TouchableOpacity>

        <TouchableOpacity style={s.modeBtn} onPress={() => startGame('survival')}>
          <View style={[s.modeIcon, { backgroundColor: C.error + '20' }]}>
            <Ionicons name="heart" size={24} color={C.error} />
          </View>
          <View style={s.modeInfo}>
            <Text style={s.modeTitle}>Brew Rush (Survie)</Text>
            <Text style={s.modeDesc}>+ Secondes par mot. Grille évolutive !</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={C.muted} />
        </TouchableOpacity>

        <TouchableOpacity style={s.modeBtn} onPress={() => startGame('timeAttack')}>
          <View style={[s.modeIcon, { backgroundColor: C.gold + '20' }]}>
            <Ionicons name="flash" size={24} color={C.gold} />
          </View>
          <View style={s.modeInfo}>
            <Text style={s.modeTitle}>Café Express</Text>
            <Text style={s.modeDesc}>60 secondes chrono. Multiplicateur Combo !</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={C.muted} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );

  // ── RESULT ────────────────────────────────────────────────────────────────
  if (mode === 'result') return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.center}>
        <MaterialCommunityIcons name="trophy" size={72} color={C.primary} style={{ marginBottom: 12 }} />
        <Text style={s.bigTitle}>Partie Terminée !</Text>
        <View style={s.scoreCircle}>
          <Text style={s.scoreBig}>{Math.floor(score)}</Text>
          <Text style={s.scoreOf}>pts</Text>
        </View>
        <Text style={s.subtitle}>{foundWords.length} mots trouvés.</Text>
        <TouchableOpacity style={[s.startBtn, {width: '100%'}]} onPress={() => setMode(null)}>
          <Text style={s.startBtnTxt}>Changer de mode</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.secondaryBtn} onPress={() => router.back()}>
          <Text style={s.secondaryTxt}>Retour aux jeux</Text>
        </TouchableOpacity>
      </ScrollView>
      <PointsToast points={Math.floor(score)} reason="Mots trouvés" icon="alphabetical-variant" visible={showToast} onHide={() => setShowToast(false)} />
    </SafeAreaView>
  );

  // ── PLAYING ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={s.topBar}>
        <TouchableOpacity onPress={endGame} style={{ padding: 4 }}>
          <Ionicons name="close" size={24} color={C.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>
          {mode === 'classic' ? 'Classique' : mode === 'survival' ? 'Brew Rush' : 'Café Express'}
        </Text>
        <View style={{ width: 24 }} />
      </View>
      {renderGrid()}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  center: { padding: 24, alignItems: 'center', paddingBottom: 48, flexGrow: 1, justifyContent: 'center' },
  backBtn: { alignSelf: 'flex-start', position: 'absolute', top: 24, left: 24, zIndex: 10, padding: 4 },
  eyebrow: { fontSize: 10, letterSpacing: 2, color: C.muted, fontFamily: 'Poppins_600SemiBold', marginBottom: 4 },
  bigTitle: { fontSize: 32, fontFamily: 'PlayfairDisplay_700Bold', color: C.primary, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: C.mocha, textAlign: 'center', fontFamily: 'Poppins_400Regular', marginBottom: 32, lineHeight: 22 },
  startBtn: { backgroundColor: C.primary, paddingVertical: 16, paddingHorizontal: 40, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 },
  startBtnTxt: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 16 },
  secondaryBtn: { paddingVertical: 14 },
  secondaryTxt: { color: C.mocha, fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
  
  modeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, padding: 16, borderRadius: 16, width: '100%', marginBottom: 16, borderWidth: 1, borderColor: C.border },
  modeIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  modeInfo: { flex: 1 },
  modeTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: C.primary },
  modeDesc: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: C.mocha, marginTop: 2 },
  
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 18, color: C.primary },
  
  gameContainer: { flex: 1, padding: 24, alignItems: 'center' },
  hud: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 24 },
  hudCol: { alignItems: 'flex-start' },
  hudColCenter: { alignItems: 'center' },
  hudColRight: { alignItems: 'flex-end' },
  hudLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 },
  hudValue: { fontFamily: 'JetBrainsMono_400Regular', fontSize: 20, color: C.primary, fontWeight: 'bold' },
  
  wordDisplay: { width: '100%', height: 48, backgroundColor: C.card, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 1, borderColor: C.border },
  wordCorrect: { backgroundColor: C.successBg, borderColor: C.success },
  wordWrong: { backgroundColor: C.errorBg, borderColor: C.error },
  wordDisplayTxt: { fontFamily: 'JetBrainsMono_400Regular', fontSize: 20, fontWeight: 'bold', color: C.primary, letterSpacing: 2 },
  
  gridArea: { backgroundColor: C.card, padding: 4, borderRadius: 12, borderWidth: 2, borderColor: C.primary, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  gridRow: { flexDirection: 'row' },
  cell: { margin: 2, backgroundColor: C.emptyCell, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  cellActive: { backgroundColor: C.primary, borderColor: C.accent },
  cellLast: { backgroundColor: C.mocha },
  cellTxt: { fontFamily: 'JetBrainsMono_400Regular', fontSize: 24, fontWeight: 'bold', color: C.primary },
  cellTxtActive: { color: '#fff' },
  
  foundList: { width: '100%', marginTop: 32 },
  foundTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: C.mocha, marginBottom: 8 },
  foundScroll: { flexDirection: 'row' },
  foundPill: { backgroundColor: C.card, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8, borderWidth: 1, borderColor: C.border },
  foundPillTxt: { fontFamily: 'JetBrainsMono_400Regular', fontSize: 12, color: C.primary, fontWeight: 'bold' },

  quitBtn: { marginTop: 'auto', paddingVertical: 12 },
  quitBtnTxt: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: C.error },
  
  scoreCircle: { backgroundColor: C.card, borderRadius: 80, width: 140, height: 140, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: C.primary, marginVertical: 32, flexDirection: 'row' },
  scoreBig: { fontSize: 48, fontFamily: 'PlayfairDisplay_700Bold', color: C.primary },
  scoreOf: { fontSize: 18, color: C.muted, fontFamily: 'Poppins_400Regular', marginLeft: 4, marginTop: 16 },
});
