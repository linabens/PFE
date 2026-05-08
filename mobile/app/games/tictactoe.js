import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  StatusBar, Animated, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useGame } from '../../src/context/GameContext';

const C = {
  bg: '#FAF3EB', card: '#FFFFFF', primary: '#5C3221', accent: '#C09891',
  muted: '#B89A87', mocha: '#7A5C4D', border: '#EAD9C9', cream: '#F5E6D3',
  success: '#059669', error: '#C0392B', gold: '#D97706',
};

const PLAYER = 'X';
const AI     = 'O';

function checkWinner(board) {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6],
  ];
  for (const [a,b,c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c])
      return { winner: board[a], line: [a,b,c] };
  }
  if (board.every(Boolean)) return { winner: 'draw', line: [] };
  return null;
}

function minimax(board, isMax, depth = 0) {
  const result = checkWinner(board);
  if (result) {
    if (result.winner === AI) return 10 - depth;
    if (result.winner === PLAYER) return depth - 10;
    return 0;
  }
  const scores = [];
  board.forEach((cell, i) => {
    if (cell) return;
    const next = [...board];
    next[i] = isMax ? AI : PLAYER;
    scores.push(minimax(next, !isMax, depth + 1));
  });
  return isMax ? Math.max(...scores) : Math.min(...scores);
}

function getBestMove(board, difficulty) {
  const empty = board.map((c, i) => c ? null : i).filter(i => i !== null);
  if (!empty.length) return -1;
  if (difficulty === 'easy') return empty[Math.floor(Math.random() * empty.length)];
  if (difficulty === 'medium' && Math.random() < 0.5)
    return empty[Math.floor(Math.random() * empty.length)];
  let best = -Infinity, move = empty[0];
  for (const i of empty) {
    const next = [...board];
    next[i] = AI;
    const score = minimax(next, false);
    if (score > best) { best = score; move = i; }
  }
  return move;
}

