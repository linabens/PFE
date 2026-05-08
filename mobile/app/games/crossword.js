import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  StatusBar, TextInput, ScrollView, Dimensions, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useGame } from '../../src/context/GameContext';
import { useLoyalty } from '../../src/context/LoyaltyContext';
import PointsToast from '../../src/components/PointsToast';

const { width } = Dimensions.get('window');
const GRID_SIZE = 8;
const CELL_SIZE = Math.floor((width - 32) / GRID_SIZE);

const C = {
  bg: '#FAF3EB', card: '#FFFFFF', primary: '#5C3221', accent: '#C09891',
  muted: '#B89A87', mocha: '#7A5C4D', border: '#EAD9C9', cream: '#F5E6D3',
  success: '#166534', successBg: '#DCFCE7', error: '#9B1C1C',
  activeCell: '#F4D8D8', highlight: '#FDECEB',
  emptyCell: '#EAD9C9',
};

const CROSSWORD_DATA = {
  words: [
    { id: '1H', answer: 'SAISON', clue: 'Printemps, été, automne ou hiver', direction: 'across', row: 1, col: 1, number: 1 },
    { id: '1V', answer: 'SABLE', clue: 'On le trouve sur la plage', direction: 'down', row: 1, col: 1, number: 1 },
    { id: '2V', answer: 'INFO', clue: 'Renseignement (abrév.)', direction: 'down', row: 1, col: 3, number: 2 },
    { id: '3V', answer: 'OURS', clue: 'Mammifère qui aime le miel', direction: 'down', row: 1, col: 5, number: 3 },
    { id: '4H', answer: 'LIONS', clue: 'Rois de la savane', direction: 'across', row: 4, col: 1, number: 4 }
  ]
};

