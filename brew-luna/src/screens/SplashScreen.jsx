import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coffee, AlertCircle } from 'lucide-react';
import { useSessionStore } from '../store/useSessionStore';
import { sessionApi } from '../api/sessionApi';
import { getQrFromUrl, clearUrlParams } from '../utils/parseQrUrl';

/**
 * BREW LUNA — Splash Screen
 * Handles initial session logic from QR codes
 */

const SplashScreen = () => {
  const navigate = useNavigate();
  const { setSession, token, isExpired } = useSessionStore();
  const [error, setError] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState('Initializing brew...');

  useEffect(() => {
    const initialize = async () => {
      const qrCode = getQrFromUrl();

      // Case 1: Scanning a new QR code (overwrites old session)
      if (qrCode) {
        setLoadingStatus('Grinding fresh beans...');
        try {
          const response = await sessionApi.scanQr(qrCode);
          if (response.success) {
            setSession(response.data);
            clearUrlParams();
            // Small delay for the animation
            setTimeout(() => navigate('/home'), 1500);
          } else {
            setError(response.error || 'Invalid QR Code');
          }
        } catch (err) {
          setError(err.message || 'Failed to connect to Brew Luna');
        }
        return;
      }

      // Case 2: Existing valid session
      if (token && !isExpired()) {
        setLoadingStatus('Welcome back...');
        setTimeout(() => navigate('/home'), 1000);
        return;
      }

      // Case 3: No session and no QR code
      setLoadingStatus(null);
      setError('Please scan a QR code on your coffee table to start ordering.');
    };

    initialize();
  }, [navigate, setSession, token, isExpired]);

  return (
    <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', backgroundColor: 'var(--color-espresso)', color: 'var(--color-cream)' }}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex-center"
        style={{ flexDirection: 'column' }}
      >
        <div style={{ 
          width: '100px', 
          height: '100px', 
          borderRadius: '50%', 
          backgroundColor: 'var(--color-mocha)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
          boxShadow: '0 0 40px rgba(107, 58, 42, 0.5)'
        }}>
          <Coffee size={48} color="var(--color-gold)" />
        </div>

        <h1 style={{ 
          fontFamily: 'var(--font-display)', 
          fontSize: 'var(--text-4xl)', 
          letterSpacing: '2px',
          marginBottom: '8px'
        }}>
          BREW LUNA
        </h1>
        <p style={{ color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '4px', fontSize: 'var(--text-xs)', marginBottom: '40px' }}>
          Coffee Shop Experience
        </p>

        {error ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center container"
            style={{ color: 'var(--color-error)', maxWidth: '300px' }}
          >
            <AlertCircle size={24} style={{ marginBottom: '12px' }} />
            <p style={{ fontSize: 'var(--text-sm)' }}>{error}</p>
            <button 
              onClick={() => window.location.reload()}
              style={{ marginTop: '20px', color: 'var(--color-gold)', fontWeight: 'bold', borderBottom: '1px solid var(--color-gold)' }}
            >
              Try Again
            </button>
          </motion.div>
        ) : (
          <div className="text-center">
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}
            >
              {loadingStatus}
            </motion.div>
          </div>
        )}
      </motion.div>

      {/* Modern Wave Decoration */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', overflow: 'hidden', lineHeight: 0 }}>
        <svg viewBox="0 0 500 150" preserveAspectRatio="none" style={{ height: '80px', width: '100%' }}>
          <path d="M-5.36,68.58 C149.99,150.00 271.49,-50.00 505.36,68.58 L500.00,150.00 L0.00,150.00 Z" style={{ stroke: 'none', fill: 'var(--color-mocha)', opacity: 0.2 }}></path>
        </svg>
      </div>
    </div>
  );
};

export default SplashScreen;