export default function TicTacToeScreen() {
  const router = useRouter();
  const { scores, updateTicTacToeStats } = useGame();

  const [board, setBoard]       = useState(Array(9).fill(null));
  const [status, setStatus]     = useState('playing'); // playing | won | lost | draw
  const [winLine, setWinLine]   = useState([]);
  const [thinking, setThinking] = useState(false);
  const [difficulty, setDiff]   = useState('medium');
  const [aiThinking, setAiThinking] = useState(false);

  const cellAnims = useRef(Array(9).fill(null).map(() => new Animated.Value(0))).current;

  const { wins, losses, draws } = scores.ticTacToe;
  const total = wins + losses + draws;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  const animateCell = (idx) => {
    cellAnims[idx].setValue(0);
    Animated.spring(cellAnims[idx], { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }).start();
  };

  const handlePress = (idx) => {
    if (board[idx] || status !== 'playing' || aiThinking) return;

    const next = [...board];
    next[idx] = PLAYER;
    animateCell(idx);
    setBoard(next);

    const res = checkWinner(next);
    if (res) {
      endGame(res, next);
      return;
    }

    setAiThinking(true);
    setTimeout(() => {
      const aiMove = getBestMove(next, difficulty);
      if (aiMove === -1) { setAiThinking(false); return; }
      const next2 = [...next];
      next2[aiMove] = AI;
      animateCell(aiMove);
      setBoard(next2);
      setAiThinking(false);
      const res2 = checkWinner(next2);
      if (res2) endGame(res2, next2);
    }, 600);
  };

  const endGame = (res) => {
    if (res.winner === PLAYER) {
      setStatus('won');
      setWinLine(res.line);
      updateTicTacToeStats('win');
    } else if (res.winner === AI) {
      setStatus('lost');
      setWinLine(res.line);
      updateTicTacToeStats('loss');
    } else {
      setStatus('draw');
      updateTicTacToeStats('draw');
    }
  };

  const reset = () => {
    setBoard(Array(9).fill(null));
    setStatus('playing');
    setWinLine([]);
    setAiThinking(false);
    cellAnims.forEach(a => a.setValue(0));
  };

  const statusText = () => {
    if (aiThinking) return 'AI is thinking…';
    if (status === 'won') return 'You win!';
    if (status === 'lost') return 'AI wins!';
    if (status === 'draw') return "It's a draw!";
    return 'Your turn';
  };

  const statusColor = () => {
    if (status === 'won') return C.success;
    if (status === 'lost') return C.error;
    if (status === 'draw') return C.gold;
    return C.mocha;
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={C.primary} />
        </TouchableOpacity>
        <Text style={s.title}>Tic-Tac-Toe</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={s.body}>

        {/* Difficulty */}
        <View style={s.diffRow}>
          {['easy','medium','hard'].map(d => (
            <TouchableOpacity
              key={d}
              style={[s.diffBtn, difficulty === d && s.diffBtnActive]}
              onPress={() => { setDiff(d); reset(); }}
            >
              <Text style={[s.diffTxt, difficulty === d && s.diffTxtActive]}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          {[['W', wins, C.success], ['D', draws, C.gold], ['L', losses, C.error]].map(([lbl, val, color]) => (
            <View key={lbl} style={s.statBox}>
              <Text style={[s.statNum, { color }]}>{val}</Text>
              <Text style={s.statLbl}>{lbl}</Text>
            </View>
          ))}
          <View style={s.statBox}>
            <Text style={[s.statNum, { color: C.primary }]}>{winRate}%</Text>
            <Text style={s.statLbl}>Win Rate</Text>
          </View>
        </View>

        {/* Status */}
        <Text style={[s.statusTxt, { color: statusColor() }]}>{statusText()}</Text>

        {/* Board */}
        <View style={s.board}>
          {board.map((cell, idx) => {
            const inLine = winLine.includes(idx);
            return (
              <TouchableOpacity
                key={idx}
                style={[s.cell, inLine && s.cellWin]}
                onPress={() => handlePress(idx)}
                activeOpacity={0.7}
                disabled={!!cell || status !== 'playing' || aiThinking}
              >
                <Animated.View style={{ transform: [{ scale: cellAnims[idx] }] }}>
                  {cell === PLAYER && (
                    <MaterialCommunityIcons name="coffee" size={38} color={C.primary} />
                  )}
                  {cell === AI && (
                    <MaterialCommunityIcons name="cookie-outline" size={38} color={C.accent} />
                  )}
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Legend */}
        <View style={s.legendRow}>
          <View style={s.legendItem}>
            <MaterialCommunityIcons name="coffee" size={20} color={C.primary} />
            <Text style={s.legendTxt}>You</Text>
          </View>
          <Text style={s.legendSep}>vs</Text>
          <View style={s.legendItem}>
            <MaterialCommunityIcons name="cookie-outline" size={20} color={C.accent} />
            <Text style={s.legendTxt}>AI</Text>
          </View>
        </View>

        {/* Restart */}
        <TouchableOpacity style={s.restartBtn} onPress={reset}>
          <Ionicons name="refresh" size={18} color={C.primary} />
          <Text style={s.restartTxt}>New Game</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const CELL = 100;

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  title: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22, color: C.primary },
  body: { padding: 20, alignItems: 'center', gap: 20, paddingBottom: 48 },
  diffRow: { flexDirection: 'row', gap: 8 },
  diffBtn: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card },
  diffBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  diffTxt: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: C.mocha },
  diffTxtActive: { color: '#fff' },
  statsRow: { flexDirection: 'row', gap: 12 },
  statBox: { backgroundColor: C.card, borderRadius: 14, padding: 12, alignItems: 'center', minWidth: 64, borderWidth: 1, borderColor: C.border },
  statNum: { fontFamily: 'JetBrainsMono_400Regular', fontSize: 20 },
  statLbl: { fontFamily: 'Poppins_400Regular', fontSize: 10, color: C.muted, marginTop: 2 },
  statusTxt: { fontFamily: 'Poppins_600SemiBold', fontSize: 18 },
  board: { width: CELL * 3 + 8, flexDirection: 'row', flexWrap: 'wrap', gap: 4, backgroundColor: C.border, borderRadius: 16, padding: 4 },
  cell: { width: CELL, height: CELL, backgroundColor: C.card, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cellWin: { backgroundColor: C.cream },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendTxt: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: C.mocha },
  legendSep: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: C.muted },
  restartBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 32, backgroundColor: C.card, borderRadius: 16, borderWidth: 1.5, borderColor: C.border },
  restartTxt: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: C.primary },
});
