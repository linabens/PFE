import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gamepad2, Trophy, Quote, Brain } from 'lucide-react';

/**
 * BREW LUNA — Entertainment Screen
 * Hub for games and quotes
 */

const EntertainmentScreen = () => {
  const navigate = useNavigate();

  const games = [
    {
      id: 'quiz',
      title: 'Coffee Quiz',
      desc: 'Test your knowledge of the bean!',
      icon: Brain,
      color: 'var(--color-mocha)',
      path: '/fun/quiz'
    },
    {
      id: 'puzzle',
      title: 'Coffee Puzzle',
      desc: 'Arrange the pieces of art.',
      icon: Gamepad2,
      color: 'var(--color-sienna)',
      path: '/fun/puzzle'
    },
    {
      id: 'quotes',
      title: 'Daily Quotes',
      desc: 'Inspiration with every sip.',
      icon: Quote,
      color: 'var(--color-gold-dark)',
      path: '/fun/quotes'
    }
  ];

  return (
    <div style={{ padding: 'var(--space-6) var(--space-4)', paddingBottom: '120px' }}>
      <header style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: 'var(--text-3xl)', color: 'var(--color-espresso)' }}>Play Zone</h1>
        <p style={{ color: 'var(--text-muted)' }}>Stay entertained while we brew.</p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {games.map((game, idx) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => navigate(game.path)}
            style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-5)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-4)',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--border-light)',
              cursor: 'pointer'
            }}
          >
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-foam)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: game.color
            }}>
              <game.icon size={32} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold' }}>{game.title}</h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{game.desc}</p>
            </div>
            <div style={{ color: 'var(--border-strong)' }}>
              <Trophy size={20} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Suggestion Section */}
      <div style={{ 
        marginTop: 'var(--space-10)', 
        padding: 'var(--space-6)', 
        background: 'var(--color-parchment)', 
        borderRadius: 'var(--radius-lg)',
        border: '1px dashed var(--color-latte)'
      }}>
        <h4 style={{ fontSize: 'var(--text-base)', marginBottom: '8px' }}>Challenge for points?</h4>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Coming Soon: Earn loyalty points for every high score you achieve in the Brew Luna games!
        </p>
      </div>
    </div>
  );
};

export default EntertainmentScreen;
