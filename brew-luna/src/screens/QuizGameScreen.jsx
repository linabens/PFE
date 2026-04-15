import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Trophy, AlertCircle, CheckCircle2 } from 'lucide-react';
import quizData from '../data/games/quizzes.json';

/**
 * BREW LUNA — Quiz Game Screen
 * 3-difficulty coffee trivia game
 */

const QuizGameScreen = () => {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState(null); // 'easy', 'medium', 'hard'
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const handleDifficultySelect = (level) => {
    setDifficulty(level);
    setCurrentIndex(0);
    setScore(0);
    setShowResult(false);
  };

  const handleOptionSelect = (idx) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);

    const isCorrect = idx === quizData[difficulty][currentIndex].answer;
    if (isCorrect) setScore(score + 1);

    setTimeout(() => {
      if (currentIndex < quizData[difficulty].length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSelectedOption(null);
        setIsAnswered(false);
      } else {
        setShowResult(true);
      }
    }, 1500);
  };

  const resetGame = () => {
    setDifficulty(null);
    setShowResult(false);
  };

  // ── 1. Difficulty Selection View ──
  if (!difficulty) {
    return (
      <div style={{ padding: 'var(--space-6) var(--space-4)', height: '100vh' }}>
        <button onClick={() => navigate(-1)} style={{ marginBottom: '24px' }}><ChevronLeft /></button>
        <h1 style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-2)' }}>Coffee Quiz</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-10)' }}>How much do you really know about coffee?</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {['easy', 'medium', 'hard'].map((level) => (
            <motion.button
              key={level}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleDifficultySelect(level)}
              style={{
                padding: '24px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-light)',
                textAlign: 'left',
                boxShadow: 'var(--shadow-sm)',
                textTransform: 'capitalize'
              }}
            >
              <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: '4px' }}>{level}</h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                {level === 'easy' ? 'For the average enthusiast.' : level === 'medium' ? 'For the daily drinker.' : 'For the master barista.'}
              </p>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  // ── 2. Results View ──
  if (showResult) {
    const total = quizData[difficulty].length;
    const percentage = (score / total) * 100;

    return (
      <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', padding: 'var(--space-10)' }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
          <Trophy size={80} color="var(--color-gold)" style={{ marginBottom: '24px' }} />
        </motion.div>
        <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: '8px' }}>Round Over!</h2>
        <p style={{ fontSize: 'var(--text-lg)', marginBottom: '40px' }}>Your Score: <span style={{ fontWeight: 'bold', color: 'var(--color-mocha)' }}>{score} / {total}</span></p>
        
        <button 
          onClick={resetGame}
          style={{ width: '100%', padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-espresso)', color: 'white', fontWeight: 'bold', marginBottom: '12px' }}
        >
          Play Again
        </button>
        <button 
          onClick={() => navigate('/fun')}
          style={{ width: '100%', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontWeight: 'bold' }}
        >
          Return to Hub
        </button>
      </div>
    );
  }

  // ── 3. Active Game View ──
  const currentQuestion = quizData[difficulty][currentIndex];

  return (
    <div style={{ padding: 'var(--space-6) var(--space-4)', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <button onClick={resetGame}><ChevronLeft /></button>
        <div style={{ fontWeight: 'bold' }}>Q {currentIndex + 1} of {quizData[difficulty].length}</div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-mocha)', fontWeight: 'bold' }}>{difficulty.toUpperCase()}</div>
      </div>

      <div style={{ flex: 1 }}>
        <motion.h2 
          key={currentIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontSize: 'var(--text-2xl)', marginBottom: '40px', lineHeight: 1.4 }}
        >
          {currentQuestion.question}
        </motion.h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {currentQuestion.options.map((option, idx) => {
            let bgColor = 'var(--bg-card)';
            let textColor = 'var(--text-primary)';
            let borderColor = 'var(--border-light)';

            if (isAnswered) {
              if (idx === currentQuestion.answer) {
                bgColor = 'var(--color-success-bg)';
                borderColor = 'var(--color-success)';
              } else if (idx === selectedOption) {
                bgColor = 'var(--color-error-bg)';
                borderColor = 'var(--color-error)';
              }
            } else if (selectedOption === idx) {
              borderColor = 'var(--color-mocha)';
            }

            return (
              <motion.button
                key={idx}
                whileTap={{ scale: 0.98 }}
                disabled={isAnswered}
                onClick={() => handleOptionSelect(idx)}
                style={{
                  padding: '20px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: bgColor,
                  border: `2px solid ${borderColor}`,
                  textAlign: 'left',
                  fontSize: 'var(--text-base)',
                  color: textColor,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'background-color 0.2s'
                }}
              >
                <span>{option}</span>
                {isAnswered && idx === currentQuestion.answer && <CheckCircle2 size={20} color="var(--color-success)" />}
                {isAnswered && idx === selectedOption && idx !== currentQuestion.answer && <AlertCircle size={20} color="var(--color-error)" />}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Progress Bar Top */}
      <div style={{ height: '4px', background: 'var(--border-light)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginTop: '40px' }}>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / quizData[difficulty].length) * 100}%` }}
          style={{ height: '100%', background: 'var(--color-mocha)' }} 
        />
      </div>
    </div>
  );
};

export default QuizGameScreen;
