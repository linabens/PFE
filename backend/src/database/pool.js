const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool(config.db);

pool.on('error', (err) => {
  console.error('Database error:', err);
});

module.exports = pool;
