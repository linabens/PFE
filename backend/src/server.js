const express = require('express');
const cors = require('cors');
const config = require('./config');

const app = express();

// Allow requests from the Vite dev server (any localhost port) and the
// mobile app's bundler origin. In production, lock this down to your domain.
const ALLOWED_ORIGINS = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/,  // LAN IPs for mobile dev
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    const allowed = ALLOWED_ORIGINS.some((pattern) => pattern.test(origin));
    callback(allowed ? null : new Error(`CORS blocked: ${origin}`), allowed);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-token'],
}));
app.use(express.json());
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Started`);
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Finished (${res.statusCode}) - ${duration}ms`);
  });
  next();
});

// Routes de test
app.get('/', (req, res) => {
  res.json({ message: 'Coffee Shop API - Backend démarré!', status: 'ok' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes API
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const assistanceRoutes = require('./routes/assistanceRoutes');
const gameRoutes = require('./routes/gameRoutes');
const authRoutes = require('./routes/authRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const newsRoutes = require('./routes/newsRoutes');
const entertainmentRoutes = require('./routes/entertainmentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const loyaltyRoutes = require('./routes/loyaltyRoutes');
const tableRoutes = require('./routes/tableRoutes');
const promotionRoutes = require('./routes/promotionRoutes');
const chatRoutes = require('./routes/chatRoutes');


app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes); // public session endpoints
app.use('/api/news', newsRoutes);
app.use('/api/entertainment', entertainmentRoutes);
app.use('/api/admin', adminRoutes);


app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/assistance', assistanceRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/chat', chatRoutes);

// Gestion des erreurs
const { errorHandler, notFoundHandler } = require('./middleware');

app.use(notFoundHandler);
app.use(errorHandler);

// Démarrage du serveur
const PORT = config.port || 3000;

try {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
    console.log(`📍 http://127.0.0.1:${PORT}`);
  });
} catch (error) {
  console.error('❌ Erreur au démarrage du serveur:', error);
  process.exit(1);
}

module.exports = app;

