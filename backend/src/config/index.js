require('dotenv').config();

module.exports = {
  // Server
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_NAME || 'coffee_shop',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  },

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'change-this-secret',

  // Sessions (QR / présence café)
  // Durée max d'une session depuis la création (scan QR)
  sessionMaxAgeMinutes: parseInt(process.env.SESSION_MAX_AGE_MINUTES, 10) || 120,
  // Inactivité : au-delà, la session est refusée (comme si le client était parti)
  sessionIdleTimeoutMinutes: parseInt(process.env.SESSION_IDLE_TIMEOUT_MINUTES, 10) || 45,
  // Si true, le scan QR doit inclure ts + sig (voir utils/qrSession.js)
  qrSessionRequireSignature: process.env.QR_SESSION_REQUIRE_SIGNATURE === 'true',

  // Anti-spam commandes (par session)
  orderRateLimitWindowMs: parseInt(process.env.ORDER_RATE_LIMIT_WINDOW_MS, 10) || 10 * 60 * 1000,
  orderRateLimitMax: parseInt(process.env.ORDER_RATE_LIMIT_MAX, 10) || 20,

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
};
