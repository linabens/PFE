import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GameContext = createContext({});

const INITIAL_SCORES = {
  memory: { bestTime: null, gamesPlayed: 0 },
  quiz: { bestScore: 0, gamesPlayed: 0 },
  wordScramble: { bestScore: 0, gamesPlayed: 0 },
  puzzle: { bestTime3x3: null, bestTime4x4: null, gamesPlayed: 0 },
  crossword: { bestScore: 0, gamesPlayed: 0 },
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

  return (
    <GameContext.Provider value={{ scores, updateMemoryScore, updateQuizScore, updateWordScrambleScore, updatePuzzleScore, updateCrosswordScore }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
};