export default function CrosswordScreen() {
  const router = useRouter();
  const { updateCrosswordScore } = useGame();
  const { isLoggedIn, earnPoints } = useLoyalty();

  const [phase, setPhase] = useState('intro'); // intro | playing | result
  const [grid, setGrid] = useState([]);
  const [userGrid, setUserGrid] = useState([]);
  
  const [selectedCell, setSelectedCell] = useState(null);
  const [direction, setDirection] = useState('across'); // 'across' | 'down'
  
  const [showToast, setShowToast] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const inputRef = useRef(null);

  useEffect(() => {
    // Generate grid data
    const newGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null).map(() => ({
      isActive: false, letter: '', number: null, wordIds: []
    })));
    
    CROSSWORD_DATA.words.forEach(word => {
      for (let i = 0; i < word.answer.length; i++) {
        const r = word.direction === 'across' ? word.row : word.row + i;
        const c = word.direction === 'across' ? word.col + i : word.col;
        newGrid[r][c].isActive = true;
        newGrid[r][c].letter = word.answer[i];
        if (i === 0 && !newGrid[r][c].number) newGrid[r][c].number = word.number;
        newGrid[r][c].wordIds.push(word.id);
      }
    });
    setGrid(newGrid);
    setUserGrid(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill('')));
  }, []);

  const startGame = () => {
    setUserGrid(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill('')));
    setPhase('playing');
    setSelectedCell({ r: 1, c: 0 }); // First letter of MOCHA
    setDirection('across');
    setErrorMsg('');
  };

  const handleCellPress = (r, c) => {
    const cell = grid[r][c];
    if (!cell.isActive) {
      inputRef.current?.blur();
      setSelectedCell(null);
      return;
    }

    if (selectedCell && selectedCell.r === r && selectedCell.c === c) {
      // Toggle direction if cell supports both
      const hasAcross = cell.wordIds.some(id => id.includes('H'));
      const hasDown = cell.wordIds.some(id => id.includes('V'));
      if (hasAcross && hasDown) {
        setDirection(d => d === 'across' ? 'down' : 'across');
      }
    } else {
      setSelectedCell({ r, c });
      // Auto-select direction based on available word at that cell
      const hasAcross = cell.wordIds.some(id => id.includes('H'));
      const hasDown = cell.wordIds.some(id => id.includes('V'));
      
      if (direction === 'across' && !hasAcross && hasDown) setDirection('down');
      else if (direction === 'down' && !hasDown && hasAcross) setDirection('across');
    }
    inputRef.current?.focus();
  };

  const moveCursor = (step) => {
    if (!selectedCell) return;
    let { r, c } = selectedCell;
    if (direction === 'across') c += step;
    else r += step;

    if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE && grid[r][c].isActive) {
      setSelectedCell({ r, c });
    }
  };

  const handleKeyPress = ({ nativeEvent }) => {
    if (!selectedCell) return;
    setErrorMsg('');

    if (nativeEvent.key === 'Backspace') {
      setUserGrid(prev => {
        const next = [...prev.map(row => [...row])];
        if (next[selectedCell.r][selectedCell.c] === '') {
          // If empty, move back then clear
          let { r, c } = selectedCell;
          if (direction === 'across') c -= 1;
          else r -= 1;
          if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE && grid[r][c].isActive) {
            next[r][c] = '';
            setSelectedCell({ r, c });
          }
        } else {
          // Clear current cell
          next[selectedCell.r][selectedCell.c] = '';
        }
        return next;
      });
    } else {
      const char = nativeEvent.key.toUpperCase();
      if (/^[A-Z]$/.test(char)) {
        setUserGrid(prev => {
          const next = [...prev.map(row => [...row])];
          next[selectedCell.r][selectedCell.c] = char;
          return next;
        });
        moveCursor(1);
      }
    }
  };

  const submit = () => {
    let isCorrect = true;
    let isComplete = true;

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (grid[r][c].isActive) {
          if (userGrid[r][c] === '') isComplete = false;
          if (userGrid[r][c] !== grid[r][c].letter) isCorrect = false;
        }
      }
    }

    if (!isComplete) {
      setErrorMsg('Veuillez remplir toutes les cases.');
      return;
    }

    if (isCorrect) {
      setPhase('result');
      updateCrosswordScore(150);
      if (isLoggedIn) {
        earnPoints(150, 'game', 'Mots Croisés');
        setShowToast(true);
      }
    } else {
      setErrorMsg('Certaines lettres sont incorrectes !');
    }
  };

  // Determine active clue
  let activeClue = '';
  if (selectedCell) {
    const cell = grid[selectedCell.r][selectedCell.c];
    const wordId = cell.wordIds.find(id => direction === 'across' ? id.includes('H') : id.includes('V')) || cell.wordIds[0];
    const word = CROSSWORD_DATA.words.find(w => w.id === wordId);
    if (word) {
      activeClue = `${word.number} ${word.direction === 'across' ? 'Horizontal' : 'Vertical'} : ${word.clue}`;
    }
  }

  // ── INTRO ────────────────────────────────────────────────────────────────
  if (phase === 'intro') return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={s.center}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={C.primary} />
        </TouchableOpacity>
        <MaterialCommunityIcons name="grid" size={72} color={C.accent} style={{ marginBottom: 16 }} />
        <Text style={s.eyebrow}>CROSSWORD</Text>
        <Text style={s.bigTitle}>Mots Croisés</Text>
        <Text style={s.subtitle}>Testez votre culture générale !{'\n'}Remplissez la grille pour gagner 150 points.</Text>
        <TouchableOpacity style={s.startBtn} onPress={startGame}>
          <Text style={s.startBtnTxt}>Commencer</Text>
          <Ionicons name="play" size={18} color="#fff" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );

  // ── RESULT ────────────────────────────────────────────────────────────────
  if (phase === 'result') return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.center}>
        <MaterialCommunityIcons name="trophy" size={72} color={C.primary} style={{ marginBottom: 12 }} />
        <Text style={s.bigTitle}>Félicitations !</Text>
        <Text style={s.subtitle}>Vous avez résolu la grille.</Text>
        <View style={s.scoreCircle}>
          <Text style={s.scoreBig}>150</Text>
          <Text style={s.scoreOf}>pts</Text>
        </View>
        <TouchableOpacity style={s.startBtn} onPress={startGame}>
          <Text style={s.startBtnTxt}>Rejouer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.secondaryBtn} onPress={() => router.back()}>
          <Text style={s.secondaryTxt}>Retour aux jeux</Text>
        </TouchableOpacity>
      </ScrollView>
      <PointsToast points={150} reason="Mots Croisés réussi" icon="grid" visible={showToast} onHide={() => setShowToast(false)} />
    </SafeAreaView>
  );

  // ── PLAYING ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="close" size={24} color={C.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Mots Croisés</Text>
        <View style={s.scorePill}>
          <Text style={s.scorePillTxt}>150 pts</Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={s.gameContainer} keyboardShouldPersistTaps="handled">
          
          {/* Active Clue Banner */}
          <View style={s.clueBanner}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color={C.primary} />
            <Text style={s.clueBannerTxt}>{activeClue || 'Sélectionnez une case'}</Text>
          </View>

          {/* Grid */}
          <View style={s.gridWrap}>
            {grid.map((row, r) => (
              <View key={`row-${r}`} style={s.gridRow}>
                {row.map((cell, c) => {
                  const isSelected = selectedCell && selectedCell.r === r && selectedCell.c === c;
                  const isHighlighted = selectedCell && cell.isActive && cell.wordIds.some(id => {
                    const activeCell = grid[selectedCell.r][selectedCell.c];
                    const activeWordId = activeCell.wordIds.find(wid => direction === 'across' ? wid.includes('H') : wid.includes('V')) || activeCell.wordIds[0];
                    return id === activeWordId;
                  });

                  if (!cell.isActive) {
                    return <View key={`cell-${r}-${c}`} style={s.cellEmpty} />;
                  }

                  return (
                    <TouchableOpacity
                      key={`cell-${r}-${c}`}
                      style={[
                        s.cell,
                        isHighlighted && s.cellHighlight,
                        isSelected && s.cellSelected
                      ]}
                      onPress={() => handleCellPress(r, c)}
                      activeOpacity={1}
                    >
                      {cell.number && <Text style={s.cellNumber}>{cell.number}</Text>}
                      <Text style={s.cellText}>{userGrid[r][c]}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Error Message */}
          {errorMsg ? <Text style={s.errorTxt}>{errorMsg}</Text> : null}

          {/* Submit Button */}
          <TouchableOpacity style={s.submitBtn} onPress={submit}>
            <Text style={s.submitTxt}>Vérifier la grille</Text>
          </TouchableOpacity>

          {/* Hidden Input for Keyboard */}
          <TextInput
            ref={inputRef}
            style={s.hiddenInput}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={1}
            value=""
            onKeyPress={handleKeyPress}
            onChangeText={() => {}} // Controlled by onKeyPress for easier backspace handling
            showSoftInputOnFocus={true}
          />

          {/* Clues List */}
          <View style={s.cluesContainer}>
            <View style={s.cluesCol}>
              <Text style={s.cluesTitle}>Horizontal</Text>
              {CROSSWORD_DATA.words.filter(w => w.direction === 'across').map(w => (
                <Text key={w.id} style={s.clueItem}>
                  <Text style={s.clueNum}>{w.number}.</Text> {w.clue}
                </Text>
              ))}
            </View>
            <View style={s.cluesCol}>
              <Text style={s.cluesTitle}>Vertical</Text>
              {CROSSWORD_DATA.words.filter(w => w.direction === 'down').map(w => (
                <Text key={w.id} style={s.clueItem}>
                  <Text style={s.clueNum}>{w.number}.</Text> {w.clue}
                </Text>
              ))}
            </View>
          </View>
          
        </ScrollView>
      </KeyboardAvoidingView>
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
  startBtn: { backgroundColor: C.primary, paddingVertical: 16, paddingHorizontal: 40, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  startBtnTxt: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 16 },
  secondaryBtn: { paddingVertical: 14 },
  secondaryTxt: { color: C.mocha, fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
  
  scoreCircle: { backgroundColor: C.card, borderRadius: 80, width: 140, height: 140, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: C.primary, marginVertical: 32, flexDirection: 'row' },
  scoreBig: { fontSize: 48, fontFamily: 'PlayfairDisplay_700Bold', color: C.primary },
  scoreOf: { fontSize: 18, color: C.muted, fontFamily: 'Poppins_400Regular', marginLeft: 4, marginTop: 16 },
  
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 18, color: C.primary },
  scorePill: { backgroundColor: C.bg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: C.border },
  scorePillTxt: { fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: C.primary },
  
  gameContainer: { padding: 16, paddingBottom: 40, alignItems: 'center' },
  
  clueBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, padding: 16, borderRadius: 12, width: '100%', marginBottom: 20, borderWidth: 1, borderColor: C.border, shadowColor: C.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  clueBannerTxt: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: C.mainText, flex: 1, lineHeight: 18 },
  
  gridWrap: { backgroundColor: C.card, padding: 4, borderRadius: 8, borderWidth: 2, borderColor: C.primary },
  gridRow: { flexDirection: 'row' },
  cellEmpty: { width: CELL_SIZE, height: CELL_SIZE, backgroundColor: C.emptyCell, margin: 1, borderRadius: 4 },
  cell: { width: CELL_SIZE, height: CELL_SIZE, backgroundColor: '#FFFFFF', margin: 1, borderRadius: 4, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  cellHighlight: { backgroundColor: C.highlight, borderColor: C.accent },
  cellSelected: { backgroundColor: C.activeCell, borderColor: C.primary, borderWidth: 2 },
  cellNumber: { position: 'absolute', top: 2, left: 3, fontSize: 9, fontFamily: 'Poppins_600SemiBold', color: C.secondary },
  cellText: { fontSize: CELL_SIZE * 0.5, fontFamily: 'JetBrainsMono_400Regular', fontWeight: 'bold', color: C.primary },
  
  errorTxt: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: C.error, marginTop: 16, textAlign: 'center' },
  
  submitBtn: { backgroundColor: C.primary, width: '100%', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 24, marginBottom: 32 },
  submitTxt: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 16 },
  
  hiddenInput: { position: 'absolute', width: 1, height: 1, opacity: 0 },
  
  cluesContainer: { width: '100%', flexDirection: 'column', gap: 24 },
  cluesCol: { gap: 8 },
  cluesTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 16, color: C.primary, borderBottomWidth: 1, borderBottomColor: C.border, paddingBottom: 4, marginBottom: 4 },
  clueItem: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: C.mocha, lineHeight: 20 },
  clueNum: { fontFamily: 'Poppins_600SemiBold', color: C.primary },
});
