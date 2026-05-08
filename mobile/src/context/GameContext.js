import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GameContext = createContext({});

const INITIAL_SCORES = {
  memory: { bestTime: null, gamesPlayed: 0 },
  quiz: { bestScore: 0, gamesPlayed: 0 },
  wordScramble: { bestScore: 0, gamesPlayed: 0 },
  ticTacToe: { wins: 0, losses: 0, draws: 0 },
  puzzle: { bestTime3x3: null, bestTime4x4: null, gamesPlayed: 0 },
  crossword: { bestScore: 0, gamesPlayed: 0 },
  spinWheel: { spinsToday: 0, lastSpinDate: null, coupons: [] },
};

export function GameProvider({ children }) {
  const [scores, setScores] = useState(INITIAL_SCORES);

  useEffect(() => { loadScores(); }, []);

  const loadScores = async () => {
    try {
      const stored = await AsyncStorage.getItem('coffeeTimeGameScores');
      if (stored) setScores(JSON.parse(stored));
    } catch {}
  };

  const saveScores = async (next) => {
    try {
      await AsyncStorage.setItem('coffeeTimeGameScores', JSON.stringify(next));
      setScores(next);
    } catch {}
  };

  const updateMemoryScore = (timeInSeconds) => {
    const next = { ...scores, memory: { ...scores.memory } };
    if (!next.memory.bestTime || timeInSeconds < next.memory.bestTime)
      next.memory.bestTime = timeInSeconds;
    next.memory.gamesPlayed += 1;
    saveScores(next);
  };

  const updateQuizScore = (score) => {
    const next = { ...scores, quiz: { ...scores.quiz } };
    if (score > next.quiz.bestScore) next.quiz.bestScore = score;
    next.quiz.gamesPlayed += 1;
    saveScores(next);
  };

  const updateWordScrambleScore = (score) => {
    const next = { ...scores, wordScramble: { ...scores.wordScramble } };
    if (score > next.wordScramble.bestScore) next.wordScramble.bestScore = score;
    next.wordScramble.gamesPlayed += 1;
    saveScores(next);
  };

  const updateTicTacToeStats = (result) => {
    const next = { ...scores, ticTacToe: { ...scores.ticTacToe } };
    if (result === 'win') next.ticTacToe.wins += 1;
    else if (result === 'loss') next.ticTacToe.losses += 1;
    else next.ticTacToe.draws += 1;
    saveScores(next);
  };

  const updatePuzzleScore = (timeInSeconds, difficulty) => {
    const next = { ...scores, puzzle: { ...scores.puzzle } };
    const key = difficulty === '3x3' ? 'bestTime3x3' : 'bestTime4x4';
    if (!next.puzzle[key] || timeInSeconds < next.puzzle[key])
      next.puzzle[key] = timeInSeconds;
    next.puzzle.gamesPlayed += 1;
    saveScores(next);
  };

  const updateCrosswordScore = (score) => {
    const next = { ...scores, crossword: { ...scores.crossword } };
    if (score > next.crossword.bestScore) next.crossword.bestScore = score;
    next.crossword.gamesPlayed += 1;
    saveScores(next);
  };

  const spinsRemaining = () => {
    const today = new Date().toDateString();
    if (!scores.spinWheel.lastSpinDate || scores.spinWheel.lastSpinDate !== today) return 3;
    return Math.max(0, 3 - scores.spinWheel.spinsToday);
  };

  const recordWheelSpin = (prize) => {
    const next = { ...scores, spinWheel: { ...scores.spinWheel, coupons: [...scores.spinWheel.coupons] } };
    const today = new Date().toDateString();
    if (next.spinWheel.lastSpinDate !== today) {
      next.spinWheel.spinsToday = 1;
      next.spinWheel.lastSpinDate = today;
    } else {
      next.spinWheel.spinsToday += 1;
    }
    if (prize !== 'BETTER LUCK') {
      next.spinWheel.coupons.push({
        id: `CT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        prize,
        date: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        used: false,
      });
    }
    saveScores(next);
  };

  const markCouponUsed = (couponId) => {
    const next = { ...scores, spinWheel: { ...scores.spinWheel, coupons: scores.spinWheel.coupons.map(c => c.id === couponId ? { ...c, used: true } : c) } };
    saveScores(next);
  };

  return (
    <GameContext.Provider value={{ scores, updateMemoryScore, updateQuizScore, updateWordScrambleScore, updateTicTacToeStats, updatePuzzleScore, updateCrosswordScore, spinsRemaining, recordWheelSpin, markCouponUsed }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
};
