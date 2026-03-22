const express = require('express');
const cors = require('cors');
const config = require('./config');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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

